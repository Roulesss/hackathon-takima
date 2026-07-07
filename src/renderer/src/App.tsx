import { useState } from 'react'
import { HomePage, ActivityChoicePage, EditorPage, ScannerPage, ExportPage } from './pages'
import { useQrConfig } from './hooks'
import { useProjects } from './hooks'
import type { ActivityType } from './types'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/global.css'

export type PageId = 'home' | 'activity-choice' | 'editor' | 'scanner' | 'export'

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<PageId>('home')
  const [currentActivity, setCurrentActivity] = useState<ActivityType>('qr-code')
  const { config: qrConfig, setConfig: setQrConfig } = useQrConfig()
  const { projects, deleteProject, addProject } = useProjects()

  const [templateBytes, setTemplateBytes] = useState<Uint8Array | null>(null)
  const [templateMimeType, setTemplateMimeType] = useState<string>('application/pdf')
  const [templateOptions, setTemplateOptions] = useState({ x: 50, y: 50, size: 150, pageIndex: 0 })

  const navigate = (page: string, data?: Record<string, unknown>): void => {
    setCurrentPage(page as PageId)
    if (data?.activity) {
      setCurrentActivity(data.activity as ActivityType)
    }
    if (data?.config) {
      setQrConfig(data.config as any)
    } else if (data?.projectId) {
      const project = projects.find(p => p.id === data.projectId)
      if (project) {
        setQrConfig(project.qrConfig)
      }
    }
  }

  const renderPage = (): React.JSX.Element => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            projects={projects}
            onNavigate={navigate}
            onDeleteProject={deleteProject}
          />
        )
      case 'activity-choice':
        return <ActivityChoicePage onNavigate={navigate} />
      case 'editor':
        return (
          <EditorPage
            onNavigate={navigate}
            initialActivity={currentActivity}
            qrConfig={qrConfig}
            onConfigChange={setQrConfig}
            templateBytes={templateBytes}
            setTemplateBytes={setTemplateBytes}
            templateMimeType={templateMimeType}
            setTemplateMimeType={setTemplateMimeType}
            templateOptions={templateOptions}
            setTemplateOptions={setTemplateOptions}
            onSaveProject={addProject}
          />
        )
      case 'scanner':
        return <ScannerPage onNavigate={navigate} />
      case 'export':
        return (
          <ExportPage
            onNavigate={navigate}
            qrConfig={qrConfig}
            templateBytes={templateBytes}
            templateMimeType={templateMimeType}
            templateOptions={templateOptions}
          />
        )
      default:
        return (
          <HomePage
            projects={projects}
            onNavigate={navigate}
            onDeleteProject={deleteProject}
          />
        )
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ErrorBoundary>
        {renderPage()}
      </ErrorBoundary>
    </div>
  )
}

export default App
