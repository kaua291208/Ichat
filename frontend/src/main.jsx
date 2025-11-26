import { createRoot } from 'react-dom/client';
import AllChats from './screens/allchats';

const mount = document.getElementById('root') || (() => {
  const d = document.createElement('div');
  d.id = 'root';
  document.body.appendChild(d);
  return d;
})();

createRoot(mount).render(<AllChats />);