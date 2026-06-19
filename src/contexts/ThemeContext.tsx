import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeCtx)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('fanni-theme') as Theme) || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('fanni-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>
      {children}
    </ThemeCtx.Provider>
  )
}
