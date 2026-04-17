"""
AgentWork — Contract Tests
Tests for all Vyper contracts using Moccasin + titanoboa.

Usage:
    cd packages/contracts && moccasin test

Deploy order enforced: IdentityRegistry → ReputationRegistry(identity.address) → rest
"""

import pytest
from moccasin.boa_tools import VyperContract


# ---------------------------------------------------------------------------
# Fixtures — Deploy order: IdentityRegistry → ReputationRegistry → AgentEscrow
# ---------------------------------------------------------------------------


@pytest.fixture
def identity_registry(boa) -> VyperContract:
    """Deploy IdentityRegistry (no constructor args)."""
    return boa.load("src/IdentityRegistry.vy")


@pytest.fixture
def reputation_registry(boa, identity_registry) -> VyperContract:
    """Deploy ReputationRegistry with IdentityRegistry address."""
    return boa.load("src/ReputationRegistry.vy", identity_registry.address)


@pytest.fixture
def escrow(boa) -> VyperContract:
    """Deploy AgentEscrow (no constructor args)."""
    return boa.load("src/AgentEscrow.vy")


# ---------------------------------------------------------------------------
# Test 1: IdentityRegistry — Agent Registration (ERC-721)
# ---------------------------------------------------------------------------


class TestIdentityRegistry:
    """Tests for IdentityRegistry.vy — ERC-721 agent identity NFTs."""

    def test_register_agent_returns_token_id(self, identity_registry, boa):
        """Registering an agent returns token_id 0 (first NFT)."""
        agent_owner = boa.env.generate_address()
        with boa.env.prank(agent_owner):
            token_id = identity_registry.registerAgent(
                "ResearchBot",
                "https://metadata.agentwork.io/research",
                "research,analysis",
            )
        assert token_id == 0

    def test_register_increments_count(self, identity_registry, boa):
        """agent_count increments after each registration."""
        addr1 = boa.env.generate_address()
        addr2 = boa.env.generate_address()

        with boa.env.prank(addr1):
            identity_registry.registerAgent("Agent1", "uri1", "cap1")
        assert identity_registry.agent_count() == 1

        with boa.env.prank(addr2):
            identity_registry.registerAgent("Agent2", "uri2", "cap2")
        assert identity_registry.agent_count() == 2

    def test_double_registration_reverts(self, identity_registry, boa):
        """Registering twice from the same address should revert."""
        addr = boa.env.generate_address()
        with boa.env.prank(addr):
            identity_registry.registerAgent("Agent1", "uri1", "cap1")

        with boa.env.prank(addr):
            with pytest.raises(Exception):
                identity_registry.registerAgent("Agent2", "uri2", "cap2")

    def test_get_agent_returns_correct_data(self, identity_registry, boa):
        """getAgent returns the correct owner, name, uri, capabilities, active."""
        addr = boa.env.generate_address()
        with boa.env.prank(addr):
            identity_registry.registerAgent(
                "TestAgent", "https://example.com/meta", "testing"
            )

        owner, name, uri, caps, active = identity_registry.getAgent(0)
        assert owner == addr
        assert name == "TestAgent"
        assert uri == "https://example.com/meta"
        assert caps == "testing"
        assert active is True

    def test_owner_of(self, identity_registry, boa):
        """ownerOf returns the registering address."""
        addr = boa.env.generate_address()
        with boa.env.prank(addr):
            identity_registry.registerAgent("Owner", "uri", "cap")
        assert identity_registry.ownerOf(0) == addr

    def test_update_metadata(self, identity_registry, boa):
        """updateAgentMetadata changes metadata_uri and capabilities."""
        addr = boa.env.generate_address()
        with boa.env.prank(addr):
            identity_registry.registerAgent("Agent", "old-uri", "old-cap")
            identity_registry.updateAgentMetadata("new-uri", "new-cap")

        _, _, uri, caps, _ = identity_registry.getAgent(0)
        assert uri == "new-uri"
        assert caps == "new-cap"


# ---------------------------------------------------------------------------
# Test 2: ReputationRegistry — Feedback & Scoring
# ---------------------------------------------------------------------------


