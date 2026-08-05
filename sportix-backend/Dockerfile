# SPORTiX API.
#
# Nothing in here is host-specific: it takes its configuration from the
# environment, listens on $PORT, and does not assume a particular provider.
#
# Build:  docker build -t sportix-api ./sportix-backend
# Run:    docker run -p 8000:8000 --env-file sportix-backend/.env sportix-api

FROM python:3.11-slim AS base

# Bytecode files and stdout buffering are both noise in a container: the former
# because the layer is immutable, the latter because buffered logs arrive late or
# not at all when a process is killed.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Requirements first, so a code change does not reinstall the dependency tree.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as a non-root user. The app writes nothing to disk — uploads go to Appwrite
# Storage — so it needs no writable volume.
RUN useradd --create-home --shell /usr/sbin/nologin sportix \
    && chown -R sportix:sportix /app
USER sportix

# Providers inject $PORT; 8000 is the local default.
ENV PORT=8000
EXPOSE 8000

# /health is unauthenticated and touches no external service, so it answers even
# when Appwrite is unreachable — which is what a liveness probe should measure.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", 8000)}/health', timeout=4).status == 200 else 1)"

# Single worker by default: the app is IO-bound against Appwrite, and the
# in-process rate limiter counts per worker, so multiple workers would multiply
# every limit. Scale with replicas, or move the limiter to shared storage first.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
