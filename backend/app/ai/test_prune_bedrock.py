import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

PRUNE_API_KEY = os.getenv("PRUNE_API_KEY")
BEDROCK_URL = os.getenv(
    "PRUNE_BEDROCK_URL",
    "https://api.withprune.com/v1/proxy/bedrock/invoke",
)
MODEL = os.getenv("PRUNE_BEDROCK_MODEL")

if not PRUNE_API_KEY or not MODEL:
    raise RuntimeError(
        "Set PRUNE_API_KEY and PRUNE_BEDROCK_MODEL in backend/.env"
    )

# Placeholder until we confirm Prune's exact request-body format.
# Do not run yet.
print("Prune Bedrock URL:", BEDROCK_URL)
print("Configured model:", MODEL)
print("Credentials found:", bool(PRUNE_API_KEY))
