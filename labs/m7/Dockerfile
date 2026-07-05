# The Incident Crew ships as one container: four markdown profiles + the crew glue.
# All four agents share ONE native model endpoint — agents are cheap, the model is shared.
FROM python:3.12-slim
WORKDIR /app
COPY crew/ ./crew/
COPY docs/ ./docs/
ENTRYPOINT ["python", "crew/crew.py"]
