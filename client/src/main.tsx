import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/700.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/main.scss';
import { store } from '@/store';
import { router } from '@/router';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Không tìm thấy phần tử #root trong index.html');
}

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
