import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import AuthGate from './AuthGate'
import { AuthProvider } from './lib/auth'
import './styles/index.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode><AuthProvider><AuthGate><App /></AuthGate></AuthProvider></StrictMode>,
)
