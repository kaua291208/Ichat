export default function ChatItem({ chat, onClick }) {
  return (
    <div onClick={() => onClick(chat)} style={{ padding: 12, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{chat.title}</strong>
        <small style={{ color: '#666' }}>{chat.lastAt ? new Date(chat.lastAt).toLocaleTimeString() : ''}</small>
      </div>
      <div style={{ color: '#444', marginTop: 6 }}>{chat.lastMessage || 'Sem mensagens'}</div>
    </div>
  );
}