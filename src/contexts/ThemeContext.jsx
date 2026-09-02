import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'notebook-theme'

function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function getStoredTheme() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    if (stored === 'system') return 'system'
  }
  return 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', getSystemTheme())
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const toggleTheme = () => {
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
    const next = effectiveTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const setMode = (mode) => {
    setTheme(mode)
  }

  const currentEffective = theme === 'system' ? getSystemTheme() : theme

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme: currentEffective, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
