import os, json, logging, re, urllib.parse
import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger("retriever")
DB_URL = os.environ.get("DATABASE_URL", "")

def init():
    if DB_URL:
        logger.info("retriever.init(): %s", DB_URL.rsplit("@",1)[-1])
    else:
        logger.warning("retriever.init(): DATABASE_URL missing")

def close():
    pass

class _PGVectorClient:
    async def search(self, query, site, num_results=8, **kwargs):
        return await search(query, site, num_results=num_results, **kwargs)

def get_vector_db_client(*_a, **_k):
    return _PGVectorClient()

def _conn():
    if not DB_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(DB_URL)

def _extract_path(kwargs):
    # prefer explicit path/url from request
    for k in ("path","url","doc_path"):
        v = kwargs.get(k)
        if isinstance(v, str) and v:
            return v
    qp = kwargs.get("query_params")
    if isinstance(qp, dict):
        for k in ("path","url","doc_path"):
            v = qp.get(k)
            if isinstance(v, str) and v:
                return v
    return "/"

def _normalize_path(p):
    p = p or "/"
    # strip scheme/host, anchors, query
    p = re.sub(r"^[a-z]+://[^/]+", "", p, flags=re.I)
    p = p.split("#",1)[0].split("?",1)[0]
    if not p.startswith("/"):
        p = "/" + p
    try:
        p = urllib.parse.unquote(p)
    except Exception:
        pass
    return p

def _slug_from_path(p):
    """e.g. '/docs/pricing-advisor/' -> 'pricing-advisor'"""
    p = p.rstrip("/")
    leaf = p.split("/")[-1] or ""
    return leaf

def _first_nonempty(*vals):
    for v in vals:
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""

def _merge_chunks(rows, limit_chars=12000):
    parts = []
    for r in rows:
        t = _first_nonempty(r.get("text",""))
        h = _first_nonempty(r.get("heading",""))
        parts.append(_first_nonempty(f"{h}\n\n{t}" if h and t else h or t))
    text = "\n\n".join(s for s in parts if s)
    if len(text) > limit_chars:
        text = text[:limit_chars] + "…"
    return text

async def search(query, site, num_results=8, **kwargs):
    """Path-only retriever that DOES NOT use source_url (empty in your DB).
       Strategy:
         1) Extract slug from requested path.
         2) Try rag_documents WHERE doc_id/title ILIKE %slug%.
         3) If found, fetch chunks by doc_id and merge to a single text.
         4) Else, try rag_chunks WHERE doc_id ILIKE %slug% (fallback).
    """
    raw_path  = _extract_path(kwargs)
    path_only = _normalize_path(raw_path)
    slug      = _slug_from_path(path_only)
    site      = site or "local"
    logger.info("retriever.search() postgres path-only by slug; path=%s slug=%s", path_only, slug)

    if not slug:
        # nothing to match with — return placeholder
        js = {
            "url": path_only, "path": path_only, "title": path_only,
            "site": site, "score": 1.0, "kind": "doc",
            "justification": "no_slug_from_path", "text": ""
        }
        return [(path_only, json.dumps(js), path_only, site)]

    try:
        with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1) Match documents by doc_id or title containing the slug
            cur.execute(
                """SELECT doc_id, title
                   FROM rag_documents
                   WHERE doc_id ILIKE %s OR title ILIKE %s
                   ORDER BY created_at DESC NULLS LAST, doc_id ASC
                   LIMIT 1""",
                (f"%{slug}%", f"%{slug}%")
            )
            doc = cur.fetchone()
            if doc and "doc_id" in doc:
                doc_id = doc["doc_id"]
                title  = _first_nonempty(doc.get("title"), path_only)
                logger.info("Matched rag_documents by slug='%s' → doc_id=%s", slug, doc_id)

                cur.execute(
                    """SELECT heading, content AS text
                       FROM rag_chunks
                       WHERE doc_id = %s
                       ORDER BY chunk_id ASC NULLS LAST
                       LIMIT %s""",
                    (doc_id, max(1, int(num_results or 16)))
                )
                ch = cur.fetchall()
                text = _merge_chunks(ch)
                js = {
                    "url": path_only, "path": path_only, "title": title,
                    "site": site, "score": 0.99, "kind": "doc",
                    "justification": "postgres_docid_by_slug",
                    "text": text
                }
                return [(path_only, json.dumps(js), title, site)]

            # 2) Fallback: try chunks doc_id by slug
            cur.execute(
                """SELECT doc_id
                   FROM rag_chunks
                   WHERE doc_id ILIKE %s
                   ORDER BY doc_id ASC
                   LIMIT 1""",
                (f"%{slug}%",)
            )
            doc2 = cur.fetchone()
            if doc2 and "doc_id" in doc2:
                doc_id = doc2["doc_id"]
                logger.info("Matched rag_chunks by slug='%s' → doc_id=%s", slug, doc_id)
                cur.execute(
                    """SELECT heading, content AS text
                       FROM rag_chunks
                       WHERE doc_id = %s
                       ORDER BY chunk_id ASC NULLS LAST
                       LIMIT %s""",
                    (doc_id, max(1, int(num_results or 16)))
                )
                ch = cur.fetchall()
                text = _merge_chunks(ch)
                js = {
                    "url": path_only, "path": path_only, "title": path_only,
                    "site": site, "score": 0.95, "kind": "doc",
                    "justification": "postgres_chunks_docid_by_slug",
                    "text": text
                }
                return [(path_only, json.dumps(js), path_only, site)]

    except Exception as e:
        logger.exception("PG path-only query failed: %s", e)

    # 3) Nothing: minimal placeholder so ranking won’t explode
    js = {
        "url": path_only, "path": path_only, "title": path_only,
        "site": site, "score": 1.0, "kind": "doc",
        "justification": "postgres_no_rows", "text": ""
    }
    return [(path_only, json.dumps(js), path_only, site)]

async def retrieve(*args, **kwargs):
    site = kwargs.get("site", "local")
    q    = kwargs.get("query", "")
    return await search(q, site, num_results=kwargs.get("num_results", 8), **kwargs)






