"""
LLM Provider Abstraction Interface.
Allows OnGround to switch between OpenRouter, Claude, Gemini, or local models
without altering the core extraction business logic.
"""

from abc import ABC, abstractmethod

class LLMProvider(ABC):
    """Abstract base class for all LLM extraction providers."""

    @abstractmethod
    def extract_activities(self, raw_text: str) -> str:
        """
        Takes raw normalized daily report text and prompts the LLM.
        Returns the raw JSON string output representing extracted activities.
        Does NOT calculate confidence scores; confidence is computed deterministically
        server-side by extraction_service.py.
        """
        pass
