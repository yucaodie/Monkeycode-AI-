import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationProvider } from '../contexts/NavigationContext';
import { SectionGroup, NavItem } from './SidebarParts';
import Sidebar from './Sidebar';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <NavigationProvider>{children}</NavigationProvider>;
}

describe('SectionGroup', () => {
  it('renders title and toggles children on click', () => {
    render(
      <Wrapper>
        <SectionGroup title="测试分组">
          <div data-testid="child">子内容</div>
        </SectionGroup>
      </Wrapper>
    );

    expect(screen.getByText('测试分组')).toBeDefined();
    expect(screen.getByTestId('child')).toBeDefined();

    fireEvent.click(screen.getByText('测试分组'));
    expect(screen.queryByTestId('child')).toBeNull();

    fireEvent.click(screen.getByText('测试分组'));
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('respects defaultExpanded=false', () => {
    render(
      <Wrapper>
        <SectionGroup title="折叠组" defaultExpanded={false}>
          <div data-testid="hidden-child">隐藏</div>
        </SectionGroup>
      </Wrapper>
    );

    expect(screen.queryByTestId('hidden-child')).toBeNull();
  });
});

describe('NavItem', () => {
  it('renders icon and label and handles click', () => {
    const onClick = vi.fn();
    render(
      <Wrapper>
        <NavItem icon="💬" label="智能问答" onClick={onClick} />
      </Wrapper>
    );

    expect(screen.getByText('💬')).toBeDefined();
    expect(screen.getByText('智能问答')).toBeDefined();

    fireEvent.click(screen.getByText('智能问答'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies active styles', () => {
    const { container } = render(
      <Wrapper>
        <NavItem icon="⚙" label="设置" active onClick={() => {}} />
      </Wrapper>
    );

    const navItem = container.firstChild as HTMLElement;
    expect(navItem.style.color).toBe('var(--color-sidebar-text-active)');
    expect(navItem.style.borderLeft).toContain('var(--color-primary)');
  });
});

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders header with app name', () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    expect(screen.getByText('AI 知识助手')).toBeDefined();
  });

  it('renders all flat navigation items when expanded', () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    expect(screen.getByText('笔记 & 知识库')).toBeDefined();
    expect(screen.getByText('智能问答')).toBeDefined();
    expect(screen.getByText('模板输出')).toBeDefined();
    expect(screen.getByText('模型设置')).toBeDefined();
  });

  it('renders NavItems for QA, Output, Settings', () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    expect(screen.getByText('智能问答')).toBeDefined();
    expect(screen.getByText('模板输出')).toBeDefined();
    expect(screen.getByText('模型设置')).toBeDefined();
  });

  it('renders footer with user area and version', () => {
    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('v1.0.0')).toBeDefined();
  });

  it('toggles collapse state on button click', () => {
    const { container } = render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    const toggleBtn = container.querySelector('nav button')!;
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('persists collapse state to localStorage', () => {
    localStorage.setItem('sidebar-collapsed', 'true');

    render(
      <Wrapper>
        <Sidebar />
      </Wrapper>
    );

    expect(screen.queryByText('AI 知识助手')).toBeNull();
  });
});
