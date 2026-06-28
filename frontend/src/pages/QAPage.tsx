import { useState, useRef, useEffect } from 'react';

interface Source {
  title: string;
  type: 'note' | 'file';
  id: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/qa/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        setMessages(prev => [...prev, { role: 'assistant', content: err.error || '抱歉，处理请求时出错。' }]);
        return;
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，请求失败，请检查网络连接后重试。' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      maxWidth: 800, margin: '0 auto', position: 'relative',
      background: 'var(--color-bg-primary)',
    }}>
      <div style={{
        padding: 'var(--space-lg) 0',
        borderBottom: '1px solid var(--color-border-light)',
        flexShrink: 0,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 'var(--font-size-h2)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
        }}>智能问答</h2>
        <p style={{
          margin: 'var(--space-xs) 0 0',
          fontSize: 'var(--font-size-small)',
          color: 'var(--color-text-tertiary)',
        }}>
          基于你的笔记和知识库内容，用自然语言提问获取答案
        </p>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1, overflow: 'auto', padding: 'var(--space-lg) 0',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)',
        }}
      >
        {!hasMessages && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', color: 'var(--color-text-tertiary)', gap: 'var(--space-md)',
          }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <div style={{ fontSize: 'var(--font-size-body)' }}>在下方输入问题，基于笔记和知识库获取答案</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '90%',
              minWidth: msg.role === 'assistant' ? '60%' : 'auto',
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: 'var(--radius-lg)',
              background: msg.role === 'user'
                ? 'var(--color-bg-selected)'
                : 'var(--color-bg-secondary)',
              border: msg.role === 'user'
                ? '1px solid var(--color-primary-light)'
                : '1px solid var(--color-border-light)',
              fontSize: 'var(--font-size-body)',
              lineHeight: 'var(--line-height-relaxed)',
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              <div style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-text-tertiary)',
                marginBottom: 'var(--space-xs)',
                fontWeight: 'var(--font-weight-semibold)',
              }}>
                {msg.role === 'user' ? '你' : 'AI 助手'}
              </div>
              <div>{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div style={{
                  marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--color-text-tertiary)',
                    marginBottom: 'var(--space-xs)',
                  }}>引用来源：</div>
                  {msg.sources.map((s, j) => (
                    <div
                      key={j}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)',
                        padding: 'var(--space-xs) var(--space-sm)', margin: '2px 4px 2px 0',
                        background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)', fontSize: 'var(--font-size-small)',
                        color: 'var(--color-text-secondary)', cursor: 'pointer',
                      }}
                    >
                      <span>{s.type === 'note' ? '📄' : '📁'}</span>
                      <span>{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-light)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              fontSize: 'var(--font-size-small)', color: 'var(--color-text-tertiary)',
            }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: 'var(--color-primary)',
                animation: 'pulse 1.2s infinite',
              }} />
              正在检索并生成回答...
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: 'var(--space-md) 0 var(--space-sm)',
        borderTop: '1px solid var(--color-border-light)',
        display: 'flex', gap: 'var(--space-sm)', flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题，Enter 发送..."
          disabled={loading}
          style={{
            flex: 1,
            padding: 'var(--space-sm) var(--space-md)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-body)',
            outline: 'none',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: 'var(--space-sm) var(--space-xl)',
            background: loading || !input.trim()
              ? 'var(--color-border)'
              : 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-body)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          发送
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
