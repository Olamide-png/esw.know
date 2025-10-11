import logging
logger = logging.getLogger("azure_openai")
class AzureOpenAIClient:
    def __init__(self, *a, **k):
        logger.info("azure_openai stub active: provider disabled.")
        raise RuntimeError("Azure OpenAI disabled by local policy")
def get_client(*args, **kwargs):
    logger.info("azure_openai stub get_client(): disabled.")
    raise RuntimeError("Azure OpenAI disabled by local policy")
