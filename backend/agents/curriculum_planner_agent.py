"""
CurriculumPlannerAgent — selects and sequences training topics for each session
based on the learner's profile, topic selections, and prerequisite rules.
"""
import json
import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL


class CurriculumPlannerAgent:

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

    def plan(
        self,
        user_type: str,
        topic_selections: list[str],
        profile_json: dict,
        completed_scenario_ids: list[str],
    ) -> dict:
        """
        Generate a session curriculum plan.
        Returns the plan dict with ordered next_scenarios.
        Falls back to a simple plan if Claude fails.
        """
        system_prompt = (
            "You are a cybersecurity curriculum designer. Plan a training session "
            "for a learner based on their profile and topic selections. "
            "Return only valid JSON. No markdown."
        )

        skill_scores = profile_json.get("skill_scores", {})
        weak_areas = profile_json.get("weak_areas", [])
        strong_areas = profile_json.get("strong_areas", [])
        readiness_level = profile_json.get("readiness_level", "Beginner")

        # Summarise skill scores for selected topics
        topic_data = {}
        for topic in topic_selections:
            data = skill_scores.get(topic, {})
            topic_data[topic] = {
                "score": data.get("score", 0.0),
                "attempts": data.get("attempts", 0),
                "trend": data.get("trend", "untested"),
            }

        # Difficulty tiers by user type
        difficulty_map = {
            "student": {
                "low": "Foundational",
                "mid": "Intermediate",
                "high": "Advanced",
            },
            "professional": {
                "low": "Operational",
                "mid": "Complex",
                "high": "Expert",
            },
            "enterprise": {
                "low": "Procedural",
                "mid": "Multi-vector",
                "high": "Crisis",
            },
        }.get(user_type, {"low": "Foundational", "mid": "Intermediate", "high": "Advanced"})

        user_prompt = f"""Plan a cybersecurity training session for a {user_type} learner.

Readiness level: {readiness_level}
Selected topics and current scores:
{json.dumps(topic_data, indent=2)}

Weak areas (score < 0.5): {weak_areas}
Strong areas (score > 0.75): {strong_areas}

Completed scenario IDs (avoid repeating exact scenarios): (count: {len(completed_scenario_ids)})

Difficulty tier names for this user type:
  Low skill → {difficulty_map["low"]}
  Mid skill → {difficulty_map["mid"]}
  High skill → {difficulty_map["high"]}

Prerequisite rules (enforce strictly):
  "Cloud Security" requires "Network Security" basics first (if score < 0.3)
  "Malware Analysis" requires "Endpoint Security" basics first (if score < 0.3)
  "Threat Intelligence" requires "Incident Response" basics first (if score < 0.3)
  "Compliance & GRC" requires "Incident Response" basics first (if score < 0.3)
  "Secure Coding" has no prerequisites
  All other topics have no prerequisites

Selection rules (follow in order):
1. Select 4 to 6 scenarios for this session.
2. PRIORITIZE: weak areas (score < 0.5) first.
3. THEN: untested topics (attempts == 0).
4. THEN: topics in progress (0.5 <= score <= 0.75).
5. END the session with ONE topic from strong_areas (confidence-building close).
6. Insert prerequisite topics before their dependents if score < 0.3.
7. Assign difficulty tier based on current score:
   score < 0.4 → low tier, score 0.4-0.7 → mid tier, score > 0.7 → high tier
8. Include a clear reason for each topic selection.

Return this exact JSON:
{{
  "plan_id": "plan_{user_type}_{readiness_level.lower()}_<timestamp_or_hash>",
  "total_scenarios": integer (4 to 6),
  "coverage_percentage": float (percentage of selected topics covered this session),
  "session_goal": "string (one sentence describing this session's focus)",
  "next_scenarios": [
    {{
      "order": integer (1-based),
      "topic": "string (exact topic name from selected topics)",
      "difficulty_tier": "string",
      "focus_skill": "string (specific skill to test within this topic)",
      "reason": "string (one sentence explaining why this topic now)"
    }}
  ]
}}"""

        try:
            if self.client is None:
                raise RuntimeError("Local demo: use built-in fallback")
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": user_prompt}],
                system=system_prompt,
            )
            raw = response.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.rsplit("```", 1)[0]
            return json.loads(raw)
        except Exception:
            return self._fallback_plan(user_type, topic_selections, difficulty_map)

    def _fallback_plan(self, user_type: str, topic_selections: list[str], difficulty_map: dict) -> dict:
        """Fallback plan when Claude is unavailable."""
        selected = topic_selections[:5] if len(topic_selections) >= 5 else topic_selections
        next_scenarios = []
        for i, topic in enumerate(selected, start=1):
            next_scenarios.append({
                "order": i,
                "topic": topic,
                "difficulty_tier": difficulty_map.get("low", "Foundational"),
                "focus_skill": f"core {topic} response",
                "reason": f"Cover {topic} as part of your selected training curriculum.",
            })
        return {
            "plan_id": f"plan_{user_type}_fallback",
            "total_scenarios": len(next_scenarios),
            "coverage_percentage": round(len(next_scenarios) / max(len(topic_selections), 1) * 100, 1),
            "session_goal": f"Build foundational skills across your selected {user_type} training topics.",
            "next_scenarios": next_scenarios,
        }
