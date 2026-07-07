import { useState } from 'react'
import { HomePage, ActivityChoicePage, EditorPage, ScannerPage, ExportPage } from './pages'
import { useQrConfig } from './hooks'
import { useProjects } from './hooks'
import type { ActivityType, ProjectConfig } from './types'
import './styles/global.css'

export type PageId = 'home' | 'activity-choice' | 'editor' | 'scanner' | 'export'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<PageId>('home')
  const [currentActivity, setCurrentActivity] = useState<ActivityType>('qr-code')
  const { config: qrConfig, setConfig: setQrConfig } = useQrConfig()
  const { projects, addProject, deleteProject } = useProjects()

  const navigate = (page: string, data?: Record<string, unknown>): void => {
    setCurrentPage(page as PageId)
    if (data?.activity) {
      setCurrentActivity(data.activity as ActivityType)
    }
  }

  const renderPage = (): JSX.Element => {
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
          />
        )
      case 'scanner':
        return <ScannerPage onNavigate={navigate} />
      case 'export':
        return <ExportPage onNavigate={navigate} qrConfig={qrConfig} />
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

  return <div style={{ width: '100%', height: '100%' }}>{renderPage()}</div>
}

export default App
