"""Backend AI adapter delegating to AIProvider.

Kept for backwards compatibility with existing test suites and service imports.
"""
from app.services.ai_provider import AIUnavailable, get_ai_provider


def complete(schema, task, context, image=None):
    provider = get_ai_provider()
    return provider.complete(schema, task, context, image=image)
