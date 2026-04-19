# ==============================================================================
# IdentityRegistry.vy — ERC-721 agent identity NFTs
# Source: vyperlang/erc-8004-vyper/src/IdentityRegistry.vy
# ==============================================================================

event AgentRegistered:
    token_id: uint256
    owner: address
    name: String[64]
    capabilities: String[256]

event AgentUpdated:
    token_id: uint256
    metadata_uri: String[256]
    capabilities: String[256]

event Transfer:
    sender: address
    to: address
    token_id: uint256

struct AgentIdentity:
    owner: address
    name: String[64]
    metadata_uri: String[256]
    capabilities: String[256]
    registered_at: uint256
    active: bool

agent_count: public(uint256)
agents: public(HashMap[uint256, AgentIdentity])
owner_to_token: public(HashMap[address, uint256])
token_approvals: public(HashMap[uint256, address])

@external
def registerAgent(
    _name: String[64],
    _metadata_uri: String[256],
    _capabilities: String[256]
) -> uint256:
    """
    @notice Register a new agent identity as an ERC-721 NFT.
    @param _name Agent display name
    @param _metadata_uri URI for agent metadata (IPFS, HTTP, etc.)
    @param _capabilities Comma-separated list of capabilities
    @return token_id The NFT token ID for this agent
    """
    assert self.owner_to_token[msg.sender] == 0, "Agent already registered"

    token_id: uint256 = self.agent_count
    self.agent_count += 1

    self.agents[token_id] = AgentIdentity({
        owner: msg.sender,
        name: _name,
        metadata_uri: _metadata_uri,
        capabilities: _capabilities,
        registered_at: block.timestamp,
        active: True,
    })
    self.owner_to_token[msg.sender] = token_id

    log AgentRegistered(token_id, msg.sender, _name, _capabilities)
    log Transfer(empty(address), msg.sender, token_id)
    return token_id


@external
def updateAgentMetadata(_metadata_uri: String[256], _capabilities: String[256]):
    """
    @notice Update agent metadata. Only agent owner can call.
    """
    token_id: uint256 = self.owner_to_token[msg.sender]
    assert token_id != 0, "Not registered"

    self.agents[token_id].metadata_uri = _metadata_uri
    self.agents[token_id].capabilities = _capabilities
    log AgentUpdated(token_id, _metadata_uri, _capabilities)


@external
@view
def getAgent(_token_id: uint256) -> (address, String[64], String[256], String[256], bool):
    """
    @notice Get agent identity details.
    """
    agent: AgentIdentity = self.agents[_token_id]
    return (agent.owner, agent.name, agent.metadata_uri, agent.capabilities, agent.active)


@external
@view
def tokenURI(_token_id: uint256) -> String[256]:
    """
    @notice ERC-721 metadata URI.
    """
    return self.agents[_token_id].metadata_uri


@external
@view
def ownerOf(_token_id: uint256) -> address:
    return self.agents[_token_id].owner
