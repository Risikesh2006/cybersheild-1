"""
ProfilerAgent — maintains the learner skill profile.
build_initial_profile is pure logic (no Claude).
update_profile calls Claude to recalculate scores and patterns.
"""
import json
import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL


class ProfilerAgent:

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def build_initial_profile(self, user_type: str, topic_selections: list[str]) -> dict:
        """
        Construct the initial profile_json for a new user.
        Pure logic — no Claude API call.
        """
        readiness_map = {
            "student": "Beginner",
            "professional": "Intermediate",
            "enterprise": "Intermediate",
        }

        skill_scores = {}
        for topic in topic_selections:
            skill_scores[topic] = {
                "score": 0.0,
                "attempts": 0,
                "last_verdict": None,
                "trend": "untested",
            }

        return {
            "user_type": user_type,
            "topics_selected": topic_selections,
            "skill_scores": skill_scores,
            "decision_patterns": [],
            "weak_areas": [],
            "strong_areas": [],
            "readiness_level": readiness_map.get(user_type, "Beginner"),
        }

    def update_profile(
        self,
        current_profile_json: dict,
        evaluation_result: dict,
        scenario_topic: str,
        session_number: int,
        decision_type: str,
    ) -> dict:
        """
        Call Claude to update the skill profile after one scenario evaluation.
        Returns the updated profile dict.
        Falls back to a locally computed update on Claude failure.
        """
        system_prompt = (
            "You are an AI that maintains a cybersecurity learner skill profile. "
            "You receive the current profile, the result of one scenario evaluation, "
            "and metadata. Update the profile accurately. "
            "Return only valid JSON matching the profile schema exactly. "
            "Do not add fields not in the schema. "
            "Do not remove existing fields."
        )

        user_prompt = f"""Current profile JSON:
{json.dumps(current_profile_json, indent=2)}

Scenario topic: {scenario_topic}
Decision type tested: {decision_type}
Verdict: {evaluation_result.get("verdict")}
Skills demonstrated: {evaluation_result.get("skills_demonstrated", [])}
Skills missed: {evaluation_result.get("skills_missed", [])}
Session number: {session_number}

Instructions:
1. Increment attempts for topic "{scenario_topic}".
2. Recalculate score using: new_score = (old_score * (attempts-1) + verdict_value) / attempts
   where Optimal=1.0, Suboptimal=0.6, Risky=0.3, Critical=0.0
3. Update trend by comparing new score to old score (improving/declining/stable).
4. Update last_verdict to "{evaluation_result.get("verdict")}".
5. Rebuild weak_areas list (topics with score < 0.5).
6. Rebuild strong_areas list (topics with score > 0.75).
7. Detect decision_patterns: if same verdict type appears 2+ times on same topic, add/update pattern entry.
8. Also check: does this verdict reveal a pattern in how this user handles {decision_type} decisions specifically,
   regardless of topic? If the same decision_type has produced poor verdicts (Risky or Critical) 2 or more times
   across the history implied by the profile and decision_patterns, add or update a pattern entry that names
   the decision type (e.g. escalation judgment, investigation prioritization), not just the topic.
9. Update readiness_level if score thresholds crossed: >0.7 average = Intermediate or Advanced.
10. Preserve all other existing fields unchanged.

Return only the updated JSON object matching the profile schema."""

        try:
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": user_prompt}],
                system=system_prompt,
            )
            raw = response.content[0].text.strip()
            # Strip any accidental markdown fences
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except Exception:
            # Fallback: compute locally without Claude
            return self._local_update(
                current_profile_json, evaluation_result, scenario_topic, decision_type
            )

    def _local_update(
        self, profile: dict, eval_result: dict, topic: str, _decision_type: str
    ) -> dict:
        """Local fallback for profile update without Claude."""
        verdict_values = {
            "Optimal": 1.0, "Suboptimal": 0.6, "Risky": 0.3, "Critical": 0.0
        }
        profile = json.loads(json.dumps(profile))  # deep copy
        verdict = eval_result.get("verdict", "Suboptimal")
        verdict_val = verdict_values.get(verdict, 0.6)

        skill_scores = profile.get("skill_scores", {})
        if topic not in skill_scores:
            skill_scores[topic] = {"score": 0.0, "attempts": 0, "last_verdict": None, "trend": "untested"}

        entry = skill_scores[topic]
        attempts = entry.get("attempts", 0) + 1
        old_score = entry.get("score", 0.0)
        new_score = (old_score * (attempts - 1) + verdict_val) / attempts

        trend = "stable"
        if new_score > old_score + 0.05:
            trend = "improving"
        elif new_score < old_score - 0.05:
            trend = "declining"

        entry["attempts"] = attempts
        entry["score"] = round(new_score, 4)
        entry["last_verdict"] = verdict
        entry["trend"] = trend

        skill_scores[topic] = entry
        profile["skill_scores"] = skill_scores
        profile["weak_areas"] = [t for t, v in skill_scores.items() if v["score"] < 0.5 and v["attempts"] > 0]
        profile["strong_areas"] = [t for t, v in skill_scores.items() if v["score"] > 0.75]
        return profile
