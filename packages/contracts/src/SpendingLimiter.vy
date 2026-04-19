# ==============================================================================
# SpendingLimiter.vy — Rate-limit agent spending per time window
# Source: vyperlang/vyper-agentic-payments/contracts/SpendingLimiter.vy
# ==============================================================================

event LimitSet:
    agent: address
    max_per_window: uint256
    window_duration: uint256

event SpendingRecorded:
    agent: address
    amount: uint256
    new_total: uint256

event LimitExceeded:
    agent: address
    attempted: uint256
    limit: uint256

struct SpendingLimit:
    max_per_window: uint256  # Max USDC per window (6 decimals)
    window_duration: uint256  # Window duration in seconds
    current_spending: uint256
    window_start: uint256

limits: public(HashMap[address, SpendingLimit])

@external
def setLimit(_agent: address, _max_per_window: uint256, _window_duration: uint256):
    """
    @notice Set spending limit for an agent.
    @param _agent Agent address to limit
    @param _max_per_window Max USDC allowed per window
    @param _window_duration Window duration in seconds
    """
    self.limits[_agent] = SpendingLimit({
        max_per_window: _max_per_window,
        window_duration: _window_duration,
        current_spending: 0,
        window_start: block.timestamp,
    })
    log LimitSet(_agent, _max_per_window, _window_duration)


@external
def recordSpending(_agent: address, _amount: uint256) -> bool:
    """
    @notice Record a spending event. Returns True if within limit, False if exceeded.
    @param _agent Agent address
    @param _amount USDC amount spent (6 decimals)
    """
    limit: SpendingLimit = self.limits[_agent]

    # Reset window if expired
    if block.timestamp > limit.window_start + limit.window_duration:
        limit.current_spending = 0
        limit.window_start = block.timestamp

    new_spending: uint256 = limit.current_spending + _amount

    if new_spending > limit.max_per_window:
        log LimitExceeded(_agent, new_spending, limit.max_per_window)
        return False

    limit.current_spending = new_spending
    log SpendingRecorded(_agent, _amount, new_spending)
    return True


@external
@view
def checkLimit(_agent: address) -> (bool, uint256, uint256):
    """
    @notice Check if agent is within spending limit.
    @return within_limit Whether agent is within limit
    @return current_spending Current spending in window
    @return max_allowed Maximum allowed per window
    """
    limit: SpendingLimit = self.limits[_agent]
    return (limit.current_spending <= limit.max_per_window, limit.current_spending, limit.max_per_window)
