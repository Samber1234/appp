# Dockerfile oficial para TechNova Retail AI Engine (HU0047 / CP052)
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend_local/ /app/backend_local/
COPY frontend_maqueta/ /app/frontend_maqueta/
COPY tienda_externa/ /app/tienda_externa/

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend_local

CMD ["python", "backend_local/server.py"]
