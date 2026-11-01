import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/700.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/main.scss';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Không tìm thấy phần tử #root trong index.html');
}

createRoot(container).render(
  <StrictMode>
    <div className="p-5 text-center">
      <h1 className="h3">Tin tức 24h</h1>
    </div>
  </StrictMode>,
);
