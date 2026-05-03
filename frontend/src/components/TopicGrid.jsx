/**
 * TopicGrid — toggle-selectable topic cards in a 2-column grid.
 * Props: topics (array of topic objects), selected (array of ids), onToggle (fn), columns (number)
 */
import MagicBento from '@/components/ui/MagicBento'

export default function TopicGrid({
  topics = [],
  selected = [],
  onToggle,
  columns = 2,
}) {
  const bentoItems = topics.map((topic) => ({
    id: topic.id,
    title: topic.name || topic.id,
    description: topic.prerequisite
      ? `${topic.description}\nRequires: ${topic.prerequisite}`
      : topic.description,
  }))

  return (
    <MagicBento
      className={`onboarding-topic-bento ${columns === 1 ? 'onboarding-topic-bento--single-col' : ''}`}
      items={bentoItems}
      textAutoHide={false}
      enableStars={true}
      enableSpotlight={true}
      enableBorderGlow={true}
      enableTilt={false}
      enableMagnetism={false}
      clickEffect={true}
      particleCount={8}
      spotlightRadius={280}
      glowColor="132, 0, 255"
      disableAnimations={false}
      onItemClick={(item) => onToggle && onToggle(item.id)}
      isItemSelected={(item) => selected.includes(item.id)}
    />
  )
}
