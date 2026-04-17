# ==============================================================================
# ReputationRegistry.vy — On-chain agent reputation scoring
# Source: vyperlang/erc-8004-vyper/src/ReputationRegistry.vy
# ==============================================================================

# events:
    FeedbackGiven: immutable(uint256, address, address, uint256, uint8, string)
    FeedbackRevoked: immutable(uint256, address, address)

struct Feedback:
    from_address: address
    score: uint8       # 0-100
    comment: String[256]
    timestamp: uint256
    active: bool

identity_registry: public(address)

agent_feedback: HashMap[address, DynArray[Feedback, 100]]
agent_scores: HashMap[address, uint256]  # WAD-normalized (18 decimals)

@external
def __init__(_identity_registry: address):
    self.identity_registry = _identity_registry


@external
def giveFeedback(
    _agent: address,
    _score: uint8,
    _comment: String[256]
) -> uint256:
    """
    @notice Submit feedback for an agent. Score 0-100.
    @param _agent Agent address to rate
    @param _score Quality score (0-100)
    @param _comment Feedback comment
    @return feedback_id The index of this feedback
    """
    assert _score <= 100, "Score must be 0-100"
    assert _agent != msg.sender, "Cannot give feedback to yourself"
    assert _agent != empty(address), "Invalid agent address"

    feedback: Feedback = Feedback({
        from_address: msg.sender,
        score: _score,
        comment: _comment,
        timestamp: block.timestamp,
        active: True,
    })

    if self.agent_feedback[_agent] == empty(DynArray[Feedback, 100]):
        self.agent_feedback[_agent] = [feedback]
    else:
        self.agent_feedback[_agent].append(feedback)

    # Recalculate weighted average (WAD precision)
    _recalculate_score(_agent)

    feedback_id: uint256 = len(self.agent_feedback[_agent]) - 1
    log FeedbackGiven(feedback_id, msg.sender, _agent, block.timestamp, _score, _comment)
    return feedback_id


@external
def revokeFeedback(_agent: address, _feedback_id: uint256):
    """
    @notice Revoke previously given feedback.
    """
    assert _agent != empty(address), "Invalid agent address"

    feedbacks: DynArray[Feedback, 100] = self.agent_feedback[_agent]
    assert _feedback_id < len(feedbacks), "Invalid feedback ID"
    assert feedbacks[_feedback_id].from_address == msg.sender, "Not your feedback"
    assert feedbacks[_feedback_id].active, "Already revoked"

    feedbacks[_feedback_id].active = False
    _recalculate_score(_agent)
    log FeedbackRevoked(_feedback_id, msg.sender, _agent)


@external
@view
def getSummary(_agent: address) -> (uint256, uint256, uint256):
    """
    @notice Get agent reputation summary.
    @return average_score WAD-normalized average score (18 decimals)
    @return total_feedback Total number of feedback entries
    @return active_feedback Number of active (non-revoked) feedback entries
    """
    feedbacks: DynArray[Feedback, 100] = self.agent_feedback[_agent]
    total: uint256 = len(feedbacks)
    active: uint256 = 0
    for f in feedbacks:
        if f.active:
            active += 1
    return (self.agent_scores[_agent], total, active)


@external
@view
def getFeedback(_agent: address, _feedback_id: uint256) -> (address, uint8, String[256], uint256, bool):
    """
    @notice Get specific feedback details.
    """
    feedbacks: DynArray[Feedback, 100] = self.agent_feedback[_agent]
    assert _feedback_id < len(feedbacks), "Invalid feedback ID"
    f: Feedback = feedbacks[_feedback_id]
    return (f.from_address, f.score, f.comment, f.timestamp, f.active)


@internal
def _recalculate_score(_agent: address):
    """
    @dev Recalculate WAD-normalized average score from active feedback.
    WAD = 1e18, so score 85 = 85 * 1e18
    """
    feedbacks: DynArray[Feedback, 100] = self.agent_feedback[_agent]
    total: uint256 = 0
    count: uint256 = 0
    for f in feedbacks:
        if f.active:
            total += convert(f.score, uint256) * 1000000000000000000  # WAD
            count += 1

    if count > 0:
        self.agent_scores[_agent] = total / count
    else:
        self.agent_scores[_agent] = 0
