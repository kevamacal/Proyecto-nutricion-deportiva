import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import type { AgentQueryResult } from '../types';

interface AgentChatPanelProps {
  onQueryResult: (result: AgentQueryResult) => void;
  onQuickQuery: (queryText: string) => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  intent?: string;
  executionPath?: string[];
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  onQueryResult,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: '1',
      sender: 'agent',
      text: '¡Hola! Soy tu asistente maestro de nutrición deportiva. Escribe cualquier consulta en lenguaje natural (ej. "Jugué 90 minutos de baloncesto, ¿qué cenar con mi despensa?").',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const queryText = inputValue.trim();
    setInputValue('');

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/v1/agent/orchestrator/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          date: '2026-09-15',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: AgentQueryResult = await response.json();

      const agentMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: data.final_response,
        intent: data.intent,
        executionPath: data.execution_path,
      };

      setMessages((prev) => [...prev, agentMsg]);
      onQueryResult(data);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Error de conexión con la API del orquestador: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2 className="panel-title">
          <Bot className="w-5 h-5 text-[#C1622B]" />
          Asistente Orquestador Multi-Agente
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--accent-lake)' }}>
          Estado: Conectado
        </span>
      </div>

      <div className="panel-body">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              <span className="message-author">
                {msg.sender === 'user' ? 'Atleta' : `Agente Maestro ${msg.intent ? `(Intención: ${msg.intent})` : ''}`}
              </span>

              {msg.executionPath && (
                <div className="execution-path-bar">
                  {msg.executionPath.map((node, idx) => (
                    <span key={idx} className="node-badge active">
                      {node}
                    </span>
                  ))}
                </div>
              )}

              <div
                dangerouslySetInnerHTML={{
                  __html: msg.text.replace(/\n/g, '<br />'),
                }}
              />
            </div>
          ))}

          {loading && (
            <div className="chat-message agent">
              <span className="message-author">Sistema Orquestador</span>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles className="w-4 h-4 animate-spin text-[#C1622B]" />
                Ejecutando pipeline de estado LangGraph...
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pregunta al agente sobre tu nutrición o deporte..."
          />
          <button type="submit" className="btn-scoreboard" disabled={loading}>
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </form>
      </div>
    </section>
  );
};
