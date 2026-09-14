"""Run using the installed backend Python. Uses a temporary isolated database."""
import json, os, secrets, socket, subprocess, sys, tempfile, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

backend = Path(__file__).resolve().parents[1] / "backend"
with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
base = f"http://127.0.0.1:{port}"
token = ""
def request(path, data=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(base + path, data=None if data is None else json.dumps(data).encode(), headers=headers)
    with urlopen(req, timeout=30) as response:
        return json.load(response)

with tempfile.TemporaryDirectory(prefix="cybershield-check-") as temp:
    env = dict(os.environ, ENVIRONMENT="production", DEMO_MODE="true", SECRET_KEY=secrets.token_urlsafe(48),
               DATABASE_URL="sqlite:///" + (Path(temp)/"check.db").as_posix(), PYTHONDONTWRITEBYTECODE="1")
    with open(Path(temp)/"server.log", "w") as log:
        server = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port)], cwd=backend, env=env, stdout=log, stderr=log)
        try:
            for _ in range(60):
                try:
                    assert request("/health") == {"status": "ok", "service": "CyberShield API"}
                    break
                except Exception:
                    if server.poll() is not None:
                        raise RuntimeError("Backend failed to start")
                    time.sleep(0.5)
            else:
                raise RuntimeError("Backend startup timed out")
            with urlopen(base + "/docs", timeout=30) as response:
                assert response.status == 200 and b"swagger-ui" in response.read()
            assert "/session/start" in request("/openapi.json")["paths"]
            for origin in ("http://localhost:3000", "http://localhost:5173", "https://cybershield-azure-delta.vercel.app"):
                preflight = Request(base + "/auth/login", method="OPTIONS", headers={
                    "Origin": origin, "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "authorization,content-type"})
                with urlopen(preflight, timeout=30) as response:
                    assert response.status == 200
                    assert response.headers["Access-Control-Allow-Origin"] == origin
            try:
                request("/auth/me")
                raise AssertionError("Protected route accepted an unauthenticated request")
            except HTTPError as error:
                assert error.code in (401, 403)
            password = secrets.token_urlsafe(18)
            account = {"name":"Demo Verification", "email":"demo@example.com", "password":password, "user_type":"student"}
            token = request("/auth/signup", account)["access_token"]
            token = request("/auth/login", {"email":account["email"], "password":password})["access_token"]
            assert request("/auth/me")["user"]["email"] == account["email"]
            request("/onboarding/topics", {"topics":["Network Security", "Endpoint Security"]})
            start = request("/session/start", {})
            session_id = start["session_id"]
            scenario = start["scenario"]
            request("/session/pause", {"session_id":session_id})
            request("/session/resume", {"session_id":session_id})
            completed = 0
            for _ in range(10):
                assert len(scenario["options"]) == 4
                result = request("/scenario/submit", {"session_id":session_id, "scenario_id":scenario["_db_id"], "chosen_key":scenario["options"][0]["key"], "time_taken_sec":15})
                assert result["evaluation"]["verdict"] in ["Optimal","Suboptimal","Risky","Critical"]
                completed += 1
                if result["is_last"]:
                    assert result["narrative"]
                    break
                scenario = result["next_scenario"]
            else:
                raise AssertionError("Session did not complete")
            assert request("/progress/history")
            dashboard = request("/progress/dashboard")
            assert dashboard["total_scenarios"] == completed
            assert sum(topic["attempts"] for topic in dashboard["topic_mastery_list"]) == completed
            assert request("/auth/me")["profile"]["xp"] == dashboard["xp"]
            assert request(f"/progress/narrative?session_id={session_id}")["narrative"]
            assert request("/session/active")["session"] is None
            second = request("/session/start", {})
            request("/session/calloff", {"session_id":second["session_id"]})
            print(f"PASS: production startup, health, Swagger, CORS (3 origins), protected route, signup, login, profile, onboarding, start, pause, resume, {completed} submissions, completion, narrative, history, dashboard, learner updates, XP consistency, calloff. No AI credentials used.")
        finally:
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(server.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                server.terminate()
            server.wait(timeout=15)
