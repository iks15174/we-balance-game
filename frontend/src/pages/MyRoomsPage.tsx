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
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>← 홈</button>
        <h1 style={styles.title}>초대 현황</h1>
        <div style={{ width: 48 }} />
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === 'sent' ? styles.tabActive : {}) }}
          onClick={() => setTab('sent')}
        >
          내가 보낸 초대 {sent.length > 0 && <span style={styles.badge}>{sent.length}</span>}
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'received' ? styles.tabActive : {}) }}
          onClick={() => setTab('received')}
        >
          내가 받은 초대 {received.length > 0 && <span style={styles.badge}>{received.length}</span>}
        </button>
      </div>

      {list.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyEmoji}>{tab === 'sent' ? '📮' : '📬'}</p>
          <p style={styles.emptyText}>
            {tab === 'sent' ? '아직 보낸 초대가 없어요' : '아직 받은 초대가 없어요'}
          </p>
          {tab === 'sent' && (
            <button style={styles.startBtn} onClick={() => navigate('/')}>게임 시작하기</button>
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
  const dateStr = new Date(room.createdAt).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const directionLabel = isSent
    ? (room.otherName ? `→ ${room.otherName}` : '내가 초대함')
    : (room.otherName ? `← ${room.otherName}` : '초대받음');
  const tapHint = isExpired ? null
    : isComplete ? '탭하면 결과 보기 →'
    : isSent ? '탭하면 초대 화면 →'
    : null;

  return (
    <div style={styles.card}>
      <button style={styles.cardMain} onClick={isExpired ? undefined : onTap} disabled={isExpired}>
        <div style={styles.cardTop}>
          <div style={styles.topLeft}>
            <span style={styles.dirTag}>{directionLabel}</span>
            <span style={styles.topicLabel}>{topicLabel}</span>
          </div>
          <StatusBadge isComplete={isComplete} isExpired={isExpired} />
        </div>
        <div style={styles.cardBottom}>
          <span style={styles.shortCode}>{room.shortCode}</span>
          <span style={styles.date}>{dateStr}</span>
        </div>
        {tapHint && <p style={styles.tapHint}>{tapHint}</p>}
      </button>
      {onDelete && (
        <button
          style={{ ...styles.deleteBtn, opacity: deleting ? 0.5 : 1 }}
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? '...' : '삭제'}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ isComplete, isExpired }: { isComplete: boolean; isExpired: boolean }) {
  if (isExpired) return <span style={{ ...styles.statusBadge, backgroundColor: '#eee', color: '#999' }}>만료</span>;
  if (isComplete) return <span style={{ ...styles.statusBadge, backgroundColor: '#E8F5E9', color: '#2E7D32' }}>완료 ✅</span>;
  return <span style={{ ...styles.statusBadge, backgroundColor: '#FFF8E1', color: '#F57F17' }}>대기 중 ⏳</span>;
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100dvh', backgroundColor: '#f4f4f4', paddingBottom: 32 },
  center: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: '16px', borderBottom: '1px solid #f0f0f0',
  },
  backBtn: { fontSize: 14, color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' },
  title: { fontSize: 17, fontWeight: 700, color: '#111' },
  tabs: {
    display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0',
  },
  tab: {
    flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 600,
    color: '#bbb', background: 'none', border: 'none', borderBottom: '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  tabActive: { color: '#111', borderBottom: '2px solid #FFC500' },
  badge: {
    backgroundColor: '#FFC500', color: '#111', fontSize: 11, fontWeight: 700,
    borderRadius: 10, padding: '1px 6px',
  },
  list: { padding: '12px 16px 0' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex',
  },
  cardMain: { flex: 1, padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  topLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  dirTag: { fontSize: 11, color: '#aaa', fontWeight: 500 },
  topicLabel: { fontSize: 15, fontWeight: 700, color: '#111' },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, flexShrink: 0 },
  cardBottom: { display: 'flex', alignItems: 'center', gap: 10 },
  shortCode: { fontSize: 18, fontWeight: 800, color: '#FFC500', letterSpacing: 3 },
  date: { fontSize: 12, color: '#ccc' },
  tapHint: { fontSize: 11, color: '#ccc', marginTop: 6 },
  deleteBtn: {
    padding: '0 16px', background: 'none', border: 'none',
    borderLeft: '1px solid #f0f0f0', fontSize: 13, color: '#FF4444', cursor: 'pointer', flexShrink: 0,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: 'calc(100dvh - 120px)', padding: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#999', marginBottom: 24 },
  startBtn: {
    padding: '14px 32px', borderRadius: 14, border: 'none',
    backgroundColor: '#FFC500', fontSize: 15, fontWeight: 700, color: '#111', cursor: 'pointer',
  },
};
