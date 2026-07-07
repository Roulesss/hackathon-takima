import { useState } from 'react'
import { Plus, Settings, QrCode, Trash2 } from 'lucide-react'
import { Button, IconButton, Card, Modal } from '@renderer/components/common'
import type { ProjectConfig } from '@renderer/types'
import './HomePage.css'

interface HomePageProps {
  projects: ProjectConfig[]
  onNavigate: (page: string, data?: Record<string, unknown>) => void
  onDeleteProject: (id: string) => void
}

export function HomePage({ projects, onNavigate, onDeleteProject }: HomePageProps): JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light'
  })

  const toggleTheme = (): void => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const formatDate = (dateStr: string): string => {
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  return (
    <div className="home page-enter page-active">
      <div className="home__content">
        <div className="home__header">
          <h1 className="home__title">QR Forge</h1>
          <p className="home__subtitle">Créez, personnalisez et exportez vos QR codes</p>
        </div>

        <div className="home__actions" style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Button
            variant="primary"
            size="lg"
            icon={Plus}
            onClick={() => onNavigate('activity-choice')}
          >
            Créer un nouveau projet
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={async () => {
              try {
                if (window.api && window.api.openFileDialog) {
                  const { canceled, filePaths } = await window.api.openFileDialog({
                    filters: [{ name: 'JSON', extensions: ['json'] }],
                    properties: ['openFile']
                  })
                  if (!canceled && filePaths.length > 0) {
                    const result = await window.api.readFile(filePaths[0])
                    if (result.success && result.data) {
                      const config = JSON.parse(result.data)
                      onNavigate('editor', { config, activity: 'qr-code' })
                    }
                  }
                } else {
                  // Fallback web
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        try {
                          const config = JSON.parse(ev.target?.result as string)
                          onNavigate('editor', { config, activity: 'qr-code' })
                        } catch (err) {
                          console.error(err)
                        }
                      }
                      reader.readAsText(file)
                    }
                  }
                  input.click()
                }
              } catch (err) {
                console.error(err)
              }
            }}
          >
            Ouvrir un projet...
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="home__section">
            <h2 className="home__section-title">Projets récents</h2>
            <div className="home__grid">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  hoverable
                  padding="sm"
                  className="home__project-card"
                  onClick={() => onNavigate('editor', { projectId: project.id, activity: project.activityType })}
                >
                  <div className="home__project-preview">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} />
                    ) : (
                      <QrCode className="home__project-placeholder" />
                    )}
                  </div>
                  <div className="home__project-info">
                    <span className="home__project-name">{project.name}</span>
                    <span className="home__project-date">{formatDate(project.updatedAt)}</span>
                  </div>
                  <button
                    className="home__project-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteProject(project.id)
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="home__empty">
            <QrCode className="home__empty-icon" />
            <p className="home__empty-text">Aucun projet récent</p>
            <p className="home__empty-hint">Créez votre premier QR code pour commencer</p>
          </div>
        )}
      </div>

      <IconButton
        icon={Settings}
        className="home__settings-btn"
        tooltip="Paramètres"
        size="lg"
        variant="subtle"
        onClick={() => setSettingsOpen(true)}
      />

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Paramètres">
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
    </div>
  )
}
