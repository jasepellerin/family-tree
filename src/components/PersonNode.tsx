import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import type { Person } from '../types/family'
import { format } from 'date-fns'

interface PersonNodeData {
  person: Person
  onNodeClick: (personId: string) => void
  onAddParent?: (personId: string) => void
  onAddChild?: (personId: string) => void
}

export const PersonNode = memo(({ data, selected }: NodeProps<PersonNodeData>) => {
  const { person, onNodeClick, onAddParent, onAddChild } = data

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
      <Handle
        type="target"
        position={Position.Top}
        className="!w-6 !h-6 cursor-pointer hover:!bg-indigo-600 transition-colors border-2 border-white shadow-md"
        style={{
          backgroundColor: '#4b5563',
          top: '-12px',
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (onAddParent) {
            onAddParent(person.id)
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - 2.4px)',
            left: 'calc(50% + .2px)',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: '1',
            pointerEvents: 'none',
          }}
        >
          +
        </div>
      </Handle>

      <div className="text-center">
        {person.photo ? (
          <div className="mb-2 flex justify-center">
            <img
              src={person.photo}
              alt={person.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          </div>
        ) : (
          <div className="mb-2 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs font-semibold">
                {person.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
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
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-6 !h-6 cursor-pointer hover:!bg-indigo-600 transition-colors border-2 border-white shadow-md"
        style={{
          backgroundColor: '#4b5563',
          bottom: '-12px',
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (onAddChild) {
            onAddChild(person.id)
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - 2.4px)',
            left: 'calc(50% + .2px)',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: '1',
            pointerEvents: 'none',
          }}
        >
          +
        </div>
      </Handle>
    </div>
  )
})

PersonNode.displayName = 'PersonNode'
