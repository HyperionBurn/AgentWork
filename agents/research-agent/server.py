"""
AgentWork — Research Agent
Deep research, information synthesis, and citation specialist.

This agent exposes a free metadata endpoint (/) and a paywalled
research endpoint (/api/research) that requires x402 payment.
"""

import os
import asyncio
import threading
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"), override=True)

from llm_client import enrich_with_llm

# ============================================================
# Configuration
# ============================================================

AGENT_TYPE = "research"
AGENT_NAME = "Research Agent"
AGENT_VERSION = "1.0.0"
AGENT_PORT = int(os.getenv("RESEARCH_AGENT_PORT", "4021"))
AGENT_DESCRIPTION = "Deep research, information synthesis, and citation specialist"
SELLER_ADDRESS = os.getenv("RESEARCH_AGENT_WALLET", "")

# ============================================================
# Price Normalization (SDK requires dollar prefix)
# ============================================================

def normalize_price(env_var: str, default: str = "$0.005") -> str:
    """Ensure price has dollar prefix (SDK requires '$0.005' not '0.005')."""
    price = os.getenv(env_var, default)
    if not price.startswith("$"):
        price = f"${price}"
    return price

AGENT_PRICE = normalize_price("RESEARCH_AGENT_PRICE", "$0.005")

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format=f"%(asctime)s [{AGENT_TYPE}] %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

# ============================================================
# Flask App
# ============================================================

app = Flask(__name__)


# ============================================================
# CORS — Allow cross-origin requests from dashboard
# ============================================================

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Payment-Signature, X-Payment-Version"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# ============================================================
# x402 Payment Middleware (circlekit)
# ============================================================
# When circlekit is installed, it provides create_gateway_middleware
# which handles 402 challenges and payment verification.
# Falls back to a passthrough mode for development without the SDK.
# ============================================================

gateway_middleware = None
_loop = asyncio.new_event_loop()
_loop_thread = None

try:
    from circlekit import create_gateway_middleware
    from circlekit.x402 import PaymentInfo

    if SELLER_ADDRESS:
        gateway_middleware = create_gateway_middleware(
            seller_address=SELLER_ADDRESS,
            chain="arcTestnet",
        )
        logger.info(f"circlekit gateway middleware initialized for {SELLER_ADDRESS}")
    else:
        logger.warning(
            f"{AGENT_TYPE.upper()}_AGENT_WALLET not set — running in passthrough mode (no payments)"
        )
except ImportError as e:
    logger.warning(f"circlekit not installed — running in passthrough mode ({e})")
    logger.warning("Install with: pip install circlekit")
except Exception as e:
    logger.error(f"circlekit initialization failed: {e}")
    logger.warning("Running without payment verification — NOT SECURE FOR PRODUCTION")


# ============================================================
# Event Loop Lifecycle
# ============================================================

def _ensure_event_loop():
    """Start the event loop in a background thread if not already running."""
    global _loop_thread
    if _loop_thread is None or not _loop_thread.is_alive():
        _loop_thread = threading.Thread(target=_loop.run_forever, daemon=True)
        _loop_thread.start()
        logger.info("Event loop started in background thread")


# Start event loop immediately if we have a gateway middleware
if gateway_middleware:
    _ensure_event_loop()


def require_payment(price: str):
    """
    Enforce x402 payment for this endpoint.
    Returns PaymentInfo on success, or a 402 Flask response.

    In passthrough mode (no circlekit), returns 402 with payment requirements
    so the orchestrator's GatewayClient.pay() can complete the x402 flow.
    On retry with Payment-Signature header, returns a passthrough PaymentInfo.
    """
    payment_header = request.headers.get("Payment-Signature")

    if gateway_middleware:
        # circlekit installed — delegate to real middleware
        future = asyncio.run_coroutine_threadsafe(
            gateway_middleware.process_request(
                payment_header=payment_header,
                path=request.path,
                price=price,
            ),
            _loop,
        )
        result = future.result(timeout=10)

        if isinstance(result, PaymentInfo):
            return result

        # Return 402 challenge response from middleware
        resp = jsonify(result.get("body", result))
        resp.status_code = result.get("status", 402)
        return resp

    # --- Passthrough mode (circlekit not installed) ---

    if payment_header:
        # Payment signature present — decode and accept
        import base64
        import json as _json
        from types import SimpleNamespace
        try:
            decoded = _json.loads(base64.b64decode(payment_header))
            tx_hash = decoded.get("transaction", "0x_passthrough")
            logger.info(f"Payment accepted (passthrough): {price}")
            return SimpleNamespace(
                payer=decoded.get("authorization", {}).get("from", "0x_passthrough"),
                amount=price,
                formatted_amount=price,
                transaction=tx_hash,
            )
        except Exception as e:
            logger.warning(f"Failed to decode payment header: {e}")
            return SimpleNamespace(payer="0x_passthrough", amount=price, formatted_amount=price)

    # No payment — return 402 challenge with PAYMENT-REQUIRED header
    # The Circle x402 SDK expects a base64-encoded JSON header:
    # { accepts: [{scheme, network, asset, amount, payTo, maxTimeoutSeconds, extra}], x402Version: 2, resource: url }
    import base64
    import json as _json

    # Convert dollar price to atomic USDC units (6 decimals) for SDK BigInt parsing
    # $0.005 → 5000, $0.01 → 10000
    price_atomic = str(int(float(price.replace("$", "")) * 1_000_000))
    payment_requirements = {
        "x402Version": 2,
        "resource": request.url,
        "accepts": [
            {
                "scheme": "exact",
                "network": "eip155:5042002",
                "asset": "0x3600000000000000000000000000000000000000",
                "amount": price_atomic,
                "payTo": SELLER_ADDRESS or "0x42Db290677b273a8a6B2bC19082e36D94B1A47E9",
                "maxTimeoutSeconds": 60,
                "extra": {
                    "name": "GatewayWalletBatched",
                    "version": "1",
                    "verifyingContract": "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
                },
            }
        ],
    }

    encoded = base64.b64encode(_json.dumps(payment_requirements).encode()).decode()
    resp = jsonify({"error": "payment-required", "message": f"Send {price} USDC to access this endpoint"})
    resp.status_code = 402
    resp.headers["PAYMENT-REQUIRED"] = encoded
    return resp


