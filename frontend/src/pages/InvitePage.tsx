import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { share, getTossShareLink } from '@apps-in-toss/web-framework';

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'we-balance-game';

export default function InvitePage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(shortCode ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`초대 코드: ${shortCode}`);
    }
  }

  async function handleShare() {
    try {
      const link = await getTossShareLink(`intoss://${APP_NAME}/join/${shortCode}`);
      await share({ message: link });
    } catch {
      try {
        const deepLink = `intoss://${APP_NAME}/join/${shortCode}`;
        await navigator.clipboard.writeText(deepLink);
        alert('링크가 복사됐어요! 카톡으로 붙여넣기 해서 보내보세요.');
      } catch {
        alert(`친구에게 이 코드를 알려주세요: ${shortCode}`);
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.emoji}>✅</div>
        <h2 style={styles.title}>내 답변 완료!</h2>
        <p style={styles.desc}>
          이제 친구에게 초대장을 보내세요.<br />
          친구가 다 풀면 함께 결과를 확인할 수 있어요.
        </p>

        {/* 초대코드 — 클릭 시 클립보드 복사 */}
        <button style={styles.codeCard} onClick={handleCopyCode}>
          <p style={styles.codeLabel}>초대 코드 (탭하면 복사)</p>
          <p style={styles.code}>{shortCode}</p>
          <p style={styles.codeHint}>
            {copied ? '✅ 복사됐어요!' : '친구가 코드를 직접 입력해서 들어올 수 있어요'}
          </p>
        </button>

        <button style={styles.shareBtn} onClick={handleShare}>
          <span style={styles.shareIcon}>💬</span>
          카카오톡으로 초대장 보내기
        </button>

        {/* replace: true → 결과 화면에서 뒤로가기 시 홈으로 이동 */}
        <button style={styles.waitBtn} onClick={() => navigate(`/waiting/${shortCode}?role=A`, { replace: true })}>
          친구 기다리기
        </button>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh', backgroundColor: '#f4f4f4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  content: { width: '100%', maxWidth: 360, textAlign: 'center' },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 8 },
  desc: { fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 20 },
  codeCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: '16px 24px',
    marginBottom: 16, border: '2px solid #3182F6', cursor: 'pointer',
    textAlign: 'center',
  },
  codeLabel: { fontSize: 11, color: '#3182F6', fontWeight: 600, marginBottom: 6 },
  code: { fontSize: 26, fontWeight: 900, color: '#3182F6', letterSpacing: 6, marginBottom: 4 },
  codeHint: { fontSize: 11, color: '#bbb' },
  shareBtn: {
    width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none',
    backgroundColor: '#FEE500', fontSize: 16, fontWeight: 700, color: '#3C1E1E',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  shareIcon: { fontSize: 20 },
  waitBtn: {
    width: '100%', padding: '14px 20px', borderRadius: 16,
    border: '1.5px solid #ddd', backgroundColor: '#fff',
    fontSize: 15, color: '#555', cursor: 'pointer',
  },
};
