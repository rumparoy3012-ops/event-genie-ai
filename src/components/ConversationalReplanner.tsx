/**
 * ConversationalReplanner – AI-powered dynamic budget & theme adjustment
 * Features: chat interface, natural language parsing, aria-live updates, offline fallback
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, RefreshCw, Info } from 'lucide-react';
import type { ChatMessage, EventPlan } from '../types/event';
import { processReplanInstruction } from '../services/geminiService';

interface ConversationalReplannerProps {
  plan: EventPlan;
  apiKey?: string;
  onPlanUpdate: (updatedPlan: EventPlan) => void;
}

const EXAMPLE_PROMPTS = [
  'Cut catering by $500 and move it to decor',
  'Transfer $1000 from contingency to venue',
  'Make the theme eco-friendly and sustainable',
  'Move $2000 from swag to food & logistics',
  'Give the event a rustic garden aesthetic',
];

export const ConversationalReplanner: React.FC<ConversationalReplannerProps> = ({
  plan,
  apiKey,
  onPlanUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: `Hi! I'm your EventGenie AI assistant 🧞. I can help you adjust your plan dynamically. Try telling me to move budget between categories, or change the event theme. ${!apiKey ? '(Running in offline mode — complex parsing uses smart local rules.)' : '(Connected to Gemini AI for richer understanding.)'}`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastChange, setLastChange] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: ChatMessage['role'], content: string) => {
    setMessages(prev => [
      ...prev,
      { role, content, timestamp: new Date().toISOString() },
    ]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    setInput('');
    addMessage('user', trimmed);
    setIsProcessing(true);

    try {
      const result = await processReplanInstruction(trimmed, plan, apiKey);
      addMessage('assistant', result.explanation);

      if (result.changes.length > 0) {
        onPlanUpdate(result.updatedPlan);
        const changeMsg = result.changes.join('; ');
        setLastChange(changeMsg);
        // Announce to screen readers
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = `Plan updated: ${changeMsg}`;
        }
      }
    } catch {
      addMessage(
        'assistant',
        "I encountered an issue processing that request. Please try rephrasing, e.g. \"Cut catering by $500 and move it to decor\".",
      );
    } finally {
      setIsProcessing(false);
      // Return focus to input
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const resetConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared. How would you like to adjust your plan?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setLastChange('');
  };

  return (
    <section aria-labelledby="replanner-heading" className="panel replanner-panel">
      {/* Aria live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      <header className="panel-header">
        <div className="panel-header-left">
          <MessageSquare size={20} className="panel-icon" aria-hidden="true" />
          <h3 id="replanner-heading" className="panel-title">AI Plan Assistant</h3>
        </div>
        <div className="replanner-header-right">
          {!apiKey && (
            <span className="offline-badge" title="Using local rule-based parsing">
              Offline Mode
            </span>
          )}
          <button
            type="button"
            onClick={resetConversation}
            className="reset-btn"
            aria-label="Clear conversation history"
            title="Clear conversation"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Example Prompts */}
      <div className="example-prompts" role="group" aria-label="Example instructions to try">
        <p className="example-prompts-label">
          <Info size={12} aria-hidden="true" />
          Try an example:
        </p>
        <div className="example-chips">
          {EXAMPLE_PROMPTS.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => applyPrompt(prompt)}
              className="example-chip"
              aria-label={`Use example: ${prompt}`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="chat-messages"
        role="log"
        aria-label="Conversation history"
        aria-live="polite"
      >
        {messages.map((msg, i) => (
          <article
            key={i}
            className={`chat-message ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}
            aria-label={`${msg.role === 'user' ? 'You' : 'EventGenie AI'}: ${msg.content}`}
          >
            <div className="chat-avatar" aria-hidden="true">
              {msg.role === 'user' ? '👤' : '🧞'}
            </div>
            <div className="chat-bubble">
              <p className="chat-content">{msg.content}</p>
              <time
                className="chat-time"
                dateTime={msg.timestamp}
                aria-label={`Sent at ${new Date(msg.timestamp).toLocaleTimeString()}`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          </article>
        ))}

        {isProcessing && (
          <div className="chat-message chat-assistant" aria-label="EventGenie AI is thinking" role="status">
            <div className="chat-avatar" aria-hidden="true">🧞</div>
            <div className="chat-bubble">
              <div className="typing-indicator" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Last applied change notification */}
      {lastChange && (
        <div className="change-notification" role="status" aria-live="polite">
          <span className="change-icon" aria-hidden="true">✓</span>
          <span>Applied: {lastChange}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <label htmlFor="replanner-input" className="sr-only">
          Enter an instruction to adjust your event plan
        </label>
        <textarea
          ref={inputRef}
          id="replanner-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Cut catering by $500 and move it to decor…"
          rows={2}
          maxLength={300}
          disabled={isProcessing}
          className="chat-input"
          aria-label="Enter instruction"
          aria-describedby="chat-input-hint"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          className="chat-send-btn"
          aria-label="Send instruction"
          aria-busy={isProcessing}
        >
          {isProcessing ? (
            <RefreshCw size={18} className="spin-icon" aria-hidden="true" />
          ) : (
            <Send size={18} aria-hidden="true" />
          )}
        </button>
      </div>
      <p id="chat-input-hint" className="field-hint">
        Press Enter to send · Shift+Enter for new line · Max 300 characters
      </p>
    </section>
  );
};
