import logging
logger = logging.getLogger("azure_provider_stub")

# Use a tiny client that will error on any attempt to call it.
class _DisabledClient:
    def __getattr__(self, name):
        raise RuntimeError("Azure OpenAI disabled by local policy")

# Some builds do: obj = Provider.get_client() ; then obj is used.
# Others do: provider = Provider(...); provider.get_client()
# Handle both by offering a class with the expected method names.
class AzureProviderDisabled:
    @classmethod
    def get_client(cls, *a, **k):
        logger.info("Azure provider stub get_client(): disabled.")
        raise RuntimeError("Azure OpenAI disabled by local policy")

# Compatibility for modules that expect symbols:
# - class AzureOpenAIClient
# - function get_client(...)
class AzureOpenAIClient(_DisabledClient):
    pass

def get_client(*args, **kwargs):
    logger.info("Azure provider stub get_client(): disabled.")
    raise RuntimeError("Azure OpenAI disabled by local policy")
