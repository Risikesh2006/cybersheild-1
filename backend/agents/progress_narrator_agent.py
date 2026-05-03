"""
ProgressNarratorAgent — writes a post-session debrief narrative
comparing current performance to previous sessions.
"""
import json
import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL


class ProgressNarratorAgent:

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def narrate(
        self,
        user_type: str,
        current_session_responses: list[dict],
        current_session_evaluations: list[dict],
        previous_snapshot: dict | None,
        profile_json: dict,
    ) -> dict:
        """
        Generate a post-session narrative debrief.
        Returns the full narrative result dict.
        """
        system_prompt = (
            "You are a cybersecurity training mentor writing a post-session debrief "
            "for a trainee. Be honest, specific, and constructive. "
            "Reference actual decisions made, not just scores. "
            "Write in second person (you/your). "
            "Return only valid JSON. No markdown."
        )

        # Summarise verdicts for prompt
        verdict_summary = []
        for resp, ev in zip(current_session_responses, current_session_evaluations):
            verdict_summary.append({
                "topic": resp.get("topic", "Unknown"),
                "chosen_key": resp.get("chosen_key"),
                "score_delta": resp.get("score_delta"),
                "verdict": ev.get("verdict"),
                "skills_missed": ev.get("skills_missed", []),
            })

        total_scenarios = len(verdict_summary)
        total_score = sum(r.get("score_delta", 0) for r in current_session_responses)
        accuracy = (
            sum(1 for v in verdict_summary if v["verdict"] in ("Optimal", "Suboptimal")) / total_scenarios
            if total_scenarios > 0 else 0
        )

        prev_context = "This is the learner's first session."
        if previous_snapshot:
            prev_context = (
                f"Previous session score: {previous_snapshot.get('session_score', 0)}\n"
                f"Previous session narrative: {previous_snapshot.get('narrative_text', 'N/A')}\n"
                f"Topics covered previously: {previous_snapshot.get('topics_covered', [])}"
            )

        skill_scores = profile_json.get("skill_scores", {})
        skill_summary = {
            topic: {
                "score": data.get("score", 0),
                "attempts": data.get("attempts", 0),
                "trend": data.get("trend", "untested"),
            }
            for topic, data in skill_scores.items()
        }

        user_prompt = f"""Post-session debrief for a {user_type} trainee.

Session results ({total_scenarios} scenarios, total score: {total_score:+.0f}):
{json.dumps(verdict_summary, indent=2)}

Accuracy this session: {accuracy:.0%}

Current skill profile:
{json.dumps(skill_summary, indent=2)}

{prev_context}

Instructions:
1. Calculate improvement by comparing this session's accuracy to previous session's on overlapping topics.
2. Reference specific decisions — name the topic and what happened.
3. If this is the first session, write an opening session debrief.
4. Identify one recurring pattern if present (same mistake on same topic).
5. Give one concrete recommendation for next session.
6. Keep narrative under 120 words.
7. Be honest — if performance declined, say so constructively.

Return this exact JSON:
{{
  "headline": "string (max 10 words, plain statement of what happened)",
  "narrative": "string (max 120 words, second person prose)",
  "improved_topics": ["string"],
  "regressed_topics": ["string"],
  "stable_topics": ["string"],
  "pattern_observed": "string or empty string",
  "next_session_recommendation": "string (one sentence)"
}}"""

        try:
            response = self.client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=1024,
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
            return self._fallback_narrative(total_scenarios, total_score, accuracy)

    def _fallback_narrative(self, total: int, score: float, accuracy: float) -> dict:
        """Fallback narrative when Claude is unavailable."""
        return {
            "headline": f"Session complete — {total} scenarios reviewed",
            "narrative": (
                f"You completed {total} scenarios this session with a total score of {score:+.0f} XP "
                f"and an accuracy rate of {accuracy:.0%}. "
                "Review your missed skills and focus on the areas where you chose risky options. "
                "Consistent practice on your weak areas will improve your decision accuracy over time."
            ),
            "improved_topics": [],
            "regressed_topics": [],
            "stable_topics": [],
            "pattern_observed": "",
            "next_session_recommendation": "Focus on your weakest topics in the next session.",
        }
