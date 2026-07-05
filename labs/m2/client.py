import os
from openai import OpenAI
client = OpenAI(base_url=os.environ.get("OPENAI_BASE_URL", "http://host.docker.internal:11434/v1"),
                api_key=os.environ.get("OPENAI_API_KEY", "ollama"))
resp = client.chat.completions.create(
    model=os.environ.get("MODEL", "qwen2.5:1.5b"),
    messages=[{"role": "user", "content": "Explain containers in one sentence."}])
print(resp.choices[0].message.content)
