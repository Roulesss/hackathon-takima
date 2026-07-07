import type { LucideIcon } from 'lucide-react'
import './Tabs.css'

interface Tab {
  id: string
  label: string
  icon?: LucideIcon
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps): React.JSX.Element {
  return (
    <div className="tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {Icon && <Icon className="tabs__icon" />}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
