import { QrCode, CreditCard, FileImage, ArrowLeft } from 'lucide-react'
import { Card, IconButton } from '@renderer/components/common'
import './ActivityChoicePage.css'

interface ActivityChoicePageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
}

const activities = [
  {
    id: 'qr-code',
    icon: QrCode,
    title: 'Créer un QR Code',
    description: 'Générez un QR code personnalisable à partir d\'un lien',
    page: 'editor'
  },
  {
    id: 'business-card',
    icon: CreditCard,
    title: 'Carte de visite',
    description: 'Créez une carte de visite professionnelle avec QR code intégré',
    page: 'editor'
  },
  {
    id: 'document',
    icon: FileImage,
    title: 'Intégrer à un document',
    description: 'Ajoutez un QR code à une image ou un document PDF existant',
    page: 'editor'
  }
]

export function ActivityChoicePage({ onNavigate }: ActivityChoicePageProps): React.JSX.Element {
  return (
    <div className="activity-choice page-enter page-active">
      <div className="activity-choice__back">
        <IconButton
          icon={ArrowLeft}
          onClick={() => onNavigate('home')}
          tooltip="Retour"
          size="md"
        />
      </div>

      <div className="activity-choice__content">
        <h1 className="activity-choice__title">Que souhaitez-vous faire ?</h1>
        <p className="activity-choice__subtitle">Choisissez le type de projet à créer</p>

        <div className="activity-choice__grid">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <Card
                key={activity.id}
                hoverable
                padding="lg"
                className="activity-choice__card"
                onClick={() => onNavigate(activity.page, { activity: activity.id })}
              >
                <div className="activity-choice__icon-wrapper">
                  <Icon className="activity-choice__icon" />
                </div>
                <h2 className="activity-choice__card-title">{activity.title}</h2>
                <p className="activity-choice__card-desc">{activity.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
