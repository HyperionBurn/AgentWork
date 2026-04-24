# LLM Provider Setup Guide

AgentWork supports multiple LLM providers for real agent responses. This guide explains how to configure and use each provider.

## Default Behavior

By default, agents use **mock responses** (hardcoded responses for demo reliability). To enable real LLM responses:

```bash
USE_REAL_LLM=true
```

## Supported Providers

### 1. OpenAI (Default)

Best for: Production use, general-purpose tasks

```bash
LLM_PROVIDER=openai
USE_REAL_LLM=true

# OpenAI Configuration
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

**Installation:**
```bash
cd agents/research-agent
pip install openai
```

### 2. Google Gemini (Gemini API)

Best for: Hackathon Google prizes, multi-modal capabilities

```bash
LLM_PROVIDER=gemini
USE_REAL_LLM=true

# Gemini Configuration
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3-flash
```

**Installation:**
```bash
cd agents/research-agent
pip install google-generativeai
```

**Getting a Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy the key (starts with `AIzaSy`)

**Supported Models:**
- `gemini-3-flash` - Fast, cost-effective (recommended for demo)
- `gemini-3-pro` - Higher quality, slower

### 3. Featherless API

Best for: Open-source models, cost efficiency, hackathon Featherless prizes

```bash
LLM_PROVIDER=featherless
USE_REAL_LLM=true

# Featherless Configuration
FEATHERLESS_API_KEY=rc_51e9...
FEATHERLESS_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
```

**Installation:**
```bash
cd agents/research-agent
pip install openai  # Featherless uses OpenAI-compatible API
```

**Getting a Featherless API Key:**
1. Go to https://featherless.ai/
2. Sign up (use hackathon promo code if available)
3. Navigate to API Keys section
4. Create a new key

**Supported Models:**
- `meta-llama/Meta-Llama-3.1-70B-Instruct` - Recommended for production
- See https://featherless.ai/models for full list

### 4. AI/ML API

Best for: Multi-provider access (Gemini, Claude, OpenAI, etc.) from one endpoint

```bash
LLM_PROVIDER=ai-ml-api
USE_REAL_LLM=true

# AI/ML API Configuration
AI_ML_API_KEY=75e8...
AI_ML_MODEL=gemini/gemini-3-flash
```

**Installation:**
```bash
cd agents/research-agent
pip install openai  # AI/ML API uses OpenAI-compatible API
```

**Getting an AI/ML API Key:**
1. Go to https://ai-ml-api.com/
2. Sign up (use hackathon promo code if available)
3. Navigate to API Keys section
4. Create a new key

**Supported Models:**
- `gemini/gemini-3-flash` - Gemini Flash
- `gemini/gemini-3-pro` - Gemini Pro
- `claude/claude-3-5-sonnet` - Claude Sonnet
- `openai/gpt-4o` - GPT-4o
- See https://ai-ml-api.com/models for full list

## Quick Start Examples

### Enable Gemini for Hackathon Demo

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and set:
USE_REAL_LLM=true
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...

# Install dependencies (for all agents)
for agent in research-agent code-agent test-agent review-agent; do
    cd agents/$agent
    pip install google-generativeai
    cd ../..
done

# Start agents (they will use Gemini for real responses)
python agents/research-agent/server.py &
python agents/code-agent/server.py &
python agents/test-agent/server.py &
python agents/review-agent/server.py &
```

### Enable Featherless for Cost-Effective Production

```bash
# Edit .env and set:
USE_REAL_LLM=true
LLM_PROVIDER=featherless
FEATHERLESS_API_KEY=rc_51e9...
FEATHERLESS_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct

# OpenAI SDK is already installed for x402 payments
# No additional dependencies needed

# Start agents
python agents/research-agent/server.py &
python agents/code-agent/server.py &
python agents/test-agent/server.py &
python agents/review-agent/server.py &
```

## Provider Comparison

| Provider | Cost per 1K tokens | Speed | Quality | Best For |
|----------|-------------------|-------|---------|----------|
| OpenAI gpt-4o-mini | $0.00015 | Fast | High | Production, general use |
| Gemini 3 Flash | $0.000075 | Very Fast | High | Hackathon Google prizes |
| Featherless Llama-3.1-70B | $0.00020 | Medium | High | Cost-effective, open-source |
| AI/ML API (varies) | Variable | Variable | Variable | Multi-provider access |

## Troubleshooting

### "openai package not installed"
```bash
pip install openai
```

### "google.generativeai package not installed"
```bash
pip install google-generativeai
```

### "No API key provided"
Check that the correct env var is set for your provider:
- OpenAI: `LLM_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Featherless: `FEATHERLESS_API_KEY`
- AI/ML API: `AI_ML_API_KEY`

### Agent returns empty responses
1. Check `USE_REAL_LLM=true` is set
2. Check `LLM_PROVIDER` matches your provider
3. Check API key is valid (no typos)
4. Check agent logs for specific error messages

### Want to test multiple providers quickly?

Use `.env` overrides per agent:
```bash
# Research agent uses Gemini
LLM_PROVIDER=gemini GEMINI_API_KEY=... python agents/research-agent/server.py &

# Code agent uses OpenAI
LLM_PROVIDER=openai LLM_API_KEY=... python agents/code-agent/server.py &
```

## Hackathon Prize Eligibility

- **Google AI Track**: Must use Gemini API for at least one agent
  ```bash
  LLM_PROVIDER=gemini
  GEMINI_API_KEY=...
  ```

- **Featherless AI**: Must use Featherless API for at least one agent
  ```bash
  LLM_PROVIDER=featherless
  FEATHERLESS_API_KEY=...
  ```

- **AI/ML API**: Must use AI/ML API for at least one agent
  ```bash
  LLM_PROVIDER=ai-ml-api
  AI_ML_API_KEY=...
  ```

You can run different agents with different providers simultaneously to maximize prize eligibility!

## Security Notes

- **NEVER** commit `.env` with real API keys
- Add `.env` to `.gitignore` (already in project)
- Rotate API keys if accidentally exposed
- Use separate keys per environment (dev/staging/prod)
- Monitor usage at provider dashboards:
  - OpenAI: https://platform.openai.com/usage
  - Gemini: https://makersuite.google.com/app/apiusage
  - Featherless: https://featherless.ai/dashboard
  - AI/ML API: https://ai-ml-api.com/dashboard

## Additional Resources

- OpenAI Docs: https://platform.openai.com/docs
- Gemini Docs: https://ai.google.dev/gemini-api/docs
- Featherless Docs: https://featherless.ai/docs
- AI/ML API Docs: https://ai-ml-api.com/docs
