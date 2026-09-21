import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, ChefHat, Clock } from 'lucide-react';
import type { AgentQueryResult, RecipeOutput } from '../types';

interface AgentChatPanelProps {
  onQueryResult: (result: AgentQueryResult) => void;
  triggerQuery?: string | null;
  onClearTrigger?: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  intent?: string;
  executionPath?: string[];
  recipeOutput?: RecipeOutput | null;
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  onQueryResult,
  triggerQuery,
  onClearTrigger,
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

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

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
        recipeOutput: data.recipe_output,
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

  useEffect(() => {
    if (triggerQuery) {
      executeQuery(triggerQuery);
      if (onClearTrigger) onClearTrigger();
    }
  }, [triggerQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    executeQuery(text);
  };

  return (
    <section className="panel-card" style={{ borderTop: '3px solid var(--accent-ember)' }}>
      <div className="panel-header">
        <h2 className="panel-title">
          <Bot size={20} style={{ color: 'var(--accent-ember)' }} />
          Asistente de Nutrición Deportiva
        </h2>
        <span style={{ fontSize: '0.78rem', color: 'var(--accent-lake)', fontWeight: 700, textTransform: 'uppercase' }}>
          ● En Línea
        </span>
      </div>

      <div className="panel-body">
        <div className="chat-messages">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`chat-message ${msg.sender}`}
              >
                <span className="message-author">
                  {msg.sender === 'user'
                    ? 'Atleta'
                    : `Agente Maestro ${msg.intent ? `[Nodo: ${msg.intent}]` : ''}`}
                </span>

                {msg.executionPath && (
                  <div className="execution-path-bar" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.4rem 0' }}>
                    {msg.executionPath.map((node, idx) => (
                      <span key={idx} className="node-badge active">
                        {idx > 0 ? '→ ' : ''}{node}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
                  dangerouslySetInnerHTML={{
                    __html: msg.text.replace(/\n/g, '<br />'),
                  }}
                />

                {/* Recipe Card Component if agent generated a recipe */}
                {msg.recipeOutput && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '0.85rem',
                      padding: '1.1rem',
                      backgroundColor: 'var(--surface-card)',
                      border: '1px solid var(--accent-ember)',
                      borderLeft: '4px solid var(--accent-ember)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-ember)', margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                        <ChefHat className="w-5 h-5 text-[#C1622B]" />
                        {msg.recipeOutput.recipe_name}
                      </h4>
                      <span className="brand-badge" style={{ fontSize: '0.75rem' }}>
                        Fit Score: {msg.recipeOutput.nutritional_fit_score}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock className="w-3.5 h-3.5 text-[#C1622B]" /> Preparación: {msg.recipeOutput.prep_time_minutes}m | Cocción: {msg.recipeOutput.cook_time_minutes}m
                      </span>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--ink-chalk)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Ingredientes de la Despensa:</strong>
                      <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                        {msg.recipeOutput.ingredients_used.map((ing, i) => (
                          <li key={i} style={{ color: ing.is_from_inventory ? 'var(--accent-moss)' : 'var(--ink-chalk)' }}>
                            {ing.quantity_used} {ing.unit} - <strong>{ing.name}</strong> {ing.is_from_inventory ? ' (✓ En Despensa)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--ink-chalk)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Pasos de Preparación:</strong>
                      <ol style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                        {msg.recipeOutput.preparation_steps.map((step) => (
                          <li key={step.step_number} style={{ marginBottom: '0.2rem' }}>
                            {step.instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="chat-message agent"
            >
              <span className="message-author">Asistente Nutricional</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.4rem 0', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-ember)' }} />
                <span>Analizando tus requerimientos e inventario...</span>
              </div>
            </motion.div>
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn-scoreboard"
            disabled={loading}
          >
            <Send className="w-4 h-4" />
            Enviar
          </motion.button>
        </form>
      </div>
    </section>
  );
};
