FROM python:3.12-slim
RUN pip install --no-cache-dir openai
WORKDIR /app
COPY client.py .
CMD ["python", "client.py"]
