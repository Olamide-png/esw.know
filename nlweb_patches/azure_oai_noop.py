# Replaces /app/python/core/llm/providers/azure_oai.py inside the container
import logging
logger = logging.getLogger("azure_oai")
class AzureOpenAIClient:
    def __init__(self, *a, **k):
        logger.info("azure_oai stub active: provider disabled.")
        raise RuntimeError("Azure OpenAI disabled by local policy")
def get_client(*args, **kwargs):
    logger.info("azure_oai stub get_client(): disabled.")
    raise RuntimeError("Azure OpenAI disabled by local policy")
