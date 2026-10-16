import React, { useLayoutEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import App from './App'
import './styles.css'

const root = document.getElementById('root')!
function PortfolioReady() {
  // Reveal only after React has replaced the SEO fallback, before the browser paints.
  useLayoutEffect(() => { root.removeAttribute('data-prerender') }, [])
  return <App />
}
ReactDOM.createRoot(root).render(
  <React.StrictMode><MotionConfig reducedMotion="user"><PortfolioReady /></MotionConfig></React.StrictMode>,
)
