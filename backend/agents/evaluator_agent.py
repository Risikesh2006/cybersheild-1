"""
EvaluatorAgent — evaluates a user's scenario response and produces
calibrated feedback based on user type and current profile.
"""
import json
import anthropic
from config import ANTHROPIC_API_KEY, CLAUDE_MODEL, VERDICT_SCORES


class EvaluatorAgent:

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

    def evaluate(
        self,
        scenario_json: dict,
        chosen_key: str,
        user_type: str,
        profile_json: dict,
        decision_type: str,
    ) -> dict:
        """
        Evaluate the user's chosen option and return structured feedback.
        Falls back to a computed verdict if Claude fails.
        """
        system_prompt = (
            "You are a senior cybersecurity instructor evaluating a trainee's "
            "incident response decision. Be direct, technical, and specific. "
            "Tailor your explanation to the user's type. "
            "Return only valid JSON. No markdown. No preamble."
        )

        # Build option summary for prompt — support both old and new option formats
        def _opt_text(opt: dict) -> str:
            label = opt.get('label', '')
            detail = opt.get('action_detail') or opt.get('description', '')
            consequence = opt.get('consequence', '')
            parts = [f"  {opt['key']}: {label}"]
            if detail:
                parts.append(f"     Action: {detail}")
            if consequence:
                parts.append(f"     Consequence: {consequence}")
            return "\n".join(parts)

        options_summary = "\n".join(
            _opt_text(opt)
            for opt in scenario_json.get("options", [])
        )

        optimal_key = scenario_json.get("optimal_key", "A")
        chosen_option = next(
            (o for o in scenario_json.get("options", []) if o["key"] == chosen_key),
            {"key": chosen_key, "label": "Unknown", "description": ""}
        )
        optimal_option = next(
            (o for o in scenario_json.get("options", []) if o["key"] == optimal_key),
            {"key": optimal_key, "label": "Unknown", "description": ""}
        )

        score_chosen = scenario_json.get("scoring", {}).get(chosen_key, 0)
        score_optimal = scenario_json.get("scoring", {}).get(optimal_key, 10)

        weak_areas = profile_json.get("weak_areas", [])

        user_type_instructions = {
            "student": (
                "Use educational language. Explain the 'why' behind the answer. "
                "Connect reasoning to security concepts. Treat mistakes as learning opportunities. "
                "Avoid jargon without explanation."
            ),
            "professional": (
                "Use operational framing. Reference IR frameworks (NIST SP 800-61, SANS PICERL). "
                "Acknowledge time-pressure context. Treat mistakes as decision errors to correct. "
                "Be concise and direct."
            ),
            "enterprise": (
                "Use team and process framing. Reference communication, escalation paths, and SLAs. "
                "Evaluate documentation and stakeholder notification aspects of the decision. "
                "Treat mistakes as procedural gaps."
            ),
        }.get(user_type, "")

        scenario_question = scenario_json.get('question', '') or scenario_json.get('description', '')
        user_prompt = f"""Scenario: {scenario_json.get('title')}
Question posed to analyst: {scenario_question}
Description: {scenario_json.get('description')}

This scenario was testing: {decision_type}
Frame your entire explanation in terms of that decision.
Do not evaluate the response as if it were a different type of decision.

Logs:
{chr(10).join(scenario_json.get('logs', []))}

All response options:
{options_summary}

User chose: {chosen_key} — {chosen_option.get('label')} — {chosen_option.get('description') or chosen_option.get('action_detail', '')}
Score for chosen: {score_chosen}

Optimal key: {optimal_key} — {optimal_option.get('label')} — {optimal_option.get('description') or optimal_option.get('action_detail', '')}
Score for optimal: {score_optimal}

User type: {user_type}
User's current weak areas: {weak_areas}

Feedback instructions: {user_type_instructions}

Determine the verdict:
- score {score_chosen} == 10 → Optimal
- score {score_chosen} == 5 → Suboptimal
- score {score_chosen} == -5 → Risky
- score {score_chosen} == -10 → Critical

Generate explanation calibrated to the user type.
If chosen_key == optimal_key, set optimal_explanation to empty string "".

Return this exact JSON:
{{
  "verdict": "Optimal|Suboptimal|Risky|Critical",
  "score": {score_chosen},
  "chosen_key": "{chosen_key}",
  "optimal_key": "{optimal_key}",
  "explanation": "string (2-3 sentences about the chosen action)",
  "optimal_explanation": "string (2-3 sentences explaining the optimal choice, empty if already chosen)",
  "tip": "string (one transferable principle, max 2 sentences)",
  "skills_demonstrated": ["string"],
  "skills_missed": ["string"]
}}"""

        try:
            if self.client is None:
                raise RuntimeError("Local demo: use built-in fallback")
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
            result = json.loads(raw)
            # Enforce correct score regardless of what Claude returns
            result["score"] = score_chosen
            return result
        except Exception:
            return self._fallback_evaluation(
                chosen_key, optimal_key, score_chosen, decision_type
            )

    def _fallback_evaluation(
        self,
        chosen_key: str,
        optimal_key: str,
        score: int,
        decision_type: str,
    ) -> dict:
        """Fallback evaluation when Claude is unavailable."""
        if score == 10:
            verdict = "Optimal"
        elif score == 5:
            verdict = "Suboptimal"
        elif score == -5:
            verdict = "Risky"
        else:
            verdict = "Critical"

        is_correct = chosen_key == optimal_key
        return {
            "verdict": verdict,
            "score": score,
            "chosen_key": chosen_key,
            "optimal_key": optimal_key,
            "explanation": (
                f"You chose option {chosen_key}. "
                f"This response is rated {verdict} with a score of {score:+d}, "
                f"in the context of a scenario about: {decision_type}."
            ),
            "optimal_explanation": (
                "" if is_correct
                else (
                    f"The optimal response was option {optimal_key}, judged best for this "
                    f"type of decision ({decision_type}) given the scenario context."
                )
            ),
            "tip": (
                f"For decisions like this ({decision_type}), weigh trade-offs explicitly "
                "against the scenario's constraints before acting."
            ),
            "skills_demonstrated": [],
            "skills_missed": [] if is_correct else ["optimal decision-making"],
        }
