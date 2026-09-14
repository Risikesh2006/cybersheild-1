# 01 ? Problem & Solution Brief

## Project: CyberShield

### Problem
Cybersecurity learners need practice choosing defensive actions under uncertainty. Reading material and fixed quizzes offer limited opportunity to weigh containment, investigation, business continuity, and escalation. Instructors also need a way to see where learners struggle across sessions.

### Proposed solution
CyberShield provides simulated incident-response training in a browser. Learners choose a role and topics, inspect a scenario, select one of four actions, and receive a verdict, explanation, and XP. A coordinated agent workflow plans topics, generates scenarios, evaluates choices, updates a skill profile, and produces a session debrief.

### Intended users
- Students developing foundational security judgment.
- Professionals practising defensive response decisions.
- Enterprise training groups exploring structured learning and progress views.

### Implemented prototype
- Email/password registration and login, with optional Google OAuth configuration.
- Student, professional, and enterprise role selection.
- Ten security topics, including network security, endpoint security, incident response, and secure coding.
- Topic selection, training sessions, four-option scenarios, and feedback.
- Session pause, resume, and early termination.
- Stored responses, XP, learner profiles, history, and progress summaries.
- Five specialist agent classes coordinated by an orchestrator.

### What makes the approach useful
The training loop connects each decision to feedback and subsequent learner state. Live AI integrations can vary scenarios and explanations, while local fallbacks provide a reproducible demonstration when provider credentials are unavailable.

### Expected value and success measures
The intended outcome is more opportunities to practise defensive judgment and identify weak topics. Candidate measures include session completion, change in topic scores, repeat error patterns, and learner feedback. No educational effectiveness study, user adoption results, or measured improvement is claimed.

### Scope and limitations
This is a training prototype using simulated incidents. It does not monitor real networks or execute defensive actions. Demo mode uses built-in scenarios and rule-based fallback outputs; it does not demonstrate live AI inference. Live AI requires private provider configuration and available models. Generated guidance needs instructor review. Production hardening and comprehensive security testing remain future work.
