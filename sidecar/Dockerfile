FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# system deps for common packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Copy application code early so we can install project requirements if present
COPY . /app

# Install python deps: prefer project's requirements if present, otherwise
# install a minimal runtime set so builds remain robust.
RUN if [ -f /app/NLWeb/webserver/requirements.txt ]; then \
            pip install --no-cache-dir -r /app/NLWeb/webserver/requirements.txt; \
        else \
            pip install --no-cache-dir aiohttp==3.8.5 asyncpg==0.27.0; \
        fi

EXPOSE 7015

ENV PORT=7015

# Create a non-root user to run the service
RUN useradd --system --uid 1000 --create-home sidecar || true
RUN chown -R sidecar:sidecar /app

# Bind to 0.0.0.0 so the service is reachable from outside the container/runtime
USER sidecar
CMD ["/usr/bin/env", "python3", "NLWeb/webserver/aiohttp_server.py", "--host", "0.0.0.0", "--port", "7015"]