# ============================================================
# Agent Logic
# ============================================================

def perform_research(topic: str, context: str | None = None) -> dict:
    """
    Core research agent logic.
    Returns structured mock output matching the ResearchResult TypeScript interface.
    """
    context_prefix = f"Building on prior findings: {context}. " if context else ""
    mock_summary = f"{context_prefix}Comprehensive research analysis on '{topic}'"
    # Try real LLM enrichment
    llm_summary = enrich_with_llm(AGENT_NAME, f"Research: {topic}", mock_summary)
    return {
        "summary": llm_summary,
        "key_findings": [
            f"Primary pattern identified in {topic}: convergent architecture with microservices",
            f"Secondary analysis of {topic}: 3 major approaches documented in literature",
            f"Best practice for {topic}: event-driven design with idempotent handlers",
            f"Risk assessment for {topic}: moderate complexity, high maintainability potential",
        ],
        "sources": [
            {"title": f"Primary Analysis: {topic}", "relevance": 0.95},
            {"title": "Supporting Evidence: Architecture Patterns", "relevance": 0.87},
            {"title": "Background Context: Industry Standards", "relevance": 0.82},
            {"title": f"Comparative Study: {topic} Approaches", "relevance": 0.79},
        ],
        "confidence": 0.91,
    }


# ============================================================
# Endpoints
# ============================================================

@app.route("/")
def index():
    """
    Free endpoint — ERC-8004 style agent discovery metadata.
    Returns agent name, version, capabilities, and pricing.
    """
    return jsonify({
        "name": AGENT_NAME,
        "type": AGENT_TYPE,
        "version": AGENT_VERSION,
        "description": AGENT_DESCRIPTION,
        "pricing": {"/api/research": AGENT_PRICE},
        "capabilities": ["web_search", "summarization", "citation", "analysis"],
        "chain": "arcTestnet",
        "port": AGENT_PORT,
    })


@app.route("/api/research")
def research():
    """
    Paywalled endpoint — performs deep research on the given topic.
    Requires x402 payment of AGENT_PRICE USDC.
    """
    payment = require_payment(AGENT_PRICE)

    # If not PaymentInfo, it's a 402 response
    if hasattr(payment, "status_code"):
        return payment

    topic = request.args.get("input", request.args.get("topic", "general"))
    context = request.args.get("context")
    logger.info(f"Research request: {topic}" + (f" [context: {context[:50]}...]" if context else ""))

    result = perform_research(topic, context)

    response = {
        "success": True,
        "agent": AGENT_NAME,
        "paid_by": getattr(payment, "payer", "unknown"),
        "amount": AGENT_PRICE,
        "result": result,
    }
    if context:
        response["context"] = {"prior_summary": context}
    return jsonify(response)


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "agent": AGENT_TYPE,
        "gateway_ready": gateway_middleware is not None,
    })


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    import atexit

    def _shutdown_loop():
        """Gracefully shut down the event loop on exit."""
        if _loop.is_running():
            _loop.call_soon_threadsafe(_loop.stop)
        logger.info("Event loop shut down")

    atexit.register(_shutdown_loop)

    from llm_client import USE_REAL_LLM, LLM_MODEL, LLM_BASE_URL
    llm_mode = f"REAL ({LLM_MODEL} via {LLM_BASE_URL})" if USE_REAL_LLM else "MOCK (no LLM)"
    logger.info(f"🚀 {AGENT_NAME} starting on port {AGENT_PORT}")
    logger.info(f"   Pricing: {AGENT_PRICE} per research call")
    logger.info(f"   🤖 LLM mode: {llm_mode}")
    logger.info(f"   Gateway: {'connected' if gateway_middleware else 'passthrough mode'}")
    app.run(host="0.0.0.0", port=AGENT_PORT, debug=False)
