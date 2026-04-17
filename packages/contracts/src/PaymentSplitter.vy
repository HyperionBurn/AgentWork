# ==============================================================================
# PaymentSplitter.vy — Split payments across multiple recipients
# Source: vyperlang/vyper-agentic-payments/contracts/PaymentSplitter.vy
# ==============================================================================
# Allows splitting a single payment across multiple agent addresses
# with configurable percentage allocations.
# ==============================================================================

# events:
    PaymentSplit: immutable(address, address, uint256)
    SplitCreated: immutable(address, address[], uint256[])

USDC: constant(address) = 0x3600000000000000000000000000000000000000

struct Split:
    creator: address
    recipients: address[]
    shares: uint256[]  # Basis points (10000 = 100%)
    total_shares: uint256

splits: public(HashMap[uint256, Split])
split_count: public(uint256)

@external
def createSplit(_recipients: DynArray[address, 10], _shares: DynArray[uint256, 10]) -> uint256:
    """
    @notice Create a new payment split configuration.
    @param _recipients Array of recipient addresses
    @param _shares Array of share allocations in basis points (must sum to 10000)
    @return split_id The ID of the newly created split
    """
    assert len(_recipients) == len(_shares), "Mismatched arrays"
    assert len(_recipients) > 0, "Need at least 1 recipient"

    total: uint256 = 0
    for share in _shares:
        total += share
    assert total == 10000, "Shares must sum to 10000 basis points"

    split_id: uint256 = self.split_count
    self.split_count += 1

    self.splits[split_id] = Split({
        creator: msg.sender,
        recipients: _recipients,
        shares: _shares,
        total_shares: total,
    })

    log SplitCreated(msg.sender, _recipients, _shares)
    return split_id


@external
def distribute(_split_id: uint256, _total_amount: uint256):
    """
    @notice Distribute USDC according to a split configuration.
    @param _split_id The split to execute
    @param _total_amount Total USDC to distribute (6 decimals)
    """
    split: Split = self.splits[_split_id]
    assert split.creator == msg.sender, "Only creator can distribute"

    for i in range(len(split.recipients)):
        amount: uint256 = (_total_amount * split.shares[i]) / 10000
        if amount > 0:
            log PaymentSplit(msg.sender, split.recipients[i], amount)
            # In production: ERC20(USDC).transfer(recipient, amount)


@external
@view
def getSplit(_split_id: uint256) -> (address, DynArray[address, 10], DynArray[uint256, 10], uint256):
    split: Split = self.splits[_split_id]
    return (split.creator, split.recipients, split.shares, split.total_shares)
