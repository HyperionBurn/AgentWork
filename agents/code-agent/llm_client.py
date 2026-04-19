"""
LLM Client — Optional real LLM integration for agent responses.
When USE_REAL_LLM is not set, returns enriched mock responses.
When set, calls OpenAI-compatible API for real completions.
"""

import os
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

USE_REAL_LLM = os.environ.get("USE_REAL_LLM", "false").lower() == "true"
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")


def call_llm(prompt: str, system_prompt: str = "", max_tokens: int = 500) -> str:
    """
    Call LLM API or return enriched mock response.
    Returns the text content of the response.
    """
    if not USE_REAL_LLM or not LLM_API_KEY:
        logger.debug("LLM disabled or no API key — returning mock response")
        return ""

    try:
        import openai

        client = openai.OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""

    except ImportError:
        logger.warning("openai package not installed — install with: pip install openai")
        return ""
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return ""


# Agent-specific system prompts for high-quality specialist responses
AGENT_SYSTEM_PROMPTS: dict[str, str] = {
    "Code Agent": (
        "You are an expert software engineer AI agent. Your expertise includes code generation, "
        "implementation, refactoring, and API design. When given a task: (1) Analyze requirements, "
        "(2) Write clean, well-documented code, (3) Include error handling and edge cases, "
        "(4) Provide a brief explanation of design decisions. Output code in appropriate blocks. "
        "Prefer idiomatic patterns and modern best practices."
    ),
}


def enrich_with_llm(agent_name: str, task: str, mock_response: str) -> str:
    """
    Try to enrich a mock response with real LLM output.
    Falls back to the mock response if LLM fails.
    """
    system_prompt = AGENT_SYSTEM_PROMPTS.get(
        agent_name,
        f"You are an AI agent named {agent_name}. Be concise and professional.",
    )
    llm_output = call_llm(
        prompt=f"Complete this task concisely:\n{task}",
        system_prompt=system_prompt,
        max_tokens=500,
    )
    return llm_output if llm_output else mock_response
