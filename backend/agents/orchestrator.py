"""
OrchestratorAgent — central coordinator that touches the DB and delegates
to all other agents. No direct Claude API calls happen here.
"""
import json
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session as DBSession

from models.user import User, UserProfile
from models.session import Session, TopicSelection
from models.scenario import Scenario, Response, Evaluation
from models.progress import ProgressSnapshot
from config import get_level_from_xp, VERDICT_SCORES
from agents.profiler_agent import ProfilerAgent
from agents.scenario_generator_agent import ScenarioGeneratorAgent
from agents.evaluator_agent import EvaluatorAgent
from agents.progress_narrator_agent import ProgressNarratorAgent
from agents.curriculum_planner_agent import CurriculumPlannerAgent


class OrchestratorAgent:

    def __init__(self):
        self.profiler = ProfilerAgent()
        self.generator = ScenarioGeneratorAgent()
        self.evaluator = EvaluatorAgent()
        self.narrator = ProgressNarratorAgent()
        self.planner = CurriculumPlannerAgent()

    def _recent_scenario_summaries(self, db: DBSession, user_id: int) -> list:
        """Last 5 scenarios for user, oldest-first among that window (concise fields)."""
        rows = (
            db.query(Scenario)
            .filter(Scenario.user_id == user_id)
            .order_by(Scenario.generated_at.desc())
            .limit(5)
            .all()
        )
        summaries = []
        for s in reversed(rows):
            data = json.loads(s.scenario_json)
            opts = data.get("options") or []
            summaries.append({
                "id": data.get("id"),
                "title": data.get("title"),
                "topic": data.get("topic") or s.topic_id,
                "decision_type": data.get("decision_type"),
                "optimal_key": data.get("optimal_key"),
                "question_snippet": (data.get("question") or "")[:160],
                "description_preview": (data.get("description") or "")[:160],
                "option_label_starts": [
                    (o.get("label") or "")[:50] for o in opts[:4]
                ],
            })
        return summaries

    def _last_3_optimal_keys_chrono(self, db: DBSession, user_id: int) -> list:
        """Optimal keys for the 3 most recent scenarios, oldest-first (last element = newest)."""
        rows = (
            db.query(Scenario)
            .filter(Scenario.user_id == user_id)
            .order_by(Scenario.generated_at.desc())
            .limit(3)
            .all()
        )
        keys = []
        for s in reversed(rows):
            data = json.loads(s.scenario_json)
            ok = data.get("optimal_key")
            if ok:
                keys.append(ok)
        return keys

    # ------------------------------------------------------------------
    # begin_session
    # ------------------------------------------------------------------
    def begin_session(self, db: DBSession, user_id: int) -> dict:
        user: User = db.query(User).filter(User.id == user_id).first()
        profile: UserProfile = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()

        topic_rows = db.query(TopicSelection).filter(
            TopicSelection.user_id == user_id
        ).all()
        topic_selections = [t.topic_id for t in topic_rows]

        # Collect IDs of all previous scenarios so the generator avoids repeats
        prev_scenario_rows = db.query(Scenario).filter(
            Scenario.user_id == user_id
        ).all()
        prev_scenario_ids = [
            json.loads(s.scenario_json).get("id", str(s.id))
            for s in prev_scenario_rows
        ]

        profile_dict = json.loads(profile.profile_json or "{}")

        # Call curriculum planner
        plan = self.planner.plan(
            user_type=user.user_type,
            topic_selections=topic_selections,
            profile_json=profile_dict,
            completed_scenario_ids=prev_scenario_ids,
        )

        # Persist session
        session_obj = Session(
            user_id=user_id,
            status="active",
            topic_focus=plan.get("next_scenarios", [{}])[0].get("topic", "General"),
            difficulty_tier=plan.get("next_scenarios", [{}])[0].get("difficulty_tier", "Foundational"),
            session_plan_json=json.dumps(plan),
            started_at=datetime.utcnow(),
        )
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)

        # Generate first scenario
        first_brief = plan["next_scenarios"][0]
        recent_scenarios = self._recent_scenario_summaries(db, user_id)
        last_3_optimal_keys = self._last_3_optimal_keys_chrono(db, user_id)
        scenario_data = self.generator.generate(
            user_type=user.user_type,
            topic=first_brief["topic"],
            profile_json=profile_dict,
            recent_scenarios=recent_scenarios,
            last_3_optimal_keys=last_3_optimal_keys,
        )
        scenario_data.setdefault("question", scenario_data.get("description", ""))

        scenario_row = Scenario(
            session_id=session_obj.id,
            user_id=user_id,
            scenario_json=json.dumps(scenario_data),
            topic_id=first_brief["topic"],
            difficulty_tier=first_brief["difficulty_tier"],
        )
        db.add(scenario_row)
        db.commit()
        db.refresh(scenario_row)

        scenario_data["_db_id"] = scenario_row.id
        return {
            "session_id": session_obj.id,
            "scenario": scenario_data,
            "plan_summary": {
                "plan_id": plan.get("plan_id"),
                "session_goal": plan.get("session_goal"),
                "total_scenarios": plan.get("total_scenarios"),
                "topics": [s["topic"] for s in plan.get("next_scenarios", [])],
                "next_scenarios": plan.get("next_scenarios", []),
            },
        }

    # ------------------------------------------------------------------
    # handle_submission
    # ------------------------------------------------------------------
    def handle_submission(
        self,
        db: DBSession,
        session_id: int,
        scenario_id: int,
        chosen_key: str,
        time_taken_sec: int,
    ) -> dict:
        session_obj: Session = db.query(Session).filter(Session.id == session_id).first()
        scenario_row: Scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
        user: User = db.query(User).filter(User.id == session_obj.user_id).first()
        profile: UserProfile = db.query(UserProfile).filter(
            UserProfile.user_id == session_obj.user_id
        ).first()

        scenario_data = json.loads(scenario_row.scenario_json)
        profile_dict = json.loads(profile.profile_json or "{}")

        # Evaluate the submission
        decision_type = scenario_data.get(
            "decision_type", "general incident response judgment"
        )
        evaluation_result = self.evaluator.evaluate(
            scenario_json=scenario_data,
            chosen_key=chosen_key,
            user_type=user.user_type,
            profile_json=profile_dict,
            decision_type=decision_type,
        )

        score_delta = float(evaluation_result.get("score", 0))

        # Save response
        response_row = Response(
            scenario_id=scenario_row.id,
            user_id=user.id,
            chosen_key=chosen_key,
            score_delta=score_delta,
            time_taken_sec=time_taken_sec,
            submitted_at=datetime.utcnow(),
        )
        db.add(response_row)
        db.commit()
        db.refresh(response_row)

        # Save evaluation
        eval_row = Evaluation(
            response_id=response_row.id,
            verdict=evaluation_result.get("verdict", "Suboptimal"),
            explanation=evaluation_result.get("explanation", ""),
            optimal_explanation=evaluation_result.get("optimal_explanation", ""),
            tip=evaluation_result.get("tip", ""),
            skills_demonstrated=json.dumps(evaluation_result.get("skills_demonstrated", [])),
            skills_missed=json.dumps(evaluation_result.get("skills_missed", [])),
        )
        db.add(eval_row)

        # Update XP — never below 0
        new_xp = max(0.0, profile.xp + score_delta)
        profile.xp = new_xp
        profile.level = get_level_from_xp(new_xp)
        profile.total_scenarios = (profile.total_scenarios or 0) + 1

        # Update accuracy
        all_responses = (
            db.query(Response).filter(Response.user_id == user.id).all()
        )
        positive_count = sum(
            1 for r in all_responses
            if r.score_delta >= 0
        )
        total_count = len(all_responses) + 1  # include current
        profile.overall_accuracy = (positive_count + (1 if score_delta >= 0 else 0)) / total_count

        # Update profile via profiler agent
        session_number = profile.total_sessions or 1
        updated_profile = self.profiler.update_profile(
            current_profile_json=profile_dict,
            evaluation_result=evaluation_result,
            scenario_topic=scenario_row.topic_id,
            session_number=session_number,
            decision_type=decision_type,
        )
        profile.profile_json = json.dumps(updated_profile)
        db.commit()

        # Determine session progress
        plan = json.loads(session_obj.session_plan_json or "{}")
        next_scenarios_plan = plan.get("next_scenarios", [])
        total_planned = len(next_scenarios_plan)

        # Count how many completed scenarios are in this session
        completed_in_session = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == session_id)
            .count()
        )

        # Calculate running session score
        session_responses = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == session_id)
            .all()
        )
        session_score = sum(r.score_delta for r in session_responses)

        is_last = completed_in_session >= total_planned

        if not is_last:
            # Generate next scenario
            next_order = completed_in_session  # 0-indexed, already incremented
            if next_order < len(next_scenarios_plan):
                next_brief = next_scenarios_plan[next_order]
            else:
                next_brief = next_scenarios_plan[-1]

            recent_scenarios = self._recent_scenario_summaries(db, user.id)
            last_3_optimal_keys = self._last_3_optimal_keys_chrono(db, user.id)
            next_scenario_data = self.generator.generate(
                user_type=user.user_type,
                topic=next_brief["topic"],
                profile_json=updated_profile,
                recent_scenarios=recent_scenarios,
                last_3_optimal_keys=last_3_optimal_keys,
            )
            next_scenario_data.setdefault("question", next_scenario_data.get("description", ""))

            next_scenario_row = Scenario(
                session_id=session_id,
                user_id=user.id,
                scenario_json=json.dumps(next_scenario_data),
                topic_id=next_brief["topic"],
                difficulty_tier=next_brief["difficulty_tier"],
            )
            db.add(next_scenario_row)
            db.commit()
            db.refresh(next_scenario_row)
            next_scenario_data["_db_id"] = next_scenario_row.id

            return {
                "evaluation": evaluation_result,
                "next_scenario": next_scenario_data,
                "session_score": session_score,
                "is_last": False,
            }
        else:
            # Session complete — generate narrative
            narrative = self._build_narrative_and_snapshot(
                db=db,
                session_obj=session_obj,
                user=user,
                profile=profile,
                session_score=session_score,
                updated_profile=updated_profile,
            )
            session_obj.status = "completed"
            session_obj.ended_at = datetime.utcnow()
            profile.total_sessions = (profile.total_sessions or 0) + 1
            db.commit()

            return {
                "evaluation": evaluation_result,
                "next_scenario": None,
                "session_score": session_score,
                "is_last": True,
                "narrative": narrative,
            }

    def get_active_session_detail(self, db: DBSession, user_id: int) -> Optional[dict]:
        """
        Return full client state for an active or paused session so the UI can resume
        without calling /session/start. None if no in-progress session.
        """
        session_obj: Session = (
            db.query(Session)
            .filter(
                Session.user_id == user_id,
                Session.status.in_(["active", "paused"]),
            )
            .first()
        )
        if not session_obj:
            return None

        plan = json.loads(session_obj.session_plan_json or "{}")
        plan_summary = {
            "plan_id": plan.get("plan_id"),
            "session_goal": plan.get("session_goal"),
            "total_scenarios": plan.get("total_scenarios"),
            "topics": [s["topic"] for s in plan.get("next_scenarios", [])],
            "next_scenarios": plan.get("next_scenarios", []),
        }
        total_planned = len(plan.get("next_scenarios", []))

        session_responses = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == session_obj.id)
            .all()
        )
        session_score = sum(r.score_delta for r in session_responses)
        scenarios_completed = len(session_responses)
        scenarios_remaining = max(0, total_planned - scenarios_completed)

        current_scenario = None
        if session_obj.status == "paused":
            pause_state = json.loads(session_obj.pause_state_json or "{}")
            raw = pause_state.get("current_scenario_json")
            if raw and pause_state.get("current_scenario_db_id"):
                current_scenario = dict(raw)
                current_scenario["_db_id"] = pause_state["current_scenario_db_id"]
            session_score = pause_state.get("session_score_so_far", session_score)
            scenarios_completed = pause_state.get("scenarios_completed", scenarios_completed)
            scenarios_remaining = pause_state.get("scenarios_remaining", scenarios_remaining)
        else:
            all_scenarios = (
                db.query(Scenario)
                .filter(Scenario.session_id == session_obj.id)
                .order_by(Scenario.id.desc())
                .all()
            )
            for sc in all_scenarios:
                has_response = (
                    db.query(Response).filter(Response.scenario_id == sc.id).first()
                )
                if not has_response:
                    current_scenario = json.loads(sc.scenario_json)
                    current_scenario["_db_id"] = sc.id
                    break

        return {
            "id": session_obj.id,
            "status": session_obj.status,
            "topic_focus": session_obj.topic_focus,
            "started_at": session_obj.started_at.isoformat(),
            "pause_reason": session_obj.pause_reason,
            "current_scenario": current_scenario,
            "session_score": float(session_score),
            "scenarios_completed": scenarios_completed,
            "scenarios_remaining": scenarios_remaining,
            "plan_summary": plan_summary,
        }

    # ------------------------------------------------------------------
    # pause_session
    # ------------------------------------------------------------------
    def pause_session(self, db: DBSession, session_id: int, reason: str = None) -> dict:
        session_obj: Session = db.query(Session).filter(Session.id == session_id).first()

        # Find current unanswered scenario (last scenario with no response)
        all_scenarios = (
            db.query(Scenario)
            .filter(Scenario.session_id == session_id)
            .order_by(Scenario.id.desc())
            .all()
        )
        current_scenario = None
        for sc in all_scenarios:
            has_response = db.query(Response).filter(Response.scenario_id == sc.id).first()
            if not has_response:
                current_scenario = sc
                break

        # Calculate session score so far
        session_responses = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == session_id)
            .all()
        )
        session_score = sum(r.score_delta for r in session_responses)

        plan = json.loads(session_obj.session_plan_json or "{}")
        total_planned = len(plan.get("next_scenarios", []))
        scenarios_completed = len(session_responses)
        scenarios_remaining = max(0, total_planned - scenarios_completed)

        pause_state = {
            "current_scenario_json": json.loads(current_scenario.scenario_json) if current_scenario else None,
            "current_scenario_db_id": current_scenario.id if current_scenario else None,
            "session_score_so_far": session_score,
            "scenarios_completed": scenarios_completed,
            "scenarios_remaining": scenarios_remaining,
            "plan_json": plan,
        }

        session_obj.pause_state_json = json.dumps(pause_state)
        session_obj.status = "paused"
        session_obj.pause_reason = reason
        db.commit()

        return {"message": "Session paused", "session_id": session_id}

    # ------------------------------------------------------------------
    # resume_session
    # ------------------------------------------------------------------
    def resume_session(self, db: DBSession, session_id: int) -> dict:
        session_obj: Session = db.query(Session).filter(Session.id == session_id).first()

        if session_obj.status != "paused":
            raise ValueError("Session is not paused")

        pause_state = json.loads(session_obj.pause_state_json or "{}")
        current_scenario = pause_state.get("current_scenario_json")
        if current_scenario and pause_state.get("current_scenario_db_id"):
            current_scenario["_db_id"] = pause_state["current_scenario_db_id"]

        session_obj.status = "active"
        db.commit()

        return {
            "session_id": session_id,
            "current_scenario": current_scenario,
            "session_score": pause_state.get("session_score_so_far", 0),
            "scenarios_completed": pause_state.get("scenarios_completed", 0),
            "scenarios_remaining": pause_state.get("scenarios_remaining", 0),
        }

    # ------------------------------------------------------------------
    # calloff_session
    # ------------------------------------------------------------------
    def calloff_session(self, db: DBSession, session_id: int) -> dict:
        session_obj: Session = db.query(Session).filter(Session.id == session_id).first()
        user: User = db.query(User).filter(User.id == session_obj.user_id).first()
        profile: UserProfile = db.query(UserProfile).filter(
            UserProfile.user_id == session_obj.user_id
        ).first()

        session_responses = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == session_id)
            .all()
        )
        partial_score = sum(r.score_delta for r in session_responses)
        narrative = None

        if len(session_responses) >= 1:
            profile_dict = json.loads(profile.profile_json or "{}")
            narrative = self._build_narrative_and_snapshot(
                db=db,
                session_obj=session_obj,
                user=user,
                profile=profile,
                session_score=partial_score,
                updated_profile=profile_dict,
                is_partial=True,
            )

        session_obj.status = "called_off"
        session_obj.ended_at = datetime.utcnow()
        db.commit()

        return {
            "message": "Session ended",
            "partial_score": partial_score,
            "narrative": narrative,
        }

    # ------------------------------------------------------------------
    # Internal helper
    # ------------------------------------------------------------------
    def _build_narrative_and_snapshot(
        self,
        db: DBSession,
        session_obj: Session,
        user: User,
        profile: UserProfile,
        session_score: float,
        updated_profile: dict,
        is_partial: bool = False,
    ) -> dict:
        """Call ProgressNarratorAgent and save a ProgressSnapshot."""
        # Get all responses and evaluations for this session
        session_responses_raw = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == session_obj.id)
            .all()
        )
        response_dicts = [
            {
                "chosen_key": r.chosen_key,
                "score_delta": r.score_delta,
                "time_taken_sec": r.time_taken_sec,
                "topic": db.query(Scenario).filter(Scenario.id == r.scenario_id).first().topic_id,
            }
            for r in session_responses_raw
        ]
        eval_dicts = []
        for r in session_responses_raw:
            ev = db.query(Evaluation).filter(Evaluation.response_id == r.id).first()
            if ev:
                eval_dicts.append({
                    "verdict": ev.verdict,
                    "explanation": ev.explanation,
                    "tip": ev.tip,
                    "skills_demonstrated": json.loads(ev.skills_demonstrated or "[]"),
                    "skills_missed": json.loads(ev.skills_missed or "[]"),
                })

        # Get previous snapshot
        prev_snapshot = (
            db.query(ProgressSnapshot)
            .filter(ProgressSnapshot.user_id == user.id)
            .filter(ProgressSnapshot.session_id != session_obj.id)
            .order_by(ProgressSnapshot.taken_at.desc())
            .first()
        )
        prev_snapshot_dict = None
        if prev_snapshot:
            prev_snapshot_dict = {
                "session_score": prev_snapshot.session_score,
                "narrative_text": prev_snapshot.narrative_text,
                "topics_covered": json.loads(prev_snapshot.topics_covered or "[]"),
            }

        narrative_result = self.narrator.narrate(
            user_type=user.user_type,
            current_session_responses=response_dicts,
            current_session_evaluations=eval_dicts,
            previous_snapshot=prev_snapshot_dict,
            profile_json=updated_profile,
        )

        topics_covered = list({r["topic"] for r in response_dicts})
        xp_before = profile.xp - session_score
        xp_before = max(0.0, xp_before)

        snapshot = ProgressSnapshot(
            user_id=user.id,
            session_id=session_obj.id,
            xp_before=xp_before,
            xp_after=profile.xp,
            session_score=session_score,
            topics_covered=json.dumps(topics_covered),
            improved_topics=json.dumps(narrative_result.get("improved_topics", [])),
            regressed_topics=json.dumps(narrative_result.get("regressed_topics", [])),
            narrative_text=narrative_result.get("narrative", ""),
            comparison_json=json.dumps(narrative_result),
            taken_at=datetime.utcnow(),
        )
        db.add(snapshot)
        db.commit()

        return narrative_result
