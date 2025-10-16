# Using .env with Docker Compose

This repository expects sensitive configuration (like API keys) to be provided via an untracked `.env` file.

Quick steps:

1. Copy the example file:

   cp .env.example .env

2. Edit `.env` and set your OpenAI API key (do not commit `.env`):

   OPENAI_API_KEY=sk-...

3. Start the services with Docker Compose. The `docker-compose.yml` reads variables from the environment and/or the `.env` file:

   docker compose up -d

Notes:
- `.env` is listed in `.gitignore` so it will not be committed.
- Keep secrets out of the repository. Use environment variables, secret managers, or CI/CD encrypted secrets instead.
- If you need a per-developer example, edit `.env.example` and commit that instead.

