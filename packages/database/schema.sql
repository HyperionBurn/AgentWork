-- ============================================================
-- AgentWork Database Schema
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================

-- Payment Events Table
-- Records all x402 payments processed by dashboard
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer TEXT NOT NULL,
  payee TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL DEFAULT 'USDC',
  gateway_tx TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Events Table
-- Records orchestrator task execution events
CREATE TABLE IF NOT EXISTS task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL,
  gateway_tx TEXT,
  amount TEXT,
  result TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents Table
-- Tracks agent health and statistics
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL UNIQUE,
  port INTEGER NOT NULL,
  status TEXT NOT NULL,
  earnings DECIMAL(18, 6) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gateway State Table
-- Stores current Circle Gateway wallet balance
CREATE TABLE IF NOT EXISTS gateway_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  balance TEXT NOT NULL DEFAULT '$0.0000',
  deposited TEXT NOT NULL DEFAULT '$0.0000',
  spent TEXT NOT NULL DEFAULT '$0.0000',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS payment_events_created_at_idx ON payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS task_events_task_id_idx ON task_events(task_id);
CREATE INDEX IF NOT EXISTS task_events_agent_type_idx ON task_events(agent_type);
CREATE INDEX IF NOT EXISTS task_events_created_at_idx ON task_events(created_at DESC);
CREATE INDEX IF NOT EXISTS agents_last_heartbeat_idx ON agents(last_heartbeat DESC);

-- ============================================================
-- Disable RLS (hackathon — anon key needs full access)
-- Without this, all inserts from orchestrator/dashboard fail
-- ============================================================
ALTER TABLE task_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_state DISABLE ROW LEVEL SECURITY;

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Supabase Realtime (for dashboard live updates)
-- Only payment_events and task_events — agents table is not
-- read via Realtime (dashboard uses hardcoded array + health API)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS payment_events;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS task_events;
