"""
ScenarioGeneratorAgent — two-step agentic scenario generation (reasoning, then JSON).
Uses Google Gemini when GEMINI_API_KEY is set; otherwise Anthropic Claude.
"""
import os
import json
import re
import secrets
import time
from typing import Callable, Optional

import anthropic

from config import (
    ANTHROPIC_API_KEY,
    GEMINI_API_KEY,
    GEMINI_SCENARIO_MODEL,
)

CLAUDE_SCENARIO_MODEL = os.getenv("CLAUDE_SCENARIO_MODEL", "claude-sonnet-4-6")


def _extract_json_object(text: str) -> Optional[str]:
    """Pull outermost {...} from model output when JSON mode or fences fail."""
    if not text:
        return None
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```\s*$", "", t)
    start = t.find("{")
    end = t.rfind("}")
    if start >= 0 and end > start:
        return t[start : end + 1]
    return None


class ScenarioGeneratorAgent:

    def __init__(self):
        self._anthropic = (
            anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
        )
        self._gemini_model = None
        self._use_gemini = bool(GEMINI_API_KEY)
        if self._use_gemini:
            try:
                import google.generativeai as genai

                genai.configure(api_key=GEMINI_API_KEY)
                self._gemini_model = genai.GenerativeModel(GEMINI_SCENARIO_MODEL)
            except ImportError:
                self._use_gemini = False
                self._gemini_model = None

    def _gemini_generate(
        self,
        prompt: str,
        *,
        max_output_tokens: int,
        temperature: float,
        json_mode: bool = False,
    ) -> str:
        cfg: dict = {
            "max_output_tokens": max_output_tokens,
            "temperature": temperature,
        }
        if json_mode:
            cfg["response_mime_type"] = "application/json"
        r = self._gemini_model.generate_content(prompt, generation_config=cfg)
        try:
            return (r.text or "").strip()
        except Exception:
            if r.candidates:
                parts = []
                for c in r.candidates:
                    if not c.content or not c.content.parts:
                        continue
                    for p in c.content.parts:
                        if getattr(p, "text", None):
                            parts.append(p.text)
                return "".join(parts).strip()
            return ""

    def _claude_text(self, prompt: str, max_tokens: int) -> str:
        if not self._anthropic:
            return ""
        r = self._anthropic.messages.create(
            model=CLAUDE_SCENARIO_MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return r.content[0].text

    def _reasoning_llm(self, prompt: str) -> str:
        if self._use_gemini and self._gemini_model:
            out = self._gemini_generate(
                prompt,
                max_output_tokens=1024,
                temperature=0.95,
                json_mode=False,
            )
            if out:
                return out
        if self._anthropic:
            try:
                return self._claude_text(prompt, 800)
            except Exception:
                pass
        return ""

    def _try_parse_scenario(
        self, raw: str, required_optimal: str, topic: str
    ) -> Optional[dict]:
        if not raw:
            return None
        blob = _extract_json_object(raw)
        if not blob:
            return None
        try:
            data = json.loads(blob)
        except json.JSONDecodeError:
            return None
        return self._repair_scenario_payload(data, required_optimal, topic)

    def _repair_scenario_payload(
        self, data: dict, required_optimal: str, topic: str
    ) -> Optional[dict]:
        """Keep model text; fix types and scoring so we do not throw away AI output."""
        if not isinstance(data, dict):
            return None
        opts_in = data.get("options")
        if not isinstance(opts_in, list):
            return None

        by_key: dict = {}
        for o in opts_in:
            if not isinstance(o, dict):
                continue
            k = o.get("key")
            if k not in ("A", "B", "C", "D"):
                continue
            label = str(o.get("label", "")).strip()
            desc = str(o.get("description", o.get("action_detail", ""))).strip()
            by_key[k] = {
                "key": k,
                "label": label or f"Course of action {k}",
                "description": desc or "Trade-offs depend on follow-up validation.",
            }
        if set(by_key.keys()) != {"A", "B", "C", "D"}:
            return None

        raw_sc = data.get("scoring") or {}
        sc: dict = {}
        for k in "ABCD":
            v = raw_sc.get(k)
            try:
                sc[k] = int(round(float(v)))
            except (TypeError, ValueError):
                sc[k] = None

        expected = {10, 5, -5, -10}
        if None in sc.values() or set(sc.values()) != expected:
            others = [k for k in "ABCD" if k != required_optimal]
            pool = [5, -5, -10]
            sc = {required_optimal: 10}
            for i, k in enumerate(others):
                sc[k] = pool[i]
        else:
            ten_key = next((k for k in "ABCD" if sc[k] == 10), None)
            if ten_key and ten_key != required_optimal:
                sc[ten_key], sc[required_optimal] = sc[required_optimal], sc[ten_key]

        data["options"] = [by_key[k] for k in "ABCD"]
        data["scoring"] = sc
        data["optimal_key"] = required_optimal
        data["topic"] = topic
        if not str(data.get("decision_type", "")).strip():
            data["decision_type"] = "incident response judgment"
        if not data.get("skills_tested"):
            data["skills_tested"] = [topic, data["decision_type"]]
        title = str(data.get("title", "")).strip()
        if not title:
            data["title"] = f"{topic} — training decision"
        desc = str(data.get("description", "")).strip()
        if not desc:
            return None
        q = str(data.get("question", "")).strip()
        if not q:
            data["question"] = desc[:300]
        logs = data.get("logs")
        if not isinstance(logs, list) or len(logs) < 4:
            return None
        data["logs"] = [str(x) for x in logs[:6]]
        sid = str(data.get("id", "")).strip()
        if not sid:
            data["id"] = f"{topic.lower().replace(' ', '_')}_{int(time.time())}_{secrets.token_hex(3)}"
        return data

    def _generation_llm(self, prompt: str, required_optimal: str, topic: str) -> Optional[dict]:
        if self._use_gemini and self._gemini_model:
            for json_mode in (True, False):
                raw = self._gemini_generate(
                    prompt,
                    max_output_tokens=8192,
                    temperature=1.0,
                    json_mode=json_mode,
                )
                parsed = self._try_parse_scenario(raw, required_optimal, topic)
                if parsed:
                    return parsed
        if self._anthropic:
            try:
                raw = self._claude_text(prompt, 4096)
                parsed = self._try_parse_scenario(raw, required_optimal, topic)
                if parsed:
                    return parsed
            except Exception:
                pass
        return None

    def generate(
        self,
        user_type: str,
        topic: str,
        profile_json: dict,
        recent_scenarios: list,
        last_3_optimal_keys: list,
    ) -> dict:
        required_optimal = self._pick_optimal_key(last_3_optimal_keys)
        creative_seed = secrets.token_hex(6)
        style_hint = [
            "Write like a terse Slack war-room update.",
            "Open with a synthetic email header or ticket subject line in the description.",
            "Frame the question as a CIO quote plus 'What do you back?'",
            "Use a short SOC bridge transcript in the description, then the question.",
            "Present as a vendor TDR excerpt + internal chat one-liner.",
            "Start description with a regulatory deadline mentioned casually.",
        ][int(creative_seed[:2], 16) % 6]

        anti_repeat = f"""
VARIETY (CRITICAL — learner history below). CREATIVE_SEED: {creative_seed}
STYLE_HINT: {style_hint}
- Never copy question_snippet or description_preview wording; change structure, tense, and POV.
- Rotate log source family vs recent rows (EDR, O365, AWS CloudTrail, GCP audit, WAF, ZTNA, SIEM correlation,
  email gateway, K8s audit, IdP sign-in, DLP, proxy, EDR + firewall mix, etc.).
- Option labels: four different grammatical shapes; do not parallel-start all four with the same verb.
- Invent new hostnames, users, IPs, rule IDs every scenario — no FIN-HR-14 / jsmith reuse.
"""

        reasoning_prompt = f"""
You are a senior cybersecurity training designer with 15 years of SOC experience.
You are about to create a training scenario for a {user_type} learner.

SKILL PROFILE:
{json.dumps(profile_json, indent=2)}

LAST 5 SCENARIOS THEY FACED:
{json.dumps(recent_scenarios, indent=2)}

TOPIC TO COVER THIS TIME: {topic}

LAST 3 OPTIMAL KEYS: {last_3_optimal_keys}

{anti_repeat}

Plain text only, no JSON. Reason through:
1. Learner decision patterns (weak areas, verdicts).
2. Incident that challenges them now (avoid clichés already in their history).
3. Decision type for the four options.
4. Real tool for logs and line shape.
5. Trap option for this learner.
6. Optimal key A–D (not the same as most recent in last_3_optimal_keys).

CREATIVE_SEED for this run: {creative_seed} — let it change setting, industry vertical, and tone.
"""

        reasoning = self._reasoning_llm(reasoning_prompt)
        if not reasoning:
            reasoning = (
                f"Unique scenario for {topic}, {user_type}. Seed {creative_seed}. "
                f"Optimal key {required_optimal}. Obey STYLE_HINT. New assets and log source."
            )

        generation_prompt = f"""
{anti_repeat}

Designer reasoning (use it, do not repeat its sentences verbatim as the final text):
{reasoning}

Produce ONE JSON object. Scoring values MUST be integers (not strings): 10, 5, -5, -10 exactly once each.
optimal_key MUST be "{required_optimal}" and that key MUST have score 10.

Required keys:
"id", "title", "question", "description", "logs" (array 4-6 strings), "options" (four objects keys A-D with "label", "description"),
"optimal_key", "scoring" (objects with integer values for A,B,C,D), "topic", "decision_type", "skills_tested"

topic must be exactly: "{topic}"

Rules: four defensible options; logs authentic to chosen tool; no "You are" / "as a security analyst".

JSON template (fill with your creative content):
{{
  "id": "string",
  "title": "string",
  "question": "string",
  "description": "string",
  "logs": ["…"],
  "options": [
    {{"key": "A", "label": "…", "description": "…"}},
    {{"key": "B", "label": "…", "description": "…"}},
    {{"key": "C", "label": "…", "description": "…"}},
    {{"key": "D", "label": "…", "description": "…"}}
  ],
  "optimal_key": "{required_optimal}",
  "scoring": {{"A": int, "B": int, "C": int, "D": int}},
  "topic": "{topic}",
  "decision_type": "string",
  "skills_tested": ["…"]
}}
"""

        data = self._generation_llm(generation_prompt, required_optimal, topic)
        if data:
            return data

        return self._default_scenario(topic, last_3_optimal_keys, required_optimal, creative_seed)

    def _pick_optimal_key(self, last_3_optimal_keys):
        all_keys = ["A", "B", "C", "D"]
        if not last_3_optimal_keys:
            return "B"
        recent = last_3_optimal_keys[-1]
        candidates = [k for k in all_keys if k != recent]
        unseen = [k for k in candidates if k not in last_3_optimal_keys]
        if unseen:
            return unseen[0]
        return candidates[0]

    def _assign_keys_by_optimal(
        self, tiers: list[dict], required_optimal: str
    ) -> tuple[list, dict]:
        """Place tier order [optimal, +5, -5, -10] under keys so required_optimal scores +10."""
        keys = list("ABCD")
        pos = keys.index(required_optimal)
        slot = [None, None, None, None]
        slot[pos] = tiers[0]
        other_i = [i for i in range(4) if i != pos]
        for idx, tier in zip(other_i, tiers[1:]):
            slot[idx] = tier
        options = []
        for i, letter in enumerate(keys):
            o = dict(slot[i])
            o["key"] = letter
            options.append(o)
        scoring = {required_optimal: 10}
        rest_k = [k for k in keys if k != required_optimal]
        for k, v in zip(rest_k, (5, -5, -10)):
            scoring[k] = v
        return options, scoring

    def _default_scenario(
        self,
        topic: str,
        last_3_optimal_keys: list,
        required_optimal: Optional[str] = None,
        seed: str = "",
    ) -> dict:
        """Last resort: rotate shells; permute options so narrative +10 matches required_optimal."""
        optimal = required_optimal or self._pick_optimal_key(last_3_optimal_keys)
        idx = (int(time.time()) + hash(topic) + hash(seed or "")) % 3
        ts = int(time.time())

        shells = [
            {
                "title": "OAuth token abuse — new device in Paris",
                "question": "Eng thread: 'Is this MFA fatigue or a real takeover?' — what do you advise right now?",
                "description": (
                    f"IdP shows {topic}-related risk: user svc_backup@corp issued a refresh token from Chrome on "
                    "a device never seen before (Paris, AS16509). Five minutes later, Graph API bulk-export "
                    "calls began. On-call wants a single recommended move."
                ),
                "logs": [
                    "signinlogs | ts=2026-04-11T09:14:02Z | user=svc_backup@corp | app=Microsoft Graph | ip=198.51.100.22 | city=Paris | deviceId=new | riskScore=high",
                    "auditlogs | ts=2026-04-11T09:15:41Z | op=MailItemsAccessed | actor=svc_backup@corp | workload=Exchange | count=240",
                    "azureActivity | ts=2026-04-11T09:16:10Z | callerIp=198.51.100.22 | op=ListSecrets | resource=/subscriptions/…/vaults/kv-prod",
                    "defenderEdr | ts=2026-04-11T09:17:55Z | host=CL-WIN-218 | parent=chrome.exe | child=powershell.exe -enc …",
                ],
                "tiers": [
                    {
                        "label": "Disable sign-in for svc_backup in IdP pending triage; open sev-2 with identity",
                        "description": "Stops abuse fast; risks outage for dependent nightly backup workflows.",
                    },
                    {
                        "label": "Revoke refresh tokens for svc_backup and force step-up MFA for that account only",
                        "description": "Cuts session continuity immediately but may break an approved automation job if the account is shared.",
                    },
                    {
                        "label": "Leave account active; isolate CL-WIN-218 and collect EDR triage package first",
                        "description": "Preserves endpoint evidence while the cloud session may still exfiltrate mail and secrets.",
                    },
                    {
                        "label": "Request legal hold on the mailbox only, no session revocation yet",
                        "description": "Helps preservation narrative but allows continued API access during delay.",
                    },
                ],
                "decision_type": "cloud identity session abuse vs service account continuity",
            },
            {
                "title": "Container breakout chatter on payment shard",
                "question": "Your TL messages: 'Pick one path for the next 15 minutes.' What's your call?",
                "description": (
                    f"K8s audit shows a pod in namespace pay-prod executing mount escapes; metrics show spike in "
                    f"egress to an unknown S3-style endpoint. {topic} controls are in scope for the blast-radius call."
                ),
                "logs": [
                    "k8s-audit | ts=2026-04-11T11:02:18Z | user=system:serviceaccount:pay-prod:batch-runner | verb=create | obj=pods/exec | ns=pay-prod",
                    "falco | ts=2026-04-11T11:02:44Z | rule=Launch Sensitive Mount | pod=invoice-worker-7d9c | proc=nsenter | user=root",
                    "vpc-flow | ts=2026-04-11T11:03:10Z | src=10.42.18.90 dst=203.0.113.50:443 | bytes=8420190 | region=us-east-1",
                    "cloudtrail | ts=2026-04-11T11:04:01Z | event=AssumeRole | role=arn:aws:iam::111:role/pay-prod-node | error=None",
                ],
                "tiers": [
                    {
                        "label": "Taint pay-prod namespace NoSchedule and kill pods on affected nodes immediately",
                        "description": "Aggressive containment; may drop in-flight payment batches and lose volatile memory evidence.",
                    },
                    {
                        "label": "Cordon nodes in the pay-prod pool and drain non-payment workloads only",
                        "description": "Limits spread while keeping some capacity; attacker may still hold running pods.",
                    },
                    {
                        "label": "Snapshot node disks and retain pods for live memory capture before eviction",
                        "description": "Forensically rich but slower; egress may continue during capture window.",
                    },
                    {
                        "label": "Open ticket to cloud platform team — no direct cluster action from security",
                        "description": "Clear handoff but burns critical minutes while breakout may expand.",
                    },
                ],
                "decision_type": "container incident containment vs evidence preservation",
            },
            {
                "title": "Supplier portal upload flagged as weaponized macro chain",
                "question": "Procurement VP asks in bridge: 'Do we cut their access or keep the line open for Q2 close?'",
                "description": (
                    f"A vendor uploaded a .xlsm via the external supplier portal; sandbox detonated VBA + WMI "
                    f"spawn. Two internal users opened read-only previews. {topic} is the lens for the go/no-go."
                ),
                "logs": [
                    "proofpoint | ts=2026-04-11T08:51:03Z | msgid=<44a…@supplier.example> | to=ap@corp | attachment=Forecast_Q2.xlsm | verdict=malicious",
                    "o365 | ts=2026-04-11T08:51:40Z | user=ap@corp | op=FilePreviewed | file=Forecast_Q2.xlsm | device=managed",
                    "defenderAv | ts=2026-04-11T08:52:11Z | host=AP-LT-09 | threat=Exploit:O97M/Downloader | action=blocked",
                    "zscaler | ts=2026-04-11T08:52:55Z | user=ap@corp | url=supplier.example/dl/Forecast_Q2.xlsm | cat=BusinessApps | dlSize=1.2MB",
                ],
                "tiers": [
                    {
                        "label": "Revoke only this supplier's integration credentials and scan AP-LT-09 with full EDR hunt",
                        "description": "Targeted response; other compromised supplier accounts could still exist.",
                    },
                    {
                        "label": "Disable supplier portal SAML SSO for all vendors until IOCs are cleared",
                        "description": "Stops further malicious uploads; may halt legitimate supplier submissions during close.",
                    },
                    {
                        "label": "Leave portal up; purge mailbox previews and monitor AP-LT-09 silently for 48h",
                        "description": "Low disruption; risk of dormant payload if preview wasn’t the only execution path.",
                    },
                    {
                        "label": "Notify all suppliers of possible breach before internal containment completes",
                        "description": "Transparent but may tip an attacker and complicates legal review.",
                    },
                ],
                "decision_type": "third-party risk vs business continuity",
            },
        ]

        shell = shells[idx]
        options, scoring = self._assign_keys_by_optimal(shell["tiers"], optimal)
        return {
            "id": f"fallback_{topic.lower().replace(' ', '_')}_{ts}_{secrets.token_hex(2)}",
            "title": shell["title"],
            "question": shell["question"],
            "description": shell["description"],
            "logs": shell["logs"],
            "options": options,
            "optimal_key": optimal,
            "scoring": scoring,
            "topic": topic,
            "decision_type": shell["decision_type"],
            "skills_tested": ["prioritization", topic],
        }
