import ChatItem from './chatitem';

export default function ChatList({ chats = [], onSelect }) {
  if (!chats.length) {
    return <div style={{ padding: 16, color: '#666' }}>Nenhum chat</div>;
  }
  return (
    <div>
      {chats.map(c => <ChatItem key={c.id} chat={c} onClick={onSelect} />)}
    </div>
  );
}