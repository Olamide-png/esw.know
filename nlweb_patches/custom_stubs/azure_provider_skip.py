import logging
logger = logging.getLogger("azure_provider_stub")

class _DisabledProvider:
    # Identity the loader might read
    name = "azure_openai"
    id = "azure_openai"
    priority = -100  # make sure it's always “least preferred”
    enabled = False

    def __init__(self, *args, **kwargs):
        pass

    # Discovery hooks some loaders use
    def is_available(self) -> bool:
        # Return False so registries that check can skip silently
        logger.info("Azure provider marked unavailable by stub.")
        return False

    # --- Sync completion-style APIs some wrappers call -----------------------
    def get_completion(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

    def get_chat_completion(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

    def count_tokens(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

    def embed(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

    # --- Async variants (if wrapper awaits) ----------------------------------
    async def aget_completion(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

    async def aget_chat_completion(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

    async def aembed(self, *args, **kwargs):
        raise RuntimeError("Azure OpenAI disabled by policy (stub).")

# What the loader looks for:
provider = _DisabledProvider()

