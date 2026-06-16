import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx' // 1. استيراد المزود

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* 2. تغليف التطبيق بالكامل */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)