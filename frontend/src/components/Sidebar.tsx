import { NavLink } from 'react-router-dom';

const links = [
  { to: '/notes', label: '笔记', icon: '📝' },
  { to: '/knowledge-base', label: '知识库', icon: '📁' },
  { to: '/output', label: '模板输出', icon: '📄' },
  { to: '/qa', label: '智能问答', icon: '💬' },
  { to: '/settings/models', label: '模型设置', icon: '⚙' },
];

export default function Sidebar() {
  return (
    <nav style={{
      width: '200px',
      minWidth: '200px',
      background: '#1a1a2e',
      color: '#eee',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 0',
    }}>
      <div style={{ padding: '0 16px 24px', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
        AI 知识助手
      </div>

      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            color: isActive ? '#fff' : '#aaa',
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            textDecoration: 'none',
            fontSize: '14px',
            borderLeft: isActive ? '3px solid #4ecdc4' : '3px solid transparent',
            transition: 'all 0.15s',
          })}
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
