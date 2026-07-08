import { useState, useCallback, useRef, useEffect } from 'react'

export interface UndoRedoOptions {
  maxHistorySize?: number
  debounceMs?: number
}

export function useUndoRedo<T>(
  currentState: T,
  onStateChange: (newState: T) => void,
  options?: UndoRedoOptions
) {
  const [history, setHistory] = useState<T[]>([currentState])
  const [pointer, setPointer] = useState<number>(0)
  const isUndoRedo = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false
      return
    }

    const pushState = () => {
      setHistory(prev => {
        // Shallow comparison via JSON to avoid pushing identical states
        if (JSON.stringify(prev[pointer]) === JSON.stringify(currentState)) {
          return prev
        }
        let newHistory = prev.slice(0, pointer + 1)
        newHistory.push(currentState)
        
        if (options?.maxHistorySize && newHistory.length > options.maxHistorySize) {
          newHistory = newHistory.slice(newHistory.length - options.maxHistorySize)
        }
        
        setPointer(newHistory.length - 1)
        return newHistory
      })
    }

    if (options?.debounceMs) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(pushState, options.debounceMs)
    } else {
      pushState()
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [currentState, pointer, options?.maxHistorySize, options?.debounceMs])

  const undo = useCallback(() => {
    if (pointer > 0) {
      isUndoRedo.current = true
      const prevState = history[pointer - 1]
      setPointer(pointer - 1)
      onStateChange(prevState)
    }
  }, [pointer, history, onStateChange])

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      isUndoRedo.current = true
      const nextState = history[pointer + 1]
      setPointer(pointer + 1)
      onStateChange(nextState)
    }
  }, [pointer, history, onStateChange])

  return { undo, redo, canUndo: pointer > 0, canRedo: pointer < history.length - 1 }
}
