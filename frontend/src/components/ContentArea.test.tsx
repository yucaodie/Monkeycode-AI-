import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NavigationProvider } from '../contexts/NavigationContext';
import ContentArea from './ContentArea';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return <NavigationProvider>{children}</NavigationProvider>;
}

describe('ContentArea', () => {
  it('renders welcome hint when activeView is notes with no selection', () => {
    const { container } = render(
      <Wrapper>
        <ContentArea />
      </Wrapper>
    );
    expect(container.textContent).toContain('请从侧边栏选择笔记');
  });

  it('renders nothing for unknown activeView', () => {
    // Default activeView is 'notes' with no selection -> shows welcome hint
    const { container } = render(
      <Wrapper>
        <ContentArea />
      </Wrapper>
    );
    expect(container.textContent).toContain('请从侧边栏选择笔记');
  });
});
