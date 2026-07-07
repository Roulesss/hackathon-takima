import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light'
  })

  const toggleTheme = (): void => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres">
      <div className="settings">
        <div className="settings__group">
          <label className="settings__label">Thème</label>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {theme === 'light' ? '☀️ Clair' : '🌙 Sombre'}
          </Button>
        </div>
        <div className="settings__group">
          <label className="settings__label">Emplacement des configurations</label>
          <input
            type="text"
            className="settings__input"
            placeholder="~/Documents/QR Forge/configs"
            readOnly
          />
        </div>
        <div className="settings__group">
          <label className="settings__label">Emplacement d'export par défaut</label>
          <input
            type="text"
            className="settings__input"
            placeholder="~/Documents/QR Forge/exports"
            readOnly
          />
        </div>
      </div>
    </Modal>
  )
}
