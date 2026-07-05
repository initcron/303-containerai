# The Acme Support Agent ships as a container: its AGENTS.md/SOUL.md/SKILL.md + a
# few lines of glue. No framework, no heavy deps — stdlib only.
FROM python:3.12-slim
WORKDIR /app
COPY agent/ ./agent/
COPY docs/ ./docs/
ENTRYPOINT ["python", "agent/agent.py"]
