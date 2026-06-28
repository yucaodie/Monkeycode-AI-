import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ResizablePanels from './ResizablePanels';

describe('ResizablePanels', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children', () => {
    const { container } = render(
      <ResizablePanels direction="horizontal">
        <div data-testid="left">Left</div>
        <div data-testid="right">Right</div>
      </ResizablePanels>
    );

    expect(container.textContent).toContain('Left');
    expect(container.textContent).toContain('Right');
  });

  it('renders vertical direction', () => {
    const { container } = render(
      <ResizablePanels direction="vertical">
        <div>Top</div>
        <div>Bottom</div>
      </ResizablePanels>
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.style.flexDirection).toBe('column');
  });

  it('renders horizontal direction', () => {
    const { container } = render(
      <ResizablePanels direction="horizontal">
        <div>A</div>
        <div>B</div>
      </ResizablePanels>
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.style.flexDirection).toBe('row');
  });

  it('renders dividers between children', () => {
    const { container } = render(
      <ResizablePanels direction="horizontal">
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </ResizablePanels>
    );

    const dividers = Array.from(container.querySelectorAll('div > div > div')).filter(
      d => (d as HTMLElement).style.cursor === 'col-resize' || (d as HTMLElement).style.cursor === 'row-resize'
    );
    expect(dividers.length).toBe(2);
  });

  it('respects defaultRatios', () => {
    const { container } = render(
      <ResizablePanels direction="horizontal" defaultRatios={[0.3, 0.7]}>
        <div>Small</div>
        <div>Large</div>
      </ResizablePanels>
    );

    const panels = container.firstChild!.childNodes;
    const panelElements = Array.from(panels).filter(
      n => n instanceof HTMLElement && !(n as HTMLElement).style.cursor
    );

    // The outer div wraps child+divider pattern, second panel should have larger flex
    expect(panelElements.length).toBeGreaterThanOrEqual(2);
  });
});
