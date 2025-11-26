export default function Composer({ value, onChange, onSend }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
        placeholder="Escreva uma mensagem..."
        style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
      />
      <button onClick={onSend} style={{ padding: '8px 12px' }}>Enviar</button>
    </div>
  );
}