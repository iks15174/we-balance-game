import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { share, getTossShareLink } from '@apps-in-toss/web-framework';
import { useAd } from '../hooks/useAd';
import { api } from '../api/client';
import { GameResult, ResultDetail } from '../types';
import { getQuestionById } from '../data/topics';

// 앱인토스 콘솔에서 발급받은 전면 광고 ID로 변경하세요
const INTERSTITIAL_AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID ?? 'ait.dev.43daa14da3ae487b';

export default function ResultPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'loading' | 'ad' | 'result'>('loading');
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  const { isLoaded: adLoaded, isSupported: adSupported, show: showAd } = useAd({
    adGroupId: INTERSTITIAL_AD_GROUP_ID,
    onDismissed: () => setPhase('result'),
  });

  useEffect(() => {
    if (!shortCode) { navigate('/'); return; }
    api.getResult(shortCode)
      .then((r) => {
        if (!r.ready) {
          // 아직 상대방이 완료 안 함
          navigate(`/waiting/${shortCode}?role=A`);
          return;
        }
        setResult(r);
        // 광고 미지원 환경(브라우저, 구버전 토스)이면 바로 결과 표시
        setPhase(adSupported ? 'ad' : 'result');
      })
      .catch(() => setError('결과를 불러오지 못했어요.'));
  }, [shortCode, navigate, adSupported]);

  async function handleShareCard() {
    if (!result) return;
    setSharing(true);
    try {
      const link = await getTossShareLink(`intoss://we-balance-game/result/${shortCode}`);
      await share({
        message: `🎮 우리사이 케미 ${result.matchPercent}%! ${result.grade.label}\n${result.grade.description}\n결과 보러 가기 → ${link}`,
      });
    } catch {
      alert('공유에 실패했어요.');
    } finally {
      setSharing(false);
    }
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>😅</div>
        <p style={{ color: '#444', marginBottom: 16 }}>{error}</p>
        <button style={styles.btn} onClick={() => navigate('/')}>홈으로</button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          우리사이 케미 분석 중...
        </p>
        <p style={{ fontSize: 13, color: '#999' }}>잠시만 기다려 주세요</p>
      </div>
    );
  }

  if (phase === 'ad') {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>
          분석 완료!
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 32, textAlign: 'center', lineHeight: 1.6 }}>
          광고 1개를 시청하면<br />케미 결과를 바로 확인할 수 있어요
        </p>
        <button
          style={{ ...styles.btn, width: '100%', maxWidth: 280, opacity: adLoaded ? 1 : 0.6 }}
          onClick={adLoaded ? showAd : undefined}
          disabled={!adLoaded}
        >
          {adLoaded ? '광고 보고 결과 확인하기 🎁' : '광고 준비 중...'}
        </button>
      </div>
    );
  }

  // phase === 'result'
  if (!result) return null;
  const { matchPercent, grade, isCustom } = result;

  // 일반 게임: 서버가 질문 텍스트를 내려주지 않으므로 FE 로컬 데이터로 보강
  const details: ResultDetail[] = result.details.map(d => {
    if (isCustom || (d.text && d.optionA && d.optionB)) return d;
    const local = getQuestionById(d.questionId);
    return { ...d, text: local?.text ?? d.questionId, optionA: local?.optionA ?? 'A', optionB: local?.optionB ?? 'B' };
  });
  const bgColor = matchPercent >= 70 ? '#FFC500' : matchPercent >= 40 ? '#00D8A6' : '#6C63FF';
  const emoji = matchPercent >= 90 ? '👯' : matchPercent >= 70 ? '🔥' : matchPercent >= 40 ? '🤝' : '🤔';

  return (
    <div style={styles.container}>
      {/* 결과 헤더 */}
      <div style={{ ...styles.resultHeader, backgroundColor: bgColor }}>
        <div style={styles.resultEmoji}>{emoji}</div>
        <div style={styles.percentText}>{matchPercent}%</div>
        <div style={styles.gradeLabel}>{grade.label}</div>
        <div style={styles.gradeDesc}>{grade.description}</div>
      </div>

      {/* 공유 버튼 */}
      <div style={styles.shareRow}>
        <button style={styles.shareBtn} onClick={handleShareCard} disabled={sharing}>
          {sharing ? '저장 중...' : '📸 케미 카드 공유하기'}
        </button>
      </div>

      {/* 질문별 비교 */}
      <div style={styles.detailSection}>
        <p style={styles.detailTitle}>문항별 비교</p>
        {details.map((d, i) => (
          <DetailRow key={d.questionId} detail={d} index={i} />
        ))}
      </div>

      <div style={styles.footer}>
        <button style={styles.homeBtn} onClick={() => navigate('/')}>
          새 게임 시작하기
        </button>
      </div>
    </div>
  );
}

function DetailRow({ detail, index }: { detail: ResultDetail; index: number }) {
  const { text, optionA, optionB, aChoice, bChoice, isMatch } = detail;
  return (
    <div style={{ ...styles.detailCard, borderColor: isMatch ? '#FFC500' : '#eee' }}>
      <div style={styles.detailHeader}>
        <span style={styles.detailNum}>Q{index + 1}</span>
        <span style={{ fontSize: 16 }}>{isMatch ? '✅' : '❌'}</span>
      </div>
      <p style={styles.detailQ}>{text}</p>
      <div style={styles.choiceRow}>
        <ChoiceChip label="나" choice={aChoice} optionA={optionA ?? ''} optionB={optionB ?? ''} />
        <ChoiceChip label="친구" choice={bChoice} optionA={optionA ?? ''} optionB={optionB ?? ''} />
      </div>
    </div>
  );
}

function ChoiceChip({
  label, choice, optionA, optionB,
}: {
  label: string; choice: 'A' | 'B' | null; optionA: string; optionB: string;
}) {
  const text = choice === 'A' ? optionA : choice === 'B' ? optionB : '-';
  return (
    <div style={styles.choiceChip}>
      <span style={styles.chipLabel}>{label}</span>
      <span style={styles.chipText}>{choice ? `${choice}. ` : ''}{text}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 100 },
  center: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center',
  },
  btn: {
    padding: '15px 28px', borderRadius: 14, border: 'none',
    backgroundColor: '#FFC500', fontSize: 16, fontWeight: 700, color: '#111', cursor: 'pointer',
  },
  resultHeader: {
    padding: '40px 24px 32px', textAlign: 'center',
  },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  percentText: { fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1 },
  gradeLabel: { fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 8, marginBottom: 4 },
  gradeDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  shareRow: { padding: '16px 16px 0' },
  shareBtn: {
    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
    backgroundColor: '#fff', fontSize: 15, fontWeight: 600, color: '#111',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  detailSection: { padding: '20px 16px 0' },
  detailTitle: { fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, paddingLeft: 4 },
  detailCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 10, border: '1.5px solid #eee',
  },
  detailHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  detailNum: { fontSize: 12, fontWeight: 700, color: '#FFC500' },
  detailQ: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 10, lineHeight: 1.4 },
  choiceRow: { display: 'flex', gap: 8 },
  choiceChip: {
    flex: 1, backgroundColor: '#f9f9f9', borderRadius: 10, padding: '8px 10px',
  },
  chipLabel: { fontSize: 11, color: '#999', display: 'block', marginBottom: 2 },
  chipText: { fontSize: 12, color: '#333', fontWeight: 500 },
  footer: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0',
  },
  homeBtn: {
    width: '100%', padding: 15, borderRadius: 14, border: 'none',
    backgroundColor: '#111', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
  },
};
