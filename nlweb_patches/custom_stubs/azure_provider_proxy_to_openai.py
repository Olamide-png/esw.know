# Proxy any Azure provider module to the OpenAI provider shipped in this image.
import os, sys, importlib

# Ensure /app/python is importable even in ad-hoc shells/tests
pp = "/app/python"
if pp not in sys.path:
    sys.path.insert(0, pp)

# Import the real OpenAI provider and expose it as `provider`
_m = importlib.import_module("llm_providers.openai")
provider = getattr(_m, "provider")
