import { useState, useEffect, useCallback } from 'react';
import { NavItem } from './SidebarParts';
import { useNavigationActions } from '../contexts/NavigationContext';
import type { ActiveView } from '../contexts/NavigationContext';
import './Sidebar.css';

function loadStored(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === 'true';
  } catch {
    return fallback;
  }
}

function saveStored(key: string, value: boolean) {
  try { localStorage.setItem(key, String(value)); } catch { /* noop */ }
}

export default function Sidebar() {
  const { activeView, navigateTo } = useNavigationActions();

  const [collapsed, setCollapsed] = useState(() => loadStored('sidebar-collapsed', false));
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    saveStored('sidebar-collapsed', collapsed);
  }, [collapsed]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const handleNavClick = useCallback((view: ActiveView) => {
    navigateTo(view);
    if (isMobile) setMobileOpen(false);
  }, [navigateTo, isMobile]);

  const isTreeActive = activeView === 'notes' || activeView === 'kb';

  const expandedWidth = 'var(--sidebar-width)';
  const collapsedWidth = 'var(--sidebar-collapsed-width)';

  const sidebarContent = (
    <nav
      style={{
        width: collapsed ? collapsedWidth : expandedWidth,
        minWidth: collapsed ? collapsedWidth : expandedWidth,
        background: 'var(--color-sidebar-bg)',
        color: 'var(--color-sidebar-text)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? 'var(--space-md) var(--space-xs)' : 'var(--space-lg)',
        minHeight: 48,
      }}>
        {!collapsed && (
          <span style={{
            fontSize: 'var(--font-size-h2)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-sidebar-text-active)',
            whiteSpace: 'nowrap',
          }}>
            AI 知识助手
          </span>
        )}
        <button
          onClick={toggleCollapse}
          title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-sidebar-text)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-body)',
            padding: 'var(--space-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? '\u25B6' : '\u25C0'}
        </button>
      </div>

      {/* Body - flat navigation */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: collapsed ? 0 : 'var(--space-sm) 0',
      }}>
        {!collapsed ? (
          <>
            <NavItem
              icon="📝"
              label="笔记 & 知识库"
              active={isTreeActive}
              onClick={() => handleNavClick('notes')}
            />
            <NavItem
              icon="💬"
              label="智能问答"
              active={activeView === 'qa'}
              onClick={() => handleNavClick('qa')}
            />
            <NavItem
              icon="📄"
              label="模板输出"
              active={activeView === 'output'}
              onClick={() => handleNavClick('output')}
            />
            <NavItem
              icon="⚙"
              label="模型设置"
              active={activeView === 'settings'}
              onClick={() => handleNavClick('settings')}
            />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'var(--space-sm)', gap: 'var(--space-lg)' }}>
            <div title="笔记 & 知识库" onClick={() => handleNavClick('notes')} style={iconBtnStyle}>
              📝
            </div>
            <div title="智能问答" onClick={() => handleNavClick('qa')} style={iconBtnStyle}>
              💬
            </div>
            <div title="模板输出" onClick={() => handleNavClick('output')} style={iconBtnStyle}>
              📄
            </div>
            <div title="模型设置" onClick={() => handleNavClick('settings')} style={iconBtnStyle}>
              ⚙
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid var(--color-sidebar-divider)',
        padding: collapsed ? 'var(--space-sm) var(--space-xs)' : 'var(--space-sm) var(--space-lg)',
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        fontSize: 'var(--font-size-small)',
        color: 'var(--color-sidebar-text)',
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-bold)',
              flexShrink: 0,
            }}>
              A
            </div>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              admin
            </span>
            <button
              title="设置"
              onClick={() => handleNavClick('settings')}
              style={{
                background: 'transparent', border: 'none', color: 'var(--color-sidebar-text)',
                cursor: 'pointer', fontSize: 'var(--font-size-body)', padding: 0,
              }}
            >
              ⚙
            </button>
          </>
        ) : (
          <>
            <div title="admin" style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-bold)',
            }}>
              A
            </div>
            <div title="设置" onClick={() => handleNavClick('settings')} style={{ cursor: 'pointer', fontSize: 'var(--font-size-body)' }}>
              ⚙
            </div>
          </>
        )}
        {!collapsed && (
          <span style={{ fontSize: '10px', color: 'var(--color-sidebar-section-title)' }}>
            v1.0.0
          </span>
        )}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Sidebar container */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        zIndex: isMobile ? 100 : 'auto',
        height: '100vh',
        left: isMobile ? (mobileOpen ? 0 : `-${collapsed ? 64 : 240}px`) : 'auto',
        transition: isMobile ? 'left 0.2s ease' : undefined,
      }}>
        {/* Mobile toggle button */}
        {isMobile && !mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              position: 'fixed',
              top: 'var(--space-md)',
              left: 'var(--space-md)',
              zIndex: 101,
              background: 'var(--color-sidebar-bg)',
              color: 'var(--color-sidebar-text)',
              border: '1px solid var(--color-sidebar-divider)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-body)',
            }}
          >
            ☰
          </button>
        )}

        {sidebarContent}
      </div>
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-h3)',
  color: 'var(--color-sidebar-text)',
};
