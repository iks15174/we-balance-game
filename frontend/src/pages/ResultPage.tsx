import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { share, getTossShareLink } from '@apps-in-toss/web-framework';
import { useAd } from '../hooks/useAd';
import { api } from '../api/client';
import { GameResult, ResultDetail } from '../types';
import { getQuestionById } from '../data/topics';

const INTERSTITIAL_AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID ?? 'ait.v2.live.aed9b062f93f4df7';
// 이미 광고 시청한 shortCode를 세션 중 기억 — 재방문 시 광고 스킵
const watchedAds = new Set<string>();

export default function ResultPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  const alreadyWatched = shortCode ? watchedAds.has(shortCode) : false;
  const [phase, setPhase] = useState<'loading' | 'ad' | 'result'>('loading');
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [adTimedOut, setAdTimedOut] = useState(false);

  const { isLoaded: adLoaded, isSupported: adSupported, show: showAd } = useAd({
    adGroupId: INTERSTITIAL_AD_GROUP_ID,
    onDismissed: () => {
      if (shortCode) watchedAds.add(shortCode);
      setPhase('result');
    },
  });

  // 광고가 5초 내에 로딩되지 않으면 건너뛰기 버튼 표시
  useEffect(() => {
    if (phase !== 'ad') return;
    if (adLoaded) return;
    const timer = setTimeout(() => setAdTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [phase, adLoaded]);

  useEffect(() => {
    if (!shortCode) { navigate('/'); return; }
    api.getResult(shortCode)
      .then((r) => {
        if (!r.ready) {
          navigate(`/waiting/${shortCode}?role=A`, { replace: true });
          return;
        }
        setResult(r);
        // 이미 광고 시청한 경우 or 광고 미지원 환경이면 바로 결과 표시
        if (alreadyWatched || !adSupported) {
          setPhase('result');
        } else {
          setPhase('ad');
        }
      })
      .catch(() => setError('결과를 불러오지 못했어요.'));
  }, [shortCode, navigate, adSupported, alreadyWatched]);

  async function handleShareCard() {
    if (!result) return;
    setSharing(true);
    try {
      const link = await getTossShareLink(`intoss://we-balance-game/result/${shortCode}`);
      await share({
        message: `우리사이 케미 ${result.matchPercent}%! ${result.grade.label}\n${result.grade.description}\n결과 보러 가기 → ${link}`,
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
        {adTimedOut && (
          <button
            style={{ marginTop: 16, fontSize: 13, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => {
              if (shortCode) watchedAds.add(shortCode);
              setPhase('result');
            }}
          >
            건너뛰기
          </button>
        )}
      </div>
    );
  }

  // phase === 'result'
  if (!result) return null;
  const { matchPercent, grade, isCustom, aName, bName } = result;

  const details: ResultDetail[] = result.details.map(d => {
    if (isCustom || (d.text && d.optionA && d.optionB)) return d;
    const local = getQuestionById(d.questionId);
    return { ...d, text: local?.text ?? d.questionId, optionA: local?.optionA ?? 'A', optionB: local?.optionB ?? 'B' };
  });

  const bgColor = matchPercent >= 70 ? '#3182F6' : matchPercent >= 40 ? '#00B899' : '#6C63FF';
  const emoji = matchPercent >= 90 ? '👯' : matchPercent >= 70 ? '🔥' : matchPercent >= 40 ? '🤝' : '🤔';

  return (
    <div style={styles.container}>
      <div style={{ ...styles.resultHeader, backgroundColor: bgColor }}>
        {(aName || bName) && (
          <div style={styles.namesRow}>
            <span style={styles.nameChip}>{aName ?? '나'}</span>
            <span style={styles.nameVs}>VS</span>
            <span style={styles.nameChip}>{bName ?? '친구'}</span>
          </div>
        )}
        <div style={styles.resultEmoji}>{emoji}</div>
        <div style={styles.percentText}>{matchPercent}%</div>
        <div style={styles.gradeLabel}>{grade.label}</div>
        <div style={styles.gradeDesc}>{grade.description}</div>
      </div>

      <div style={styles.shareRow}>
        <button style={styles.shareBtn} onClick={handleShareCard} disabled={sharing}>
          {sharing ? '저장 중...' : '📸 케미 카드 공유하기'}
        </button>
      </div>

      <div style={styles.detailSection}>
        <p style={styles.detailTitle}>문항별 비교</p>
        {details.map((d, i) => (
          <DetailRow key={d.questionId} detail={d} index={i} aName={aName} bName={bName} />
        ))}
      </div>

      <div style={styles.footer}>
        <button style={styles.homeBtn} onClick={() => navigate('/', { replace: true })}>
          새 게임 시작하기
        </button>
      </div>
    </div>
  );
}

function DetailRow({ detail, index, aName, bName }: { detail: ResultDetail; index: number; aName: string | null; bName: string | null }) {
  const { text, optionA, optionB, aChoice, bChoice, isMatch } = detail;
  return (
    <div style={{ ...styles.detailCard, borderColor: isMatch ? '#3182F6' : '#eee' }}>
      <div style={styles.detailHeader}>
        <span style={styles.detailNum}>Q{index + 1}</span>
        <span style={{ fontSize: 16 }}>{isMatch ? '✅' : '❌'}</span>
      </div>
      <p style={styles.detailQ}>{text}</p>
      <div style={styles.choiceRow}>
        <ChoiceChip label={aName ?? '나'} choice={aChoice} optionA={optionA ?? ''} optionB={optionB ?? ''} isMatch={isMatch} />
        <ChoiceChip label={bName ?? '친구'} choice={bChoice} optionA={optionA ?? ''} optionB={optionB ?? ''} isMatch={isMatch} />
      </div>
    </div>
  );
}

function ChoiceChip({
  label, choice, optionA, optionB, isMatch,
}: {
  label: string; choice: 'A' | 'B' | null; optionA: string; optionB: string; isMatch: boolean;
}) {
  const text = choice === 'A' ? optionA : choice === 'B' ? optionB : '-';
  return (
    <div style={{ ...styles.choiceChip, backgroundColor: isMatch ? '#EBF3FF' : '#f9f9f9' }}>
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
    backgroundColor: '#3182F6', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
  },
  resultHeader: {
    padding: '40px 24px 32px', textAlign: 'center',
  },
  namesRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 16,
  },
  nameChip: {
    backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff',
    fontSize: 14, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
  },
  nameVs: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
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
  detailNum: { fontSize: 12, fontWeight: 700, color: '#3182F6' },
  detailQ: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 10, lineHeight: 1.4 },
  choiceRow: { display: 'flex', gap: 8 },
  choiceChip: {
    flex: 1, borderRadius: 10, padding: '8px 10px',
  },
  chipLabel: { fontSize: 11, color: '#999', display: 'block', marginBottom: 2 },
  chipText: { fontSize: 12, color: '#333', fontWeight: 500 },
  footer: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0',
  },
  homeBtn: {
    width: '100%', padding: 15, borderRadius: 14, border: 'none',
    backgroundColor: '#3182F6', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
  },
};
