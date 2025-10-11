# Replaces /app/python/core/fastTrack.py inside the container
import logging
logger = logging.getLogger("fast_track")

FAST_TRACK_ENABLED = False

async def do(*args, **kwargs):
    """Module-level entrypoint in some builds; no-op."""
    logger.info("fast_track disabled via patch; skipping.")
    return []

def site_supports_standard_retrieval(*args, **kwargs):
    """Tell upstream to use standard retriever/RAG path."""
    return True

def is_fast_track_enabled(*args, **kwargs):
    return False

def get_supported_sites(*args, **kwargs):
    return []

def prepare_fast_track(*args, **kwargs):
    logger.info("prepare_fast_track() no-op via patch.")
    return None

class FastTrack:
    """
    Some builds import a class from core.fastTrack.
    Provide a harmless stub that never triggers search.
    """
    def __init__(self, *args, **kwargs):
        logger.info("FastTrack stub initialized (no-op).")

    async def run(self, *args, **kwargs):
        logger.info("FastTrack.run() no-op; returning [].")
        return []

    async def do(self, *args, **kwargs):
        logger.info("FastTrack.do() no-op; returning [].")
        return []

    @staticmethod
    def site_supports_standard_retrieval(*args, **kwargs):
        return True
