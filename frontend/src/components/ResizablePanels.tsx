import { useState, useRef, useCallback, Fragment, type ReactNode } from 'react';

interface ResizablePanelsProps {
  direction: 'horizontal' | 'vertical';
  children: ReactNode[];
  defaultRatios?: number[];
  minSizes?: number[];
  storageKey?: string;
  className?: string;
}

function loadRatios(key: string, defaultRatios: number[]): number[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === defaultRatios.length) return parsed;
    }
  } catch { /* noop */ }
  return defaultRatios;
}

function saveRatios(key: string, ratios: number[]) {
  try { localStorage.setItem(key, JSON.stringify(ratios)); } catch { /* noop */ }
}

const DIVIDER_SIZE = 12;
const LINE_SIZE = 8;

export default function ResizablePanels({
  direction,
  children,
  defaultRatios,
  minSizes,
  storageKey,
  className,
}: ResizablePanelsProps) {
  const count = Array.isArray(children) ? children.length : 1;
  const defaultR = defaultRatios || Array(count).fill(1 / count);
  const minS = minSizes || Array(count).fill(180);

  const [ratios, setRatios] = useState(() =>
    storageKey ? loadRatios(storageKey, defaultR) : defaultR
  );
  const [hoveredDivider, setHoveredDivider] = useState<number | null>(null);

  const isHorizontal = direction === 'horizontal';

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);
  const startPos = useRef(0);
  const startRatios = useRef<number[]>([]);
  const containerSize = useRef(0);

  const ratiosRef = useRef(ratios);
  ratiosRef.current = ratios;

  const minSRef = useRef(minS);
  minSRef.current = minS;

  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  const handleDividerMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    draggingIndex.current = index;
    startPos.current = isHorizontal ? e.clientX : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      containerSize.current = isHorizontal ? rect.width : rect.height;
    }

    startRatios.current = [...ratiosRef.current];

    function onMouseMove(ev: MouseEvent) {
      if (draggingIndex.current === null) return;

      const idx = draggingIndex.current;
      const currentPos = isHorizontal ? ev.clientX : ev.clientY;
      const delta = currentPos - startPos.current;
      const deltaRatio = delta / containerSize.current;

      const newRatios = [...startRatios.current];
      const mins = minSRef.current;
      newRatios[idx] = Math.max(mins[idx] / containerSize.current, startRatios.current[idx] + deltaRatio);
      newRatios[idx + 1] = Math.max(mins[idx + 1] / containerSize.current, startRatios.current[idx + 1] - deltaRatio);

      const total = newRatios.reduce((a, b) => a + b, 0);
      if (total > 0) {
        for (let i = 0; i < newRatios.length; i++) {
          const minRatio = mins[i] / containerSize.current;
          newRatios[i] = Math.max(minRatio, newRatios[i] / total);
        }
      }

      setRatios(newRatios);
    }

    function onMouseUp() {
      draggingIndex.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const finalRatios = [...ratiosRef.current];
      const total = finalRatios.reduce((a, b) => a + b, 0);
      if (total > 0) {
        for (let i = 0; i < finalRatios.length; i++) {
          finalRatios[i] = finalRatios[i] / total;
        }
      }

      setRatios(finalRatios);
      const key = storageKeyRef.current;
      if (key) saveRatios(key, finalRatios);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [isHorizontal]);

  const handleDividerDoubleClick = useCallback((i: number) => {
    const midRatios = [...ratiosRef.current];
    midRatios[i - 1] = defaultR[i - 1];
    midRatios[i] = defaultR[i];
    const total = midRatios.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let j = 0; j < midRatios.length; j++) {
        midRatios[j] = midRatios[j] / total;
      }
    }
    setRatios(midRatios);
    const key = storageKeyRef.current;
    if (key) saveRatios(key, midRatios);
  }, [defaultR]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {Array.isArray(children) && children.map((child, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <div
              className="resizable-divider"
              onMouseDown={(e) => handleDividerMouseDown(i - 1, e)}
              onDoubleClick={() => handleDividerDoubleClick(i)}
              onMouseEnter={() => setHoveredDivider(i - 1)}
              onMouseLeave={() => setHoveredDivider(null)}
              style={{
                [isHorizontal ? 'width' : 'height']: DIVIDER_SIZE,
                [isHorizontal ? 'minWidth' : 'minHeight']: DIVIDER_SIZE,
                cursor: isHorizontal ? 'col-resize' : 'row-resize',
                flexShrink: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: hoveredDivider === i - 1 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
            >
              <div style={{
                [isHorizontal ? 'width' : 'height']: LINE_SIZE,
                alignSelf: 'stretch',
                borderRadius: 2,
                background: hoveredDivider === i - 1 ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'background 0.15s',
              }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, flex: ratios[i] || 1 }}>
            <div
              className={`resizable-panel ${i === 0 ? (isHorizontal ? 'resizable-panel-left' : 'resizable-panel-top') : ''} ${i === count - 1 ? (isHorizontal ? 'resizable-panel-right' : 'resizable-panel-bottom') : ''}`}
              style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              minHeight: 0,
            }}>
              {child}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
