"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface ThemeSettings {
  primaryColor: string
  secondaryColor: string
  font: string
}

interface ThemeContextType {
  theme: ThemeSettings
  updateTheme: (newTheme: Partial<ThemeSettings>) => void
  resetTheme: () => void
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#1e293b', // slate-800
  secondaryColor: '#475569', // slate-600  
  font: 'Raleway'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme)
        setTheme({ ...defaultTheme, ...parsedTheme })
      } catch (error) {
        console.error('Error parsing saved theme:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Apply theme to CSS custom properties
    const root = document.documentElement
    
    // Convert hex colors to RGB for better CSS variable usage
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    const primaryRgb = hexToRgb(theme.primaryColor)
    const secondaryRgb = hexToRgb(theme.secondaryColor)

    if (primaryRgb) {
      root.style.setProperty('--theme-primary', `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`)
      root.style.setProperty('--theme-primary-foreground', '255 255 255')
    }

    if (secondaryRgb) {
      root.style.setProperty('--theme-secondary', `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}`)
      root.style.setProperty('--theme-secondary-foreground', '255 255 255')
    }

    // Apply font
    root.style.setProperty('--theme-font', theme.font)
    
    // Update body font
    document.body.style.fontFamily = `${theme.font}, sans-serif`
  }, [theme])

  const updateTheme = (newTheme: Partial<ThemeSettings>) => {
    const updatedTheme = { ...theme, ...newTheme }
    setTheme(updatedTheme)
    localStorage.setItem('app-theme', JSON.stringify(updatedTheme))
  }

  const resetTheme = () => {
    setTheme(defaultTheme)
    localStorage.setItem('app-theme', JSON.stringify(defaultTheme))
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 