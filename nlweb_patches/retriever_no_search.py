# Replaces /app/python/core/retriever.py inside the container
import logging, json, os
logger = logging.getLogger("retriever")

# --- lifecycle ---------------------------------------------------------------
def init(*args, **kwargs):
    logger.info("retriever.init() no-op via patch.")
def setup(*args, **kwargs):
    logger.info("retriever.setup() no-op via patch.")
def configure(*args, **kwargs):
    logger.info("retriever.configure() no-op via patch.")

# --- helpers -----------------------------------------------------------------
def _deep_find_path(obj):
    """Search arbitrarily nested structures for a 'path' or 'url' string."""
    try:
        # direct string is not useful here
        if isinstance(obj, dict):
            for k in ("path", "url", "site_path"):
                v = obj.get(k)
                if isinstance(v, str) and v:
                    return v
            # nested
            for v in obj.values():
                r = _deep_find_path(v)
                if r:
                    return r
        elif isinstance(obj, (list, tuple)):
            for v in obj:
                r = _deep_find_path(v)
                if r:
                    return r
        # ignore other primitives
    except Exception:
        pass
    return None

def _extract_path(args, kwargs):
    # 1) explicit kwargs first
    for k in ("path", "url", "site_path"):
        v = kwargs.get(k)
        if isinstance(v, str) and v:
            return v
    # 2) try a top-level dict hint
    v = kwargs.get("query_params") or kwargs.get("params") or kwargs.get("payload")
    r = _deep_find_path(v) if v is not None else None
    if r:
        return r
    # 3) scan all positional args (deep)
    for a in args:
        r = _deep_find_path(a)
        if r:
            return r
    # 4) environment override for debugging
    v = os.environ.get("NLWEB_DEBUG_PATH")
    if isinstance(v, str) and v:
        return v
    # 5) fallback
    return "/"

def _int(v, d):
    try:
        return int(v)
    except Exception:
        return d

# --- search(): feed ranking with a single local doc candidate ----------------
async def search(*args, **kwargs):
    """
    Return exactly the shape ranking expects: [(url, json_str, name, site)]
    """
    p = _extract_path(args, kwargs)
    meta = {
        "url": p,
        "path": p,
        "title": p,
        "site": "local",
        "score": 1.0,
        "kind": "doc",
        "justification": "synthetic_local_path"
    }
    tup = (p, json.dumps(meta), meta["title"], "local")
    logger.info("retriever.search() synthetic 4-tuple for path=%s", p)
    return [tup]

# --- retrieve(): actually fetch chunks for the path from Postgres ------------
async def retrieve(*args, **kwargs):
    """
    Return a list of chunk dicts the generator can use as context.
    We query rag_* tables by path and return small, safe fields.
    """
    p = _extract_path(args, kwargs)
    limit = _int(kwargs.get("limit"), 16)
    dburl = os.environ.get("DATABASE_URL")
    if not dburl:
        logger.warning("retrieve(): DATABASE_URL not set; returning [].")
        return []

    try:
        import psycopg2
    except Exception as e:
        logger.error("retrieve(): psycopg2 missing in container: %s", e)
        return []

    q_attempts = [
        (
            "SELECT c.content FROM rag_chunks c "
            "JOIN rag_documents d ON c.document_id = d.id "
            "WHERE d.path = %s ORDER BY c.id LIMIT %s",
            lambda: (p, limit),
        ),
        (
            "SELECT c.content FROM rag_chunks c "
            "JOIN rag_documents d ON c.doc_id = d.id "
            "WHERE d.path = %s ORDER BY c.id LIMIT %s",
            lambda: (p, limit),
        ),
        (
            "SELECT content FROM rag_chunks WHERE path = %s ORDER BY id LIMIT %s",
            lambda: (p, limit),
        ),
    ]

    rows = []
    conn = cur = None
    try:
        conn = psycopg2.connect(dburl)
        cur = conn.cursor()
        for sql, params_fn in q_attempts:
            try:
                cur.execute(sql, params_fn())
                rows = cur.fetchall()
                if rows:
                    logger.info("retrieve(): got %d chunks via query for path=%s.", len(rows), p)
                    break
            except Exception as e:
                logger.info("retrieve(): query attempt failed (%s): %s", sql.split()[0], e)
        if not rows:
            logger.warning("retrieve(): no rows found for path=%s; returning [].", p)
            return []
    except Exception as e:
        logger.error("retrieve(): DB error: %s", e)
        return []
    finally:
        try:
            if cur: cur.close()
            if conn: conn.close()
        except Exception:
            pass

    items = []
    for (content,) in rows:
        try:
            if isinstance(content, memoryview):
                content = content.tobytes().decode("utf-8", "ignore")
        except Exception:
            pass
        if not isinstance(content, str):
            content = str(content)
        items.append({
            "url": p,
            "path": p,
            "site": "local",
            "title": p,
            "content": content,
            "kind": "chunk"
        })
    return items

# --- clients & factories -----------------------------------------------------
class RetrieverClient:
    def __init__(self, *args, **kwargs):
        logger.info("RetrieverClient stub (no-op client wrapper).")
    async def search(self, *args, **kwargs):
        return await search(*args, **kwargs)
    async def retrieve(self, *args, **kwargs):
        return await retrieve(*args, **kwargs)

class VectorDBClient:
    def __init__(self, *args, **kwargs):
        pass
    async def similarity_search(self, *args, **kwargs):
        return []
    async def query(self, *args, **kwargs):
        return []
    async def upsert(self, *args, **kwargs):
        return None
    async def count(self, *args, **kwargs):
        return 0

class DocumentStoreClient:
    def __init__(self, *args, **kwargs):
        pass
    async def fetch_document_by_path(self, *args, **kwargs):
        return None

def get_client(*args, **kwargs):
    return RetrieverClient()
def get_vector_db_client(*args, **kwargs):
    return VectorDBClient()
def get_vector_store(*args, **kwargs):
    return VectorDBClient()
def get_document_store(*args, **kwargs):
    return DocumentStoreClient()

def set_backend(*args, **kwargs):
    logger.info("retriever.set_backend() no-op.")
def is_enabled(*args, **kwargs):
    return True


