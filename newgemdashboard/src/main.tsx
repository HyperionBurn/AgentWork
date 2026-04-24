import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// StrictMode disabled in production to avoid React 19 + motion library hook dispatcher issues
// on Vercel's SES lockdown environment
const root = document.getElementById('root')!;
if (import.meta.env.PROD) {
  createRoot(root).render(<App />);
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
