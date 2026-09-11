"""
Optional LLM reasoning layer for the contradiction detection pipeline.
Gated behind a config flag and designed to be a tiebreaker/fallback for ambiguous cases.

Adapted from the standalone contradiction_detection module.
"""

from typing import Dict, Any, Optional, Tuple
import json
import logging

logger = logging.getLogger(__name__)

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    anthropic = None

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None


class LLMReasoner:
    """
    Uses LLMs to reason about whether two statements contradict each other.
    Designed to be used only when deterministic layers produce uncertain results.
    """

    def __init__(self, provider: str = "anthropic", model: str = None, api_key: str = None):
        self.provider = provider.lower()
        self.model = model
        self.api_key = api_key
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the LLM client based on provider."""
        if self.provider == "anthropic":
            if not ANTHROPIC_AVAILABLE:
                logger.warning("Anthropic library not available. LLM reasoning disabled.")
                return
            try:
                self.client = anthropic.Anthropic(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {e}")
                self.client = None
        elif self.provider == "openai":
            if not OPENAI_AVAILABLE:
                logger.warning("OpenAI library not available. LLM reasoning disabled.")
                return
            try:
                self.client = openai.OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
                self.client = None
        else:
            logger.warning(f"Unsupported LLM provider: {self.provider}")
            self.client = None

    def is_available(self) -> bool:
        """Check if the LLM reasoner is available."""
        return self.client is not None

    def reason_about_contradiction(
        self,
        statement_a: str,
        statement_b: str,
        topic: str = None
    ) -> Tuple[bool, float, str]:
        """Use LLM to reason about whether two statements contradict each other."""
        if not self.is_available():
            return False, 0.0, "LLM reasoning unavailable"

        prompt = self._build_contradiction_prompt(statement_a, statement_b, topic)

        try:
            if self.provider == "anthropic":
                return self._reason_with_anthropic(prompt)
            elif self.provider == "openai":
                return self._reason_with_openai(prompt)
            else:
                return False, 0.0, f"Unsupported LLM provider: {self.provider}"
        except Exception as e:
            logger.warning(f"LLM reasoning failed: {e}")
            return False, 0.0, f"LLM reasoning error: {str(e)}"

    def _build_contradiction_prompt(
        self,
        statement_a: str,
        statement_b: str,
        topic: str = None
    ) -> str:
        system_prompt = """You are a clinical contradiction detection assistant. Your task is to determine if two statements from clinical documents contradict each other.

IMPORTANT RULES:
1. Do NOT use outside medical knowledge - only compare the two statements given
2. Never output an authorization decision (approve/deny/etc.)
3. Only analyze whether the statements contradict each other based on their exact text
4. Consider negation, affirmation, and clinical meaning
5. Return structured JSON only"""

        user_prompt = f"""Analyze these two clinical statements for contradictions:

Statement A: "{statement_a}"
Statement B: "{statement_b}"

{f"Topic context: {topic}" if topic else ""}

Determine if these statements contradict each other. A contradiction exists when:
- One statement affirms something while the other negates it (same topic)
- One states a positive finding while the other states a negative finding for the same test/condition
- The statements make mutually exclusive claims about the same clinical fact

Respond with ONLY a JSON object in this format:
{{
  "is_contradiction": boolean,
  "confidence": float between 0.0 and 1.0,
  "reasoning": "brief explanation of your reasoning"
}}"""

        return system_prompt + "\n\n" + user_prompt

    def _reason_with_anthropic(self, prompt: str) -> Tuple[bool, float, str]:
        try:
            message = self.client.messages.create(
                model=self.model or "claude-3-haiku-20240307",
                max_tokens=200,
                temperature=0.0,
                system="You are a clinical contradiction detection assistant. Follow the instructions exactly.",
                messages=[{"role": "user", "content": prompt}]
            )
            response_text = message.content[0].text.strip()
            return self._parse_llm_response(response_text)
        except Exception as e:
            logger.warning(f"Anthropic API call failed: {e}")
            return False, 0.0, f"Anthropic API error: {str(e)}"

    def _reason_with_openai(self, prompt: str) -> Tuple[bool, float, str]:
        try:
            response = self.client.chat.completions.create(
                model=self.model or "gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a clinical contradiction detection assistant. Follow the instructions exactly."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.0
            )
            response_text = response.choices[0].message.content.strip()
            return self._parse_llm_response(response_text)
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}")
            return False, 0.0, f"OpenAI API error: {str(e)}"

    def _parse_llm_response(self, response_text: str) -> Tuple[bool, float, str]:
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON object found in response")

            json_str = response_text[start_idx:end_idx]
            result = json.loads(json_str)

            is_contradiction = bool(result.get("is_contradiction", False))
            confidence = float(result.get("confidence", 0.0))
            reasoning = str(result.get("reasoning", "No reasoning provided"))

            confidence = max(0.0, min(1.0, confidence))
            return is_contradiction, confidence, reasoning

        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.warning(f"Failed to parse LLM response: {e}. Response: {response_text}")
            return False, 0.0, f"Failed to parse LLM response: {str(e)}"


def is_llm_reasoning_available() -> bool:
    """Check if any LLM reasoning providers are available."""
    return ANTHROPIC_AVAILABLE or OPENAI_AVAILABLE


def create_llm_reasoner_from_config(config_dict: Dict[str, Any]) -> Optional[LLMReasoner]:
    """Create an LLM reasoner instance from configuration dictionary."""
    if not config_dict.get("ENABLE_LLM_REASONING", False):
        return None

    provider = config_dict.get("LLM_PROVIDER", "anthropic")
    model = config_dict.get("LLM_MODEL")
    api_key = config_dict.get("LLM_API_KEY")

    reasoner = LLMReasoner(provider=provider, model=model, api_key=api_key)
    return reasoner if reasoner.is_available() else None
