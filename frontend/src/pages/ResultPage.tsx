import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTossShareLink, share } from '@apps-in-toss/web-framework';
import { getQuestionById } from '../data/topics';
import { useAd } from '../hooks/useAd';
import { useCountUp } from '../hooks/useCountUp';
import { api } from '../api/client';
import { GameResult, ResultDetail } from '../types';

const INTERSTITIAL_AD_GROUP_ID =
  import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID ?? 'ait.v2.live.aed9b062f93f4df7';

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

  const {
    isLoaded: adLoaded,
    isLoading: adLoading,
    isSupported: adSupported,
    show: showAd,
  } = useAd({
    adGroupId: INTERSTITIAL_AD_GROUP_ID,
    onDismissed: () => {
      if (shortCode) watchedAds.add(shortCode);
      setPhase('result');
    },
  });

  const animatedPercent = useCountUp(result?.matchPercent ?? 0, 1000);

  useEffect(() => {
    if (phase !== 'ad') return;
    if (adLoaded) return;

    const timer = setTimeout(() => setAdTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [adLoaded, phase]);

  useEffect(() => {
    if (!adTimedOut) return;
    if (shortCode) watchedAds.add(shortCode);
    setPhase('result');
  }, [adTimedOut, shortCode]);

  useEffect(() => {
    if (!shortCode) {
      navigate('/');
      return;
    }

    api.getResult(shortCode)
      .then((response) => {
        if (!response.ready) {
          navigate(`/waiting/${shortCode}?role=A`, { replace: true });
          return;
        }

        setResult(response);
        if (alreadyWatched || !adSupported) {
          setPhase('result');
        } else {
          setPhase('ad');
        }
      })
      .catch(() => setError('결과를 불러오지 못했어요.'));
  }, [adSupported, alreadyWatched, navigate, shortCode]);

  async function handleShareCard() {
    if (!result) return;

    setSharing(true);
    try {
      const link = await getTossShareLink(`intoss://we-balance-game/result/${shortCode}`);
      await share({
        message: `우리 사이 궁합 ${result.matchPercent}%! ${result.grade.label}\n${result.grade.description}\n결과 보러 가기 ${link}`,
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
        <div style={{ fontSize: 36, marginBottom: 12 }}>안내</div>
        <p style={{ color: '#444', marginBottom: 16 }}>{error}</p>
        <button type="button" style={styles.btn} onClick={() => navigate('/')}>홈으로</button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div style={styles.center}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>
          궁합 분석 중...
        </p>
        <p style={{ fontSize: 13, color: '#999' }}>잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (phase === 'ad') {
    return (
      <div style={styles.center}>
        <style>{`
          @keyframes ad-button-fade-in {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes ad-spinner-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes result-card-raise {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>
          분석 완료!
        </p>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 32, textAlign: 'center', lineHeight: 1.6 }}>
          광고 1개만 보면
          <br />
          결과를 바로 확인할 수 있어요.
        </p>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.adCtaBtn, opacity: adLoaded ? 1 : 0.88 }}
          onClick={adLoaded ? showAd : undefined}
          disabled={!adLoaded}
        >
          {(adLoading || !adLoaded) && <span style={styles.spinner} aria-hidden="true" />}
          <span key={adLoaded ? 'ready' : 'loading'} style={styles.adCtaLabel}>
            {adLoaded ? '광고 보고 결과 확인하기' : '광고 준비 중...'}
          </span>
        </button>
      </div>
    );
  }

  if (!result) return null;

  const { matchPercent, grade, isCustom, aName, bName } = result;
  const details: ResultDetail[] = result.details.map((detail) => {
    if (isCustom || (detail.text && detail.optionA && detail.optionB)) return detail;
    const local = getQuestionById(detail.questionId);

    return {
      ...detail,
      text: local?.text ?? detail.questionId,
      optionA: local?.optionA ?? 'A',
      optionB: local?.optionB ?? 'B',
    };
  });

  const bgColor = matchPercent >= 70 ? '#3182F6' : matchPercent >= 40 ? '#00B899' : '#6C63FF';
  const emoji = matchPercent >= 90 ? '💞' : matchPercent >= 70 ? '✨' : matchPercent >= 40 ? '🙂' : '🤔';

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes result-card-raise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ ...styles.resultHeader, backgroundColor: bgColor }}>
        {(aName || bName) && (
          <div style={styles.namesRow}>
            <span style={styles.nameChip}>{aName ?? '나'}</span>
            <span style={styles.nameVs}>VS</span>
            <span style={styles.nameChip}>{bName ?? '친구'}</span>
          </div>
        )}
        <div style={styles.resultEmoji}>{emoji}</div>
        <div style={styles.percentText}>{animatedPercent}%</div>
        <div style={styles.gradeLabel}>{grade.label}</div>
        <div style={styles.gradeDesc}>{grade.description}</div>
      </div>

      <div style={styles.shareRow}>
        <button type="button" style={styles.shareBtn} onClick={handleShareCard} disabled={sharing}>
          {sharing ? '공유 중...' : '결과 카드 공유하기'}
        </button>
      </div>

      <div style={styles.detailSection}>
        <p style={styles.detailTitle}>문항별 비교</p>
        {details.map((detail, index) => (
          <DetailRow key={detail.questionId} detail={detail} index={index} aName={aName} bName={bName} />
        ))}
      </div>

      <div style={styles.footer}>
        <button type="button" style={styles.homeBtn} onClick={() => navigate('/', { replace: true })}>
          새 게임 시작하기
        </button>
      </div>
    </div>
  );
}

function DetailRow({
  detail,
  index,
  aName,
  bName,
}: {
  detail: ResultDetail;
  index: number;
  aName: string | null;
  bName: string | null;
}) {
  const { text, optionA, optionB, aChoice, bChoice, isMatch } = detail;

  return (
    <div
      style={{
        ...styles.detailCard,
        ...(isMatch ? styles.detailCardMatch : styles.detailCardMismatch),
      }}
    >
      <div style={styles.detailHeader}>
        <span style={styles.detailNum}>Q{index + 1}</span>
        <span style={{ fontSize: 16 }}>{isMatch ? '✅' : '❌'}</span>
      </div>
      <p style={styles.detailQ}>{text}</p>
      <div style={styles.choiceRow}>
        <ChoiceChip
          label={aName ? `${aName} · 내 답변` : '내 답변'}
          choice={aChoice}
          optionA={optionA ?? ''}
          optionB={optionB ?? ''}
          tone="me"
        />
        <ChoiceChip
          label={bName ? `${bName} · 친구 답변` : '친구 답변'}
          choice={bChoice}
          optionA={optionA ?? ''}
          optionB={optionB ?? ''}
          tone="friend"
        />
      </div>
    </div>
  );
}

function ChoiceChip({
  label,
  choice,
  optionA,
  optionB,
  tone,
}: {
  label: string;
  choice: 'A' | 'B' | null;
  optionA: string;
  optionB: string;
  tone: 'me' | 'friend';
}) {
  const text = choice === 'A' ? optionA : choice === 'B' ? optionB : '-';

  return (
    <div
      style={{
        ...styles.choiceChip,
        ...(tone === 'me' ? styles.choiceChipMe : styles.choiceChipFriend),
      }}
    >
      <span style={styles.chipLabel}>{label}</span>
      <span style={styles.chipText}>
        {choice ? `${choice}. ` : ''}
        {text}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 100 },
  center: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    textAlign: 'center',
  },
  btn: {
    padding: '15px 28px',
    borderRadius: 14,
    border: 'none',
    backgroundColor: '#3182F6',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
  },
  adCtaBtn: {
    width: '100%',
    maxWidth: 320,
    minWidth: 280,
    minHeight: 56,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.28)',
    borderTopColor: '#fff',
    animation: 'ad-spinner-rotate 0.8s linear infinite',
    flexShrink: 0,
  },
  adCtaLabel: {
    display: 'inline-block',
    animation: 'ad-button-fade-in 0.24s ease',
  },
  resultHeader: {
    padding: '40px 24px 32px',
    textAlign: 'center',
  },
  namesRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  nameChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 20,
  },
  nameVs: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  percentText: { fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1 },
  gradeLabel: { fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 8, marginBottom: 4 },
  gradeDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  shareRow: { padding: '16px 16px 0' },
  shareBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    border: 'none',
    backgroundColor: '#fff',
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  detailSection: { padding: '20px 16px 0' },
  detailTitle: { fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, paddingLeft: 4 },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    border: '1.5px solid #eee',
    animation: 'result-card-raise 0.32s ease',
  },
  detailCardMatch: {
    borderColor: 'rgba(49,130,246,0.36)',
    boxShadow: '0 8px 22px rgba(49,130,246,0.08)',
  },
  detailCardMismatch: {
    borderColor: 'rgba(139,149,161,0.28)',
    boxShadow: '0 8px 18px rgba(15,23,42,0.04)',
  },
  detailHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  detailNum: { fontSize: 12, fontWeight: 700, color: '#3182F6' },
  detailQ: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 10, lineHeight: 1.4 },
  choiceRow: { display: 'flex', gap: 8 },
  choiceChip: {
    flex: 1,
    borderRadius: 12,
    padding: '10px 12px',
    border: '1px solid transparent',
  },
  choiceChipMe: {
    backgroundColor: '#EDF5FF',
    borderColor: 'rgba(49,130,246,0.12)',
  },
  choiceChipFriend: {
    backgroundColor: '#F5F6F8',
    borderColor: 'rgba(139,149,161,0.12)',
  },
  chipLabel: { fontSize: 11, color: '#6B7684', display: 'block', marginBottom: 4, fontWeight: 700 },
  chipText: { fontSize: 12, color: '#333', fontWeight: 500, lineHeight: 1.45 },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
  },
  homeBtn: {
    width: '100%',
    padding: 15,
    borderRadius: 14,
    border: 'none',
    backgroundColor: '#3182F6',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
  },
};
