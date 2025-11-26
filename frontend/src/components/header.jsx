export default function Header({ title, onBack, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '12px 16px',
      borderBottom: '1px solid #eee', background: '#fff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onBack && <button onClick={onBack} style={{ padding: 6 }}>←</button>}
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <div>{right}</div>
    </div>
  );
}