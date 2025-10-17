#!/usr/bin/env python3
import os
import json
import asyncio
import logging
from typing import AsyncIterator, Dict, Any, List, Optional
from datetime import datetime, UTC

import aiohttp
from aiohttp import web

import re
_HTML_RE = re.compile(r"<[^>]+>")

def _strip_html(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", _HTML_RE.sub(" ", s)).strip()

import asyncpg  # DB pool

# --- logging guard (ensure LOG_LEVEL and `log` always exist) ---
try:
    log  # type: ignore[name-defined]
except NameError:
    LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
    logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.INFO))
    log = logging.getLogger("sidecar")
# ----------------------------------------------------------------

# ----------------------------------------------------------------------
# Environment (module-level constants)
# ----------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")  # optional (DB-backed tools)
MCP_SIDECAR_BEARER = os.getenv("MCP_SIDECAR_BEARER", "sidecarsecret")

# OpenAI (optional; needed for ask/ask_llm)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
DEFAULT_OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
# ----------------------------------------------------------------------

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def _now_ms() -> int:
    return int(datetime.now(UTC).timestamp() * 1000)

async def _safe_agen(gen, log):
    """Wrap an async generator to catch exceptions and emit an error + end envelope."""
    try:
        async for item in gen:
            yield item
    except Exception as e:
        try:
            log.exception("generator failed")
        except Exception:
            pass
        yield {"message_type": "error", "error": str(e)}
        yield {"message_type": "end-nlweb-response", "conversation_id": "", "timestamp": _now_ms()}

async def _sse_writer(request, resp, agen):
    """Robust SSE writer (always returns resp)."""
    try:
        await resp.prepare(request)
        async for payload in agen:
            try:
                if isinstance(payload, (bytes, bytearray)):
                    chunk = bytes(payload)
                elif isinstance(payload, str):
                    # pass-through if already framed; else frame as SSE
                    out = payload if payload.startswith("data: ") else ("data: " + payload + "\n\n")
                    chunk = out.encode("utf-8")
                else:
                    chunk = ("data: " + json.dumps(payload, separators=(",", ":")) + "\n\n").encode("utf-8")
                await resp.write(chunk)
                await asyncio.sleep(0)  # let loop flush
            except Exception:
                logging.exception("SSE write failed")
                break
    except Exception:
        logging.exception("SSE prepare/stream failed")
    finally:
        try:
            await resp.write_eof()
        except Exception:
            pass
        return resp

async def _llm_complete(model: str, prompt: str) -> tuple[Optional[str], Optional[str]]:
    if not OPENAI_API_KEY:
        return None, "OPENAI_API_KEY not set"
    url = f"{OPENAI_API_BASE}/chat/completions"
    payload = {
        "model": model or DEFAULT_OPENAI_MODEL,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": "You answer concisely using only the provided context. If the context is insufficient, say so."},
            {"role": "user", "content": prompt},
        ],
    }
    timeout = aiohttp.ClientTimeout(total=25, connect=10, sock_read=20)
    async with aiohttp.ClientSession(timeout=timeout) as sess:
        async with sess.post(
            url,
            headers={"authorization": f"Bearer {OPENAI_API_KEY}", "content-type": "application/json"},
            json=payload,
        ) as r:
            txt = await r.text()
            if r.status != 200:
                return None, f"openai error {r.status}: {txt[:400]}"
            try:
                data = await r.json()
                return data["choices"][0]["message"]["content"], None
            except Exception as e:
                return None, f"bad openai payload: {txt[:400]} ({e})"

# ----------------------------------------------------------------------
# HTTP handlers
# ----------------------------------------------------------------------
async def healthz(_request: web.Request) -> web.Response:
    return web.json_response({"ok": True, "ts": datetime.now(UTC).isoformat()})

async def on_startup(app: web.Application):
    # connect Postgres pool if DATABASE_URL is present
    if DATABASE_URL:
        try:
            log.info("[sidecar] Connecting Postgres pool …")
            app["pg_pool"] = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=5)
            log.info("[sidecar] Postgres pool ready.")
        except Exception as e:
            log.error("[sidecar][ERROR] Failed to create Postgres pool: %r", e, exc_info=True)
            app["pg_pool"] = None
    else:
        log.warning("[sidecar] DATABASE_URL not set: running without Postgres")
        app["pg_pool"] = None

async def on_cleanup(app: web.Application):
    pool = app.get("pg_pool")
    if pool:
        await pool.close()

async def handle_sse_test(request: web.Request):
    async def agen():
        yield {"message_type": "begin", "ts": 0}
        yield {"message_type": "ping", "n": 1}
        yield {"message_type": "end"}
    resp = web.StreamResponse(status=200, headers={"Content-Type": "text/event-stream"})
    return await _sse_writer(request, resp, _safe_agen(agen(), log))

