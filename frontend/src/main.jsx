import { createRoot } from 'react-dom/client';
import App from './screens/App';

const mount = document.getElementById('root') || (() => {
  const d = document.createElement('div');
  d.id = 'root';
  document.body.appendChild(d);
  return d;
})();

createRoot(mount).render(<App />);