import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { MyRoom } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getTopicById } from '../data/topics';

type Tab = 'sent' | 'received';

export default function MyRoomsPage() {
  const navigate = useNavigate();
  const { userKey } = useAuth();
  const [sent, setSent] = useState<MyRoom[]>([]);
  const [received, setReceived] = useState<MyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('sent');
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!userKey) { navigate('/'); return; }
    api.getMyRooms(userKey)
      .then(data => { setSent(data.sent); setReceived(data.received); })
      .catch(() => { setSent([]); setReceived([]); })
      .finally(() => setLoading(false));
  }, [userKey, navigate]);

  async function handleDelete(shortCode: string) {
    if (!userKey) return;
    if (!confirm('이 초대를 삭제할까요?')) return;
    setDeletingCode(shortCode);
    try {
      await api.deleteRoom(shortCode, userKey);
      setSent(prev => prev.filter(r => r.shortCode !== shortCode));
    } catch {
      alert('삭제에 실패했어요.');
    } finally {
      setDeletingCode(null);
    }
  }

  function handleTap(room: MyRoom) {
    if (room.status === 'COMPLETE') navigate(`/result/${room.shortCode}`);
    else if (tab === 'sent') navigate(`/invite/${room.shortCode}`);
    else alert('아직 결과가 나오지 않았어요. 상대방이 답변을 완료하면 결과를 확인할 수 있어요.');
  }

  const list = tab === 'sent' ? sent : received;

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={{ fontSize: 14, color: '#999' }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 탭 (헤더 없이 바로) */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === 'sent' ? styles.tabActive : {}) }}
          onClick={() => setTab('sent')}
        >
          보낸 초대 {sent.length > 0 && <span style={styles.badge}>{sent.length}</span>}
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'received' ? styles.tabActive : {}) }}
          onClick={() => setTab('received')}
        >
          받은 초대 {received.length > 0 && <span style={styles.badge}>{received.length}</span>}
        </button>
      </div>

      {list.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyEmoji}>{tab === 'sent' ? '📮' : '📬'}</p>
          <p style={styles.emptyText}>
            {tab === 'sent' ? '아직 보낸 초대가 없어요' : '아직 받은 초대가 없어요'}
          </p>
          {tab === 'sent' && (
            <button style={styles.startBtn} onClick={() => navigate('/')}>시작하기</button>
          )}
        </div>
      ) : (
        <div style={styles.list}>
          {list.map(room => (
            <RoomCard
              key={room.shortCode}
              room={room}
              isSent={tab === 'sent'}
              onTap={() => handleTap(room)}
              onDelete={tab === 'sent' ? () => handleDelete(room.shortCode) : undefined}
              deleting={deletingCode === room.shortCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomCard({
  room, isSent, onTap, onDelete, deleting,
}: {
  room: MyRoom;
  isSent: boolean;
  onTap: () => void;
  onDelete?: () => void;
  deleting: boolean;
}) {
  const topic = room.topicId ? getTopicById(room.topicId) : null;
  const isComplete = room.status === 'COMPLETE';
  const isExpired = new Date() > new Date(room.expiresAt);

  const topicLabel = room.isCustom ? '✏️ 커스텀' : topic ? `${topic.emoji} ${topic.name}` : '알 수 없음';
  const dateStr = new Date(room.createdAt).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const relationLabel = isSent
    ? (room.otherName ? `→ ${room.otherName}` : '→ 아직 참여 없음')
    : (room.otherName ? `← ${room.otherName}` : '← 익명');

  const tapHint = isExpired ? '만료된 초대예요'
    : isComplete ? '탭해서 결과 보기'
    : isSent ? '탭해서 초대 화면 보기'
    : '아직 상대방이 답변 중이에요';

  return (
    <div style={{ ...styles.card, opacity: isExpired ? 0.55 : 1 }}>
      <button
        style={styles.cardBtn}
        onClick={isExpired ? undefined : onTap}
        disabled={isExpired}
      >
        {/* 1행: 주제 + 상태 */}
        <div style={styles.row1}>
          <span style={styles.topicLabel}>{topicLabel}</span>
          <StatusBadge isComplete={isComplete} isExpired={isExpired} />
        </div>

        {/* 2행: 상대방 이름 */}
        <div style={styles.row2}>
          <span style={styles.relationLabel}>{relationLabel}</span>
        </div>

        {/* 3행: 코드 + 날짜 */}
        <div style={styles.row3}>
          <span style={styles.shortCode}>{room.shortCode}</span>
          <span style={styles.date}>{dateStr}</span>
        </div>

        {/* 하단 힌트 */}
        {tapHint && (
          <p style={{ ...styles.tapHint, color: isExpired ? '#ccc' : isComplete ? '#3182F6' : '#bbb' }}>
            {tapHint}
          </p>
        )}
      </button>

      {onDelete && (
        <div style={styles.deleteRow}>
          <button
            style={{ ...styles.deleteBtn, opacity: deleting ? 0.4 : 1 }}
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ isComplete, isExpired }: { isComplete: boolean; isExpired: boolean }) {
  if (isExpired) return <span style={{ ...styles.badge2, backgroundColor: '#f0f0f0', color: '#aaa' }}>만료</span>;
  if (isComplete) return <span style={{ ...styles.badge2, backgroundColor: '#E8F5E9', color: '#2E7D32' }}>완료</span>;
  return <span style={{ ...styles.badge2, backgroundColor: '#EBF3FF', color: '#3182F6' }}>대기 중</span>;
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 32 },
  center: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  tabs: {
    display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0',
  },
  tab: {
    flex: 1, padding: '16px 0', fontSize: 14, fontWeight: 600,
    color: '#bbb', background: 'none', border: 'none', borderBottom: '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tabActive: { color: '#3182F6', borderBottom: '2px solid #3182F6' },
  badge: {
    backgroundColor: '#3182F6', color: '#fff', fontSize: 11, fontWeight: 700,
    borderRadius: 10, padding: '1px 6px',
  },

  list: { padding: '14px 16px 0' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
  },
  cardBtn: {
    width: '100%', padding: '16px 18px', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer',
  },

  row1: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  topicLabel: { fontSize: 16, fontWeight: 700, color: '#111' },
  badge2: { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, flexShrink: 0 },

  row2: { marginBottom: 10 },
  relationLabel: { fontSize: 13, color: '#888', fontWeight: 500 },

  row3: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  shortCode: { fontSize: 18, fontWeight: 800, color: '#3182F6', letterSpacing: 3 },
  date: { fontSize: 12, color: '#ccc' },

  tapHint: { fontSize: 11, marginTop: 8, fontWeight: 500 },

  deleteRow: { borderTop: '1px solid #f5f5f5' },
  deleteBtn: {
    width: '100%', padding: '11px 18px', background: 'none', border: 'none',
    fontSize: 13, color: '#FF4444', cursor: 'pointer', textAlign: 'left',
  },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: 'calc(100dvh - 60px)', padding: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#999', marginBottom: 24 },
  startBtn: {
    padding: '14px 32px', borderRadius: 14, border: 'none',
    backgroundColor: '#3182F6', fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
  },
};
