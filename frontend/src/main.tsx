import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import i18n from './i18n'
import App from './App.tsx'
import { loadConfig } from '@/lib/config'

// Sync html lang attribute
document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

const root = createRoot(document.getElementById('root')!)

loadConfig().then(
  () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  },
  () => {
    root.render(
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        {i18n.t('errors.configLoadFailed')}
      </div>,
    )
  },
)
