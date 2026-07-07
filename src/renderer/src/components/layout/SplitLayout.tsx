import { type ReactNode } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import './SplitLayout.css'

interface SplitLayoutProps {
  left: ReactNode
  right: ReactNode
  defaultLeftSize?: number
  minLeftSize?: number
  minRightSize?: number
}

export function SplitLayout({
  left,
  right,
  defaultLeftSize = 50,
  minLeftSize = 30,
  minRightSize = 30
}: SplitLayoutProps): JSX.Element {
  return (
    <PanelGroup direction="horizontal" autoSaveId="qr-forge-layout" className="split-layout">
      <Panel defaultSize={defaultLeftSize} minSize={minLeftSize} className="split-layout__panel">
        <div className="split-layout__content">{left}</div>
      </Panel>
      <PanelResizeHandle className="split-layout__handle">
        <div className="split-layout__handle-bar" />
      </PanelResizeHandle>
      <Panel minSize={minRightSize} className="split-layout__panel">
        <div className="split-layout__content">{right}</div>
      </Panel>
    </PanelGroup>
  )
}
