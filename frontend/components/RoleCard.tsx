import StarBorder from '@/components/ui/StarBorder'

type RoleCardProps = {
  id: string
  icon: string
  label: string
  isSelected: boolean
  onSelect: (id: string) => void
}

export default function RoleCard({ id, icon, label, isSelected, onSelect }: RoleCardProps) {
  return (
    <StarBorder
      as="div"
      color={isSelected ? '#a78bfa' : '#ffffff'}
      speed="5s"
      thickness={1.5}
      className={`w-full rounded-2xl transition-all duration-300 ${
        isSelected ? 'scale-105 shadow-[0_0_24px_rgba(167,139,250,0.45)]' : 'hover:scale-[1.02]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={`w-full rounded-2xl border px-2 py-2 text-center text-xs transition-all ${
          isSelected
            ? 'border-white bg-white/15 text-white'
            : 'border-white/20 bg-white/5 text-white/70 hover:border-white/35 hover:text-white'
        }`}
      >
        <div className="text-base">{icon}</div>
        <div>{label}</div>
      </button>
    </StarBorder>
  )
}
