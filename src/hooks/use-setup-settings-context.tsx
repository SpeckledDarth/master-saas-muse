'use client'

import { createContext, useContext } from 'react'
import { useSetupSettings } from './use-setup-settings'

type SetupSettingsContextType = ReturnType<typeof useSetupSettings>

const SetupSettingsContext = createContext<SetupSettingsContextType | null>(null)

export function SetupSettingsProvider({ children }: { children: React.ReactNode }) {
  const value = useSetupSettings()
  return (
    <SetupSettingsContext.Provider value={value}>
      {children}
    </SetupSettingsContext.Provider>
  )
}

export function useSetupSettingsContext(): SetupSettingsContextType {
  const context = useContext(SetupSettingsContext)
  if (!context) {
    throw new Error('useSetupSettingsContext must be used within SetupSettingsProvider')
  }
  return context
}
