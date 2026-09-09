import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme === 'dark' || savedTheme === 'jade' ? savedTheme : 'light';
document.documentElement.classList.add(initialTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
