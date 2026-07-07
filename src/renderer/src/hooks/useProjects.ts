import { useState, useCallback, useEffect } from 'react'
import type { ProjectConfig } from '../types/project'

const STORAGE_KEY = 'qr-forge-projects'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setProjects(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    }
  }, [projects, loading])

  const addProject = useCallback((project: ProjectConfig) => {
    setProjects((prev) => [project, ...prev])
  }, [])

  const updateProject = useCallback((id: string, updates: Partial<ProjectConfig>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    )
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getProject = useCallback(
    (id: string) => {
      return projects.find((p) => p.id === id)
    },
    [projects]
  )

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    getProject
  }
}
