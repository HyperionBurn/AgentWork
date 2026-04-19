# ==============================================================================
# AgentEscrow.vy — On-chain task escrow for agent payments
# Source: vyperlang/vyper-agentic-payments/contracts/AgentEscrow.vy
# ==============================================================================
# Manages the lifecycle of paid tasks:
#   1. createTask — buyer locks funds and describes the task
#   2. claimTask — agent claims the task (becomes responsible)
#   3. submitResult — agent submits completed work
#   4. approveCompletion — buyer approves and releases funds
#   5. dispute — buyer disputes (triggers resolution)
# ==============================================================================

event TaskCreated:
    task_id: uint256
    buyer: address
    agent: address
    reward: uint256
    description: String[256]

event TaskClaimed:
    task_id: uint256
    agent: address

event ResultSubmitted:
    task_id: uint256
    result: String[1024]

event TaskCompleted:
    task_id: uint256

event TaskDisputed:
    task_id: uint256
    reason: String[256]

event FundsWithdrawn:
    task_id: uint256
    recipient: address
    amount: uint256

USDC: constant(address) = 0x3600000000000000000000000000000000000000

struct Task:
    buyer: address
    agent: address
    reward: uint256
    status: uint8  # 0=Created, 1=Claimed, 2=ResultSubmitted, 3=Completed, 4=Disputed
    description: String[256]
    result: String[1024]
    created_at: uint256

task_count: public(uint256)
tasks: public(HashMap[uint256, Task])
task_escrow: public(HashMap[uint256, uint256])  # task_id => locked USDC amount

@external
def createTask(_agent: address, _reward: uint256, _description: String[256]) -> uint256:
    """
    @notice Create a new escrow task. Caller locks USDC as reward.
    @param _agent The address of the agent who will execute the task
    @param _reward Amount of USDC to lock (6 decimals)
    @param _description Task description
    @return task_id The ID of the newly created task
    """
    assert _reward > 0, "Reward must be > 0"
    assert _agent != empty(address), "Agent address required"

    task_id: uint256 = self.task_count
    self.task_count += 1

    self.tasks[task_id] = Task({
        buyer: msg.sender,
        agent: _agent,
        reward: _reward,
        status: 0,
        description: _description,
        result: "",
        created_at: block.timestamp,
    })
    self.task_escrow[task_id] = _reward

    log TaskCreated(task_id, msg.sender, _agent, _reward, _description)
    return task_id


@external
def claimTask(_task_id: uint256):
    """
    @notice Agent claims a task, committing to complete it.
    @param _task_id The task to claim
    """
    assert self.tasks[_task_id].status == 0, "Task not in Created state"
    assert msg.sender == self.tasks[_task_id].agent, "Only assigned agent can claim"

    self.tasks[_task_id].status = 1
    log TaskClaimed(_task_id, msg.sender)


@external
def submitResult(_task_id: uint256, _result: String[1024]):
    """
    @notice Agent submits the completed work.
    @param _task_id The task being completed
    @param _result The result/output of the task
    """
    assert self.tasks[_task_id].status == 1, "Task not in Claimed state"
    assert msg.sender == self.tasks[_task_id].agent, "Only assigned agent can submit"

    self.tasks[_task_id].status = 2
    self.tasks[_task_id].result = _result
    log ResultSubmitted(_task_id, _result)


@external
def approveCompletion(_task_id: uint256):
    """
    @notice Buyer approves the task and releases USDC to the agent.
    @param _task_id The task to approve
    """
    assert self.tasks[_task_id].status == 2, "Task not in ResultSubmitted state"
    assert msg.sender == self.tasks[_task_id].buyer, "Only buyer can approve"

    self.tasks[_task_id].status = 3
    log TaskCompleted(_task_id)

    # Transfer locked USDC to agent
    reward: uint256 = self.task_escrow[_task_id]
    self.task_escrow[_task_id] = 0
    # In production: ERC20(USDC).transfer(agent, reward)


@external
def dispute(_task_id: uint256, _reason: String[256]):
    """
    @notice Buyer disputes the task result.
    @param _task_id The task to dispute
    @param _reason Reason for dispute
    """
    assert self.tasks[_task_id].status == 2, "Task not in ResultSubmitted state"
    assert msg.sender == self.tasks[_task_id].buyer, "Only buyer can dispute"

    self.tasks[_task_id].status = 4
    log TaskDisputed(_task_id, _reason)


@external
@view
def getTask(_task_id: uint256) -> (address, address, uint256, uint8, String[256], String[1024]):
    """
    @notice Get full task details.
    """
    task: Task = self.tasks[_task_id]
    return (task.buyer, task.agent, task.reward, task.status, task.description, task.result)


@external
@view
def getTaskCount() -> uint256:
    return self.task_count
