import { ReactNode } from 'react';

interface WaitingMotionProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function WaitingMotion({
  title = 'Radar Scan',
  subtitle = 'Lottie replacement area',
  children,
}: WaitingMotionProps) {
  return (
    <div style={styles.wrapper} aria-label={title} role="img">
      <div style={styles.motionCard}>
        <div style={styles.ringOuter} />
        <div style={styles.ringMiddle} />
        <div style={styles.ringInner} />
        <div style={styles.sweep} />
        <div style={styles.coreGlow} />
        <div style={{ ...styles.blip, top: '24%', left: '62%', animationDelay: '0.2s' }} />
        <div style={{ ...styles.blip, top: '58%', left: '28%', animationDelay: '0.6s' }} />
        <div style={{ ...styles.blip, top: '68%', left: '70%', animationDelay: '1.1s' }} />
        {children}
      </div>
      <div style={styles.caption}>
        <strong style={styles.captionTitle}>{title}</strong>
        <span style={styles.captionSubtitle}>{subtitle}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  motionCard: {
    position: 'relative',
    width: 164,
    height: 164,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at center, rgba(49,130,246,0.18) 0%, rgba(49,130,246,0.08) 40%, rgba(255,255,255,0.92) 76%)',
    boxShadow: '0 24px 60px rgba(25, 66, 131, 0.12), inset 0 0 0 1px rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  ringOuter: {
    position: 'absolute',
    inset: 10,
    borderRadius: '50%',
    border: '1px solid rgba(49,130,246,0.18)',
  },
  ringMiddle: {
    position: 'absolute',
    inset: 34,
    borderRadius: '50%',
    border: '1px solid rgba(49,130,246,0.14)',
  },
  ringInner: {
    position: 'absolute',
    inset: 58,
    borderRadius: '50%',
    border: '1px solid rgba(49,130,246,0.18)',
  },
  sweep: {
    position: 'absolute',
    inset: -8,
    borderRadius: '50%',
    background:
      'conic-gradient(from 0deg, rgba(49,130,246,0) 0deg, rgba(49,130,246,0.04) 250deg, rgba(49,130,246,0.36) 310deg, rgba(49,130,246,0) 360deg)',
    animation: 'waiting-radar-spin 2.4s linear infinite',
    transformOrigin: 'center',
  },
  coreGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 24,
    marginTop: -12,
    marginLeft: -12,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #5DA2FF 0%, #3182F6 58%, rgba(49,130,246,0.12) 100%)',
    boxShadow: '0 0 20px rgba(49,130,246,0.35)',
  },
  blip: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#00C773',
    boxShadow: '0 0 0 0 rgba(0,199,115,0.45)',
    animation: 'waiting-radar-pulse 1.8s ease-out infinite',
  },
  caption: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
  },
  captionTitle: {
    fontSize: 13,
    color: '#1B1D1F',
    fontWeight: 700,
  },
  captionSubtitle: {
    fontSize: 12,
    color: '#8B95A1',
  },
};
