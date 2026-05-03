"""
Install dependencies from requirements.txt (same Python as this script), then start Uvicorn.

Usage (from this folder):
  python run_server.py
"""
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent
REQ = BACKEND / "requirements.txt"


def main() -> None:
    if REQ.is_file():
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", str(REQ)],
            cwd=BACKEND,
        )
    subprocess.check_call(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--reload",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
        ],
        cwd=BACKEND,
    )


if __name__ == "__main__":
    main()
