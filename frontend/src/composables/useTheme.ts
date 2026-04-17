import { ref } from 'vue'

export type ThemeName = 'cyberpunk-dark' | 'neon-plasma' | 'frosted-light' | 'minimal-dark'

export interface ThemeOption {
  value: ThemeName
  label: string
  description: string
}

export const themes: ThemeOption[] = [
  { value: 'cyberpunk-dark', label: 'Cyberpunk Dark', description: 'Neon blue glow, frosted dark panels' },
  { value: 'neon-plasma', label: 'Neon Plasma', description: 'Cyan/magenta on deep purple' },
  { value: 'frosted-light', label: 'Frosted Light', description: 'Clean white frosted glass' },
  { value: 'minimal-dark', label: 'Minimal Dark', description: 'Soft blue, solid panels' },
]

const STORAGE_KEY = 'fc_theme'
const currentTheme = ref<ThemeName>('cyberpunk-dark')

export function useTheme() {
  function setTheme(theme: ThemeName) {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }

  function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null
    setTheme(stored && themes.some(t => t.value === stored) ? stored : 'cyberpunk-dark')
  }

  return { currentTheme, setTheme, initTheme, themes }
}
