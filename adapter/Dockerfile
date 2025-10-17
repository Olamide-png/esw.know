FROM node:20-slim

# Create non-root user
RUN groupadd -r app && useradd -r -g app -m app

WORKDIR /app

# Copy adapter code
COPY adapter-server.mjs ./

RUN chown -R app:app /app
USER app

EXPOSE 3000
CMD ["node", "adapter-server.mjs"]
