import Folder from '@/components/Folder'

export default function RoleFolderCard({ role, isSelected, onSelect }) {
  return (
    <div
      className="role-folder-card"
      style={{
        border: `1px solid ${isSelected ? '#FFFFFF' : '#343636'}`,
        background: isSelected ? '#232424' : '#181919',
      }}
      onClick={() => onSelect(role.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(role.id)
        }
      }}
    >
      <Folder
        className="role-folder-visual"
        color={isSelected ? '#7d57ff' : '#5227FF'}
        size={1.45}
        maxItems={1}
        items={[
          <div key="paper-1" className="role-folder-paper role-folder-paper-content">
            <div className="role-folder-icon">{role.icon}</div>
            <div>
              <div className="role-folder-title">{role.label}</div>
              <div className="role-folder-desc">{role.desc}</div>
            </div>
          </div>,
        ]}
      />
    </div>
  )
}
