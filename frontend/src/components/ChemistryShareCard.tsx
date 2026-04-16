import { forwardRef } from 'react';
import { GameResult } from '../types';

interface Props {
  result: GameResult;
}

// 9:16 비율 카드 - html-to-image로 캡처해서 공유
const ChemistryShareCard = forwardRef<HTMLDivElement, Props>(({ result }, ref) => {
  const { matchPercent, grade } = result;

  const bgColor = matchPercent >= 70 ? '#FFC500' : matchPercent >= 40 ? '#00D8A6' : '#6C63FF';
  const emoji = matchPercent >= 90 ? '👯' : matchPercent >= 70 ? '🔥' : matchPercent >= 40 ? '🤝' : '🤔';

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        height: 640,
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
      }}
    >
      <div style={{ fontSize: 72, marginBottom: 16 }}>{emoji}</div>
      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.12)',
          borderRadius: 20,
          padding: '12px 24px',
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>우리사이 궁합</span>
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 4px 20px rgba(0,0,0,0.2)',
          marginBottom: 8,
        }}
      >
        {matchPercent}%
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
        {grade.label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: 40,
        }}
      >
        {grade.description}
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: 12,
          padding: '8px 20px',
        }}
      >
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
          우리사이 밸런스 게임 · 토스
        </span>
      </div>
    </div>
  );
});

ChemistryShareCard.displayName = 'ChemistryShareCard';
export default ChemistryShareCard;
