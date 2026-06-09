export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem('wp-theme') as Theme) ?? 'light'
}

export function setTheme(theme: Theme) {
  localStorage.setItem('wp-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function initTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'dark') document.documentElement.classList.add('dark')
}