const SKELETON_STYLE: React.CSSProperties = {
  height: 16,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg-hover)',
  marginBottom: 'var(--space-xs)',
};

export default function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            ...SKELETON_STYLE,
            width: `${70 + Math.sin(i * 1.7) * 20}%`,
            animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
