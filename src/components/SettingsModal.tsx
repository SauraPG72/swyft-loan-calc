"use client"

import React, { useState } from 'react'
import { Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTheme, ThemeSettings } from '@/contexts/ThemeContext'

const popularFonts = [
  'Raleway',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Source Sans Pro',
  'Nunito',
  'Ubuntu'
]

export function SettingsModal() {
  const { theme, updateTheme, resetTheme } = useTheme()
  const [localTheme, setLocalTheme] = useState<ThemeSettings>(theme)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    updateTheme(localTheme)
    setIsOpen(false)
  }

  const handleReset = () => {
    resetTheme()
    setLocalTheme({
      primaryColor: '#1e293b',
      secondaryColor: '#475569',
      font: 'Raleway'
    })
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Reset local state to current theme when opening
      setLocalTheme(theme)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-6 right-6 z-50 bg-black backdrop-blur-sm border-black-700 text-white hover:bg-black-800/90 shadow-lg"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-theme-primary/95 backdrop-blur-xl border-theme-secondary/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Theme Settings</DialogTitle>
          <DialogDescription className="text-theme-secondary/80">
            Customize the appearance of your application.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Primary Color */}
          <div className="grid gap-2">
            <Label htmlFor="primaryColor" className="text-sm font-medium">
              Primary Color
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="primaryColor"
                type="color"
                value={localTheme.primaryColor}
                onChange={(e) => setLocalTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-16 h-10 p-1 bg-theme-secondary/50 border-theme-secondary"
              />
              <Input
                type="text"
                value={localTheme.primaryColor}
                onChange={(e) => setLocalTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#1e293b"
                className="flex-1 bg-theme-secondary/50 border-theme-secondary text-white placeholder:text-theme-secondary/70"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="grid gap-2">
            <Label htmlFor="secondaryColor" className="text-sm font-medium">
              Secondary Color
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="secondaryColor"
                type="color"
                value={localTheme.secondaryColor}
                onChange={(e) => setLocalTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-16 h-10 p-1 bg-theme-secondary/50 border-theme-secondary"
              />
              <Input
                type="text"
                value={localTheme.secondaryColor}
                onChange={(e) => setLocalTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                placeholder="#475569"
                className="flex-1 bg-theme-secondary/50 border-theme-secondary text-white placeholder:text-theme-secondary/70"
              />
            </div>
          </div>

          {/* Font Selection */}
          <div className="grid gap-2">
            <Label htmlFor="font" className="text-sm font-medium">
              Font Family
            </Label>
            <select
              id="font"
              value={localTheme.font}
              onChange={(e) => setLocalTheme(prev => ({ ...prev, font: e.target.value }))}
              className="w-full h-10 px-3 py-1 bg-theme-secondary/50 border border-theme-secondary rounded-md text-white focus:border-theme-secondary focus:outline-none focus:ring-2 focus:ring-theme-secondary/50"
            >
              {popularFonts.map((font) => (
                <option key={font} value={font} className="bg-theme-primary">
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div 
              className="p-4 rounded-lg border border-theme-secondary bg-theme-secondary/30"
              style={{ 
                fontFamily: localTheme.font,
                backgroundColor: `${localTheme.primaryColor}20`,
                borderColor: localTheme.secondaryColor
              }}
            >
              <div 
                className="text-sm font-medium mb-2"
                style={{ color: localTheme.primaryColor }}
              >
                Primary Color Text
              </div>
              <div 
                className="text-sm"
                style={{ color: localTheme.secondaryColor }}
              >
                Secondary Color Text with {localTheme.font} font
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="bg-theme-secondary/50 border-theme-secondary text-white hover:bg-theme-secondary/70"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-theme-secondary/50 border-theme-secondary text-white hover:bg-theme-secondary/70"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              style={{ 
                backgroundColor: localTheme.primaryColor,
                color: 'white'
              }}
              className="hover:opacity-90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 