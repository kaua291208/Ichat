export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div style={{ padding: 12 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}