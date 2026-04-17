-- ============================================================
-- AgentWork — Seed Data
-- Run after schema.sql to populate agent records
-- ============================================================
-- Note: Dashboard currently uses a hardcoded AGENTS array
-- in page.tsx + /api/agent-health for agent cards.
-- This seed data is for future-proofing and API consumers.
-- ============================================================

INSERT INTO agents (name, type, port, status, earnings, tasks_completed) VALUES
  ('Research Agent', 'research', 4021, 'offline', 0.000000, 0),
  ('Code Agent',     'code',     4022, 'offline', 0.000000, 0),
  ('Test Agent',     'test',     4023, 'offline', 0.000000, 0),
  ('Review Agent',   'review',   4024, 'offline', 0.000000, 0)
ON CONFLICT (type) DO NOTHING;
