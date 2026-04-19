"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// HF-11: Agent Chat Interface
// Real Groq LLM-powered agent interaction panel.
// Calls /api/agent-chat for each agent in the pipeline.
// Falls back to short demo responses on error.
// ============================================================

interface ChatMessage {
  id: string;
  sender: "user" | "research" | "code" | "test" | "review" | "system";
  content: string;
  timestamp: string;
  fallback?: boolean;
}

const AGENT_AVATARS: Record<string, { emoji: string; color: string }> = {
  user:    { emoji: "👤", color: "text-white" },
  research:{ emoji: "🔬", color: "text-violet-300" },
  code:    { emoji: "💻", color: "text-blue-300" },
  test:    { emoji: "🧪", color: "text-emerald-300" },
  review:  { emoji: "📋", color: "text-amber-300" },
  system:  { emoji: "⚡", color: "text-gray-400" },
};

const AGENT_SEQUENCE: Array<{ type: "research" | "code" | "test" | "review" }> = [
  { type: "research" },
  { type: "code" },
  { type: "test" },
  { type: "review" },
];

async function callAgentChat(
  message: string,
  agentType: string,
  signal: AbortSignal,
): Promise<{ response: string; fallback: boolean }> {
  const res = await fetch("/api/agent-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, agentType }),
    signal,
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "system",
      content: "Welcome to AgentWork Chat! Type a task and watch the agents collaborate.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Abort pending requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    // Set up abort controller for this pipeline run
    const controller = new AbortController();
    abortRef.current = controller;

    let pipelineContext = userMessage.content;
    let agentCount = 0;
    let fallbackCount = 0;

    for (const { type } of AGENT_SEQUENCE) {
      if (controller.signal.aborted) break;

      try {
        const result = await callAgentChat(
          pipelineContext,
          type,
          controller.signal,
        );

        if (result.fallback) fallbackCount++;

        const agentMsg: ChatMessage = {
          id: `msg_${Date.now()}_${type}`,
          sender: type,
          content: result.response,
          timestamp: new Date().toISOString(),
          fallback: result.fallback,
        };
        setMessages((prev) => [...prev, agentMsg]);
        agentCount++;

        // Feed this agent's output as context for the next agent
        pipelineContext = result.response;
      } catch (err) {
        if (controller.signal.aborted) break;
        // Individual agent failure — show error and continue
        const errorMsg: ChatMessage = {
          id: `msg_${Date.now()}_${type}_error`,
          sender: "system",
          content: `⚠️ ${type} agent unavailable`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    }

    // Summary
    if (!controller.signal.aborted) {
      const summaryMsg: ChatMessage = {
        id: `msg_${Date.now()}_summary`,
        sender: "system",
        content: `✅ Pipeline complete! ${agentCount} agents collaborated. Total cost: $${(agentCount * 0.005).toFixed(3)} on Arc.${fallbackCount > 0 ? ` (${fallbackCount} fallback responses)` : ""}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, summaryMsg]);
    }

    setIsProcessing(false);
    abortRef.current = null;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl flex flex-col h-[400px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">💬 Agent Chat</h3>
        <span className="text-xs text-gray-500">
          {isProcessing ? "⚡ Processing…" : "Ready"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const avatar = AGENT_AVATARS[msg.sender];
          const isUser = msg.sender === "user";
          const isSystem = msg.sender === "system";

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <span className="text-lg flex-shrink-0">{avatar.emoji}</span>
              <div
                className={`
                  max-w-[80%] px-3 py-2 rounded-lg text-xs
                  ${isUser ? "bg-blue-600/30 text-blue-100" : ""}
                  ${isSystem ? "bg-gray-700/50 text-gray-300 italic" : ""}
                  ${!isUser && !isSystem ? "bg-gray-800 text-gray-200" : ""}
                `}
              >
                {!isUser && !isSystem && (
                  <span className={`font-bold ${avatar.color} text-[10px] uppercase`}>
                    {msg.sender} agent
                    {msg.fallback && (
                      <span className="text-amber-400 ml-1">(fallback)</span>
                    )}
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {isProcessing && (
          <div className="flex gap-2">
            <span className="text-lg">🤔</span>
            <div className="bg-gray-800 px-3 py-2 rounded-lg text-xs text-gray-400">
              Agent is thinking…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isProcessing ? "Agents are working…" : "Describe a task…"}
            disabled={isProcessing}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>
      </form>
    </div>
  );
}
