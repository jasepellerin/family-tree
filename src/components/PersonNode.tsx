import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { Person } from '../types/family'
import { format } from 'date-fns'

interface PersonNodeData {
  person: Person
  onNodeClick: (personId: string) => void
}

export const PersonNode = memo(({ data, selected }: NodeProps<PersonNodeData>) => {
  const { person, onNodeClick } = data

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return null
    }
  }

  const birthDateFormatted = formatDate(person.birthDate)
  const deathDateFormatted = formatDate(person.deathDate)

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 p-3 min-w-[180px] cursor-pointer transition-all ${
        selected ? 'border-indigo-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onNodeClick(person.id)}
    >
      {/* Top handle for parent connections */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="text-center">
        <div className="font-semibold text-gray-800 text-sm mb-1">{person.name}</div>
        {birthDateFormatted && (
          <div className="text-xs text-gray-600">
            {birthDateFormatted}
            {deathDateFormatted && ` - ${deathDateFormatted}`}
          </div>
        )}
        {!birthDateFormatted && deathDateFormatted && (
          <div className="text-xs text-gray-600">d. {deathDateFormatted}</div>
        )}
      </div>

      {/* Bottom handle for child connections */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
})

PersonNode.displayName = 'PersonNode'