async def handle_ask(request: web.Request) -> web.StreamResponse:
    # --- auth ---
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer ") or auth.split(" ", 1)[1] != MCP_SIDECAR_BEARER:
        return web.json_response({"ok": False, "error": "unauthorized"}, status=401)

    # --- parse body ---
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "invalid json"}, status=400)

    action = (body.get("action") or "").strip()
    tool   = (body.get("tool") or "").strip()
    params = body.get("params") or {}

    # Always stream SSE for /ask
    resp = web.StreamResponse(status=200, headers={"Content-Type":"text/event-stream"})

    def _begin(query=""):
        return {"message_type":"begin-nlweb-response","conversation_id":"","query":query,"timestamp": _now_ms()}
    def _status(msg):
        return {"message_type":"intermediate_message","status": msg,"timestamp": _now_ms()/1000.0,"message_id":f"msg_{_now_ms()}#1","conversation_id":"","sender_info":{"id":"nlweb_assistant","name":"NLWeb Assistant"}}
    def _end():
        return {"message_type":"end-nlweb-response","conversation_id":"","timestamp": _now_ms()}

    async def stream(gen):
        # Always wrap in _safe_agen to avoid silent task cancellation breaking SSE
        return await _sse_writer(request, resp, _safe_agen(gen, log))

    # Hard fail if DB is not configured
    pool = request.app.get("pg_pool")
    if action == "tool.call" and tool in {"doc_search", "doc_extract"} and not pool:
        async def agen():
            yield _begin(params.get("query") or params.get("path") or "")
            yield {"message_type":"error","error":"database not configured"}
            yield _end()
        return await stream(agen())

    # -------------------- doc_search --------------------

    if action == "tool.call" and tool == "doc_search":
        query = params.get("query", "")
        k = int(params.get("k", 3))

        async def agen():
            yield _begin(query)
            yield _status("Searching ...")

            pool = request.app.get("pg_pool")
            if not pool:
                yield {"message_type": "error", "error": "database not available"}
                yield _end()
                return

            sql = """
            SELECT url, title, site, snippet, r
            FROM (
              SELECT DISTINCT ON (path)
                path AS url,
                title,
                site,
                ts_rank(tsv, websearch_to_tsquery('pg_catalog.simple', $1)) AS r,
                left(regexp_replace(text, '<[^>]+>', ' ', 'g'), 400) AS snippet
              FROM rag_chunks
              WHERE tsv @@ websearch_to_tsquery('pg_catalog.simple', $1)
              ORDER BY path, r DESC
            ) t
            ORDER BY r DESC
            LIMIT $2
            """

            items = []
            try:
                async with pool.acquire() as conn:
                    rows = await conn.fetch(sql, query, k)
                for r in rows:
                    # derive a plain-text snippet for description
                    full_plain = _strip_html(r.get("snippet") or r.get("title") or r.get("url"))
                    items.append({
                        "@type": "Item",
                        "url": r["url"],
                        "name": r["title"] or r["url"],
                        "site": r["site"] or "docs",
                        "description": full_plain if len(full_plain) <= 280 else (full_plain[:280] + "…"),
                    })
            except Exception as e:
                log.exception("doc_search query failed")
                yield {"message_type":"error","error": f"doc_search failed: {e}"}
                yield _end()
                return

            yield {
                "message_type":"result",
                "sender_type":"assistant",
                "message_id":"tool-doc-search",
                "timestamp": datetime.now(UTC).isoformat(),
                "content": items,
                "conversation_id":"",
                "sender_info":{"id":"nlweb_assistant","name":"NLWeb Assistant"}
            }
            yield _end()

        return await stream(agen())

    # -------------------- doc_extract --------------------
    if action == "tool.call" and tool == "doc_extract":
        path = (params.get("path") or "").strip()
        try:
            max_chars = int(params.get("max_chars", 2000))
            if max_chars <= 0:
                max_chars = 2000
        except Exception:
            max_chars = 2000

        async def agen():
            yield _begin(path)
            yield _status("Extracting ...")

            try:
                async with pool.acquire() as conn:
                    rows = await conn.fetch("""
                        SELECT
                          COALESCE(text, '')              AS text,
                          COALESCE(chunk_index, 0)        AS idx,
                          COALESCE(title, '')             AS title,
                          COALESCE(site,  '')             AS site
                        FROM rag_chunks
                        WHERE path = $1
                        ORDER BY idx ASC
                    """, path)
            except Exception as e:
                log.exception("doc_extract query failed")
                yield {"message_type":"error","error":f"doc_extract failed: {e!s}"}
                yield _end()
                return

            buf, total = [], 0
            for r in rows:
                t = r["text"]
                if max_chars and total + len(t) > max_chars:
                    t = t[: max_chars - total]
                if t:
                    buf.append(t)
                    total += len(t)
                if max_chars and total >= max_chars:
                    break

            full = "\n\n".join(buf)
            full_plain = _strip_html(full)

            title = rows[0]["title"] if rows else (path.rsplit("/",1)[-1] or path or "document")
            site  = rows[0]["site"]  if rows else "docs"

            item = {
                "@type":"Item",
                "url": path,
                "name": title,
                "site": site,
                "description": full_plain if len(full_plain) <= 280 else (full_plain[:280] + "…"),
                "schema_object": {
                    "url": path,
                    "path": path,
                    "title": title,
                    "site": site,
                    "score": 1.0,
                    "kind": "doc",
                    "text": full_plain,
                }
            }

            yield {
                "message_type":"result",
                "sender_type":"assistant",
                "message_id":"tool-doc-extract",
                "timestamp": datetime.now(UTC).isoformat(),
                "content": [item],
                "conversation_id":"",
                "sender_info":{"id":"nlweb_assistant","name":"NLWeb Assistant"}
            }
            yield _end()
        return await stream(agen())

    # --- default ---
    async def agen_default():
        yield {"message_type":"error","error":"unknown action/tool"}
        yield _end()
    return await stream(agen_default())

def make_app() -> web.Application:
    app = web.Application()
    app.router.add_get('/sse-test', handle_sse_test)
    app.router.add_get("/healthz", healthz)
    app.router.add_post("/ask", handle_ask)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    return app

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7015)
    args = parser.parse_args()
    log.info("[sidecar] Starting on http://%s:%d", args.host, args.port)
    web.run_app(make_app(), host=args.host, port=args.port, access_log=None)
