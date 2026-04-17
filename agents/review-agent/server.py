"""
AgentWork — Review Agent
Code review, quality scoring, and feedback specialist.

x402 paywalled endpoint: /api/review
"""

import os
import asyncio
import threading
import logging
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

AGENT_TYPE = "review"
AGENT_NAME = "Review Agent"
AGENT_VERSION = "1.0.0"
AGENT_PORT = int(os.getenv("REVIEW_AGENT_PORT", "4024"))
AGENT_DESCRIPTION = "Code review, quality scoring, and actionable feedback"
SELLER_ADDRESS = os.getenv("REVIEW_AGENT_WALLET", "")


def normalize_price(env_var: str, default: str = "$0.005") -> str:
    """Ensure price has dollar prefix (SDK requires '$0.005' not '0.005')."""
    price = os.getenv(env_var, default)
    if not price.startswith("$"):
        price = f"${price}"
    return price

AGENT_PRICE = normalize_price("REVIEW_AGENT_PRICE", "$0.005")

logging.basicConfig(
    level=logging.INFO,
    format=f"%(asctime)s [{AGENT_TYPE}] %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

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


gateway_middleware = None
_loop = asyncio.new_event_loop()
_loop_thread = None

try:
    from circlekit import create_gateway_middleware
    from circlekit.x402 import PaymentInfo

    if SELLER_ADDRESS:
        gateway_middleware = create_gateway_middleware(
            seller_address=SELLER_ADDRESS, chain="arcTestnet"
        )
        logger.info(f"circlekit gateway middleware initialized for {SELLER_ADDRESS}")
    else:
        logger.warning(
            "REVIEW_AGENT_WALLET not set — running in passthrough mode (no payments)"
        )
except ImportError as e:
    logger.warning(f"circlekit not installed — running in passthrough mode ({e})")
    logger.warning("Install with: pip install circlekit")
except Exception as e:
    logger.error(f"circlekit initialization failed: {e}")
    logger.warning("Running without payment verification — NOT SECURE FOR PRODUCTION")


def _ensure_event_loop():
    """Start the event loop in a background thread if not already running."""
    global _loop_thread
    if _loop_thread is None or not _loop_thread.is_alive():
        _loop_thread = threading.Thread(target=_loop.run_forever, daemon=True)
        _loop_thread.start()
        logger.info("Event loop started in background thread")


if gateway_middleware:
    _ensure_event_loop()


def require_payment(price: str):
    """
    Enforce x402 payment for this endpoint.
    In passthrough mode (no circlekit), returns 402 with payment requirements
    so the orchestrator's GatewayClient.pay() can complete the x402 flow.
    On retry with Payment-Signature header, returns a passthrough PaymentInfo.
    """
    payment_header = request.headers.get("Payment-Signature")

    if gateway_middleware:
        future = asyncio.run_coroutine_threadsafe(
            gateway_middleware.process_request(
                payment_header=payment_header, path=request.path, price=price
            ),
            _loop,
        )
        result = future.result(timeout=10)
        if isinstance(result, PaymentInfo):
            return result
        resp = jsonify(result.get("body", result))
        resp.status_code = result.get("status", 402)
        return resp

    # --- Passthrough mode (circlekit not installed) ---

    if payment_header:
        from types import SimpleNamespace
        logger.info(f"Payment accepted (passthrough): {price}")
        return SimpleNamespace(payer="0x_passthrough", amount=price, formatted_amount=price)

    # Return 402 challenge with x402 payment requirements
    resp = jsonify({
        "error": "payment-required",
        "message": f"Send {price} USDC to access this endpoint",
        "payment": {
            "scheme": "exact",
            "network": "eip155:5042002",
            "asset": "0x3600000000000000000000000000000000000000",
            "amount": price,
            "payTo": SELLER_ADDRESS,
            "maxTimeoutSeconds": 60,
            "extra": {
                "name": "GatewayWalletBatched",
                "version": "1",
                "verifyingContract": "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
            },
        },
    })
    resp.status_code = 402
    resp.headers["X-Payment-Required"] = "true"
    resp.headers["X-Payment-Version"] = "1"
    return resp


def perform_review(task: str, context: str | None = None) -> dict:
    """Core review logic. Returns structured mock output matching ReviewResult TypeScript interface."""
    context_prefix = f"Reviewing with context: {context}. " if context else ""
    return {
        "quality_score": 87,
        "issues": [
            {"severity": "minor", "description": "Missing type annotation on line 42"},
            {"severity": "suggestion", "description": "Consider using async for I/O operations"},
            {"severity": "minor", "description": "Magic number in config — extract to constant"},
        ],
        "approved": True,
        "suggestions": [
            "Add input validation on public API endpoints",
            "Consider using dependency injection for testability",
            "Add structured logging with correlation IDs",
        ],
        "summary": f"{context_prefix}Quality review completed for: {task}",
    }


@app.route("/")
def index():
    return jsonify({
        "name": AGENT_NAME, "type": AGENT_TYPE, "version": AGENT_VERSION,
        "description": AGENT_DESCRIPTION,
        "pricing": {"/api/review": AGENT_PRICE},
        "capabilities": ["code_review", "quality_scoring", "feedback", "best_practices"],
        "chain": "arcTestnet", "port": AGENT_PORT,
    })


@app.route("/api/review")
def review():
    payment = require_payment(AGENT_PRICE)
    if hasattr(payment, "status_code"):
        return payment

    task = request.args.get("input", request.args.get("task", "default"))
    context = request.args.get("context")
    logger.info(f"Review request: {task}" + (f" [context: {context[:50]}...]" if context else ""))

    result = perform_review(task, context)

    response = {
        "success": True, "agent": AGENT_NAME,
        "paid_by": getattr(payment, "payer", "unknown"),
        "amount": AGENT_PRICE, "result": result,
    }
    if context:
        response["context"] = {"prior_summary": context}
    return jsonify(response)


@app.route("/health")
def health():
    return jsonify({"status": "healthy", "agent": AGENT_TYPE, "gateway_ready": gateway_middleware is not None})


if __name__ == "__main__":
    import atexit

    def _shutdown_loop():
        if _loop.is_running():
            _loop.call_soon_threadsafe(_loop.stop)
        logger.info("Event loop shut down")

    atexit.register(_shutdown_loop)

    logger.info(f"🚀 {AGENT_NAME} starting on port {AGENT_PORT}")
    logger.info(f"   Pricing: {AGENT_PRICE} per review call")
    logger.info(f"   Gateway: {'connected' if gateway_middleware else 'passthrough mode'}")
    app.run(host="0.0.0.0", port=AGENT_PORT, debug=False)
