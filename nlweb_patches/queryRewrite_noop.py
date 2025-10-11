# Replaces /app/python/core/query_analysis/query_rewrite.py inside the container
import logging
logger = logging.getLogger("query_rewrite")

REWRITE_ENABLED = False

def _extract_query(args, kwargs):
    # try kwargs first
    for key in ("query", "text", "q"):
        if key in kwargs and isinstance(kwargs[key], str):
            return kwargs[key]
    # then first string-like positional
    for a in args:
        if isinstance(a, str):
            return a
    # nothing sensible found
    logger.info("query_rewrite noop: no query found in args/kwargs; returning empty string.")
    return ""

# ---- Function-style API
async def rewrite(query: str, *args, **kwargs) -> str:
    logger.info("query_rewrite disabled via patch; using original query.")
    return query

# ---- Class-style API
class QueryRewrite:
    def __init__(self, *args, **kwargs):
        logger.info("QueryRewrite stub initialized (no-op).")

    async def rewrite(self, query: str, *args, **kwargs) -> str:
        logger.info("QueryRewrite.rewrite() no-op; using original query.")
        return query

    async def do(self, *args, **kwargs) -> str:
        # accept any signature; pull query from args/kwargs
        q = _extract_query(args, kwargs)
        logger.info("QueryRewrite.do() no-op; using original query.")
        return q

    async def run(self, *args, **kwargs) -> str:
        q = _extract_query(args, kwargs)
        logger.info("QueryRewrite.run() no-op; using original query.")
        return q

    async def process(self, *args, **kwargs) -> str:
        q = _extract_query(args, kwargs)
        logger.info("QueryRewrite.process() no-op; using original query.")
        return q

def is_enabled() -> bool:
    return False