class TestReputationRegistry:
    """Tests for ReputationRegistry.vy — On-chain reputation scoring."""

    def test_give_feedback_returns_id(self, reputation_registry, boa):
        """giveFeedback returns feedback_id 0 for the first entry."""
        agent_addr = boa.env.generate_address()
        reviewer = boa.env.generate_address()

        with boa.env.prank(reviewer):
            fb_id = reputation_registry.giveFeedback(
                agent_addr, 85, "Good work"
            )
        assert fb_id == 0

    def test_give_feedback_summary(self, reputation_registry, boa):
        """getSummary returns correct total, active counts after feedback."""
        agent_addr = boa.env.generate_address()
        reviewer = boa.env.generate_address()

        with boa.env.prank(reviewer):
            reputation_registry.giveFeedback(agent_addr, 90, "Excellent")

        score, total, active = reputation_registry.getSummary(agent_addr)
        assert total == 1
        assert active == 1
        # Score should be 90 * 1e18 (WAD)
        assert score == 90 * 10**18

    def test_multiple_feedback_averages(self, reputation_registry, boa):
        """Multiple feedbacks produce correct average score."""
        agent_addr = boa.env.generate_address()
        r1 = boa.env.generate_address()
        r2 = boa.env.generate_address()

        with boa.env.prank(r1):
            reputation_registry.giveFeedback(agent_addr, 80, "Good")
        with boa.env.prank(r2):
            reputation_registry.giveFeedback(agent_addr, 100, "Perfect")

        score, total, active = reputation_registry.getSummary(agent_addr)
        assert total == 2
        assert active == 2
        # Average: (80 + 100) / 2 = 90 * 1e18
        assert score == 90 * 10**18

    def test_revoke_feedback(self, reputation_registry, boa):
        """Revoking feedback reduces active count and recalculates score."""
        agent_addr = boa.env.generate_address()
        reviewer = boa.env.generate_address()

        with boa.env.prank(reviewer):
            reputation_registry.giveFeedback(agent_addr, 50, "Meh")
            reputation_registry.giveFeedback(agent_addr, 100, "Great")

        score_before, _, active_before = reputation_registry.getSummary(agent_addr)
        assert active_before == 2
        assert score_before == 75 * 10**18  # (50+100)/2

        with boa.env.prank(reviewer):
            reputation_registry.revokeFeedback(agent_addr, 0)

        score_after, total_after, active_after = reputation_registry.getSummary(agent_addr)
        assert total_after == 2  # Still 2 entries total
        assert active_after == 1  # Only 1 active now
        assert score_after == 100 * 10**18  # Only the 100 score remains

    def test_self_feedback_reverts(self, reputation_registry, boa):
        """Giving feedback to yourself should revert."""
        addr = boa.env.generate_address()
        with boa.env.prank(addr):
            with pytest.raises(Exception):
                reputation_registry.giveFeedback(addr, 50, "Self-review")

    def test_score_over_100_reverts(self, reputation_registry, boa):
        """Score > 100 should revert."""
        agent_addr = boa.env.generate_address()
        reviewer = boa.env.generate_address()
        with boa.env.prank(reviewer):
            with pytest.raises(Exception):
                reputation_registry.giveFeedback(agent_addr, 101, "Too high")

    def test_get_feedback_details(self, reputation_registry, boa):
        """getFeedback returns correct details for a specific feedback."""
        agent_addr = boa.env.generate_address()
        reviewer = boa.env.generate_address()

        with boa.env.prank(reviewer):
            reputation_registry.giveFeedback(agent_addr, 75, "Decent")

        from_addr, score, comment, timestamp, active = reputation_registry.getFeedback(
            agent_addr, 0
        )
        assert from_addr == reviewer
        assert score == 75
        assert comment == "Decent"
        assert active is True


# ---------------------------------------------------------------------------
# Test 3: AgentEscrow — Task Lifecycle
# ---------------------------------------------------------------------------


class TestAgentEscrow:
    """Tests for AgentEscrow.vy — On-chain task escrow."""

    def test_create_task_returns_id(self, escrow, boa):
        """createTask returns task_id 0 for the first task."""
        buyer = boa.env.generate_address()
        agent = boa.env.generate_address()

        with boa.env.prank(buyer):
            task_id = escrow.createTask(
                agent, 5_000_000, "Research AI agents"
            )
        assert task_id == 0

    def test_create_task_increments_count(self, escrow, boa):
        """task_count increments with each new task."""
        buyer = boa.env.generate_address()
        agent = boa.env.generate_address()

        with boa.env.prank(buyer):
            escrow.createTask(agent, 1_000_000, "Task 1")
        assert escrow.task_count() == 1

        with boa.env.prank(buyer):
            escrow.createTask(agent, 2_000_000, "Task 2")
        assert escrow.task_count() == 2

    def test_full_lifecycle(self, escrow, boa):
        """Complete task lifecycle: create → claim → submit → approve."""
        buyer = boa.env.generate_address()
        agent = boa.env.generate_address()

        # Create
        with boa.env.prank(buyer):
            task_id = escrow.createTask(agent, 5_000_000, "Write code")

        _, _, reward, status, desc, _ = escrow.getTask(task_id)
        assert status == 0  # Created
        assert reward == 5_000_000
        assert desc == "Write code"

        # Claim
        with boa.env.prank(agent):
            escrow.claimTask(task_id)
        _, _, _, status, _, _ = escrow.getTask(task_id)
        assert status == 1  # Claimed

        # Submit result
        with boa.env.prank(agent):
            escrow.submitResult(task_id, "function hello() { return 42; }")
        _, _, _, status, _, result = escrow.getTask(task_id)
        assert status == 2  # ResultSubmitted
        assert result == "function hello() { return 42; }"

        # Approve
        with boa.env.prank(buyer):
            escrow.approveCompletion(task_id)
        _, _, _, status, _, _ = escrow.getTask(task_id)
        assert status == 3  # Completed

    def test_wrong_agent_claim_reverts(self, escrow, boa):
        """Only the assigned agent can claim the task."""
        buyer = boa.env.generate_address()
        agent = boa.env.generate_address()
        impostor = boa.env.generate_address()

        with boa.env.prank(buyer):
            task_id = escrow.createTask(agent, 1_000_000, "Test")

        with boa.env.prank(impostor):
            with pytest.raises(Exception):
                escrow.claimTask(task_id)

    def test_dispute_task(self, escrow, boa):
        """Buyer can dispute a task after result submission."""
        buyer = boa.env.generate_address()
        agent = boa.env.generate_address()

        with boa.env.prank(buyer):
            task_id = escrow.createTask(agent, 1_000_000, "Bad task")

        with boa.env.prank(agent):
            escrow.claimTask(task_id)
            escrow.submitResult(task_id, "bad result")

        with boa.env.prank(buyer):
            escrow.dispute(task_id, "Incorrect result")

        _, _, _, status, _, _ = escrow.getTask(task_id)
        assert status == 4  # Disputed

    def test_zero_reward_reverts(self, escrow, boa):
        """Creating a task with 0 reward should revert."""
        buyer = boa.env.generate_address()
        agent = boa.env.generate_address()
        with boa.env.prank(buyer):
            with pytest.raises(Exception):
                escrow.createTask(agent, 0, "Free task")
