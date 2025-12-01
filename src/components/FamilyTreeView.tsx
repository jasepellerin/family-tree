import { useMemo } from 'react'
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import { useFamilyTree } from '../context/FamilyTreeContext'
import { PersonNode } from './PersonNode'
import type { Person } from '../types/family'

interface FamilyTreeViewProps {
  onNodeClick: (personId: string) => void
  onAddParent?: (personId: string) => void
  onAddChild?: (personId: string) => void
}

const nodeTypes = {
  person: PersonNode,
}

// Simple hierarchical layout algorithm
const calculateLayout = (people: Person[]): { nodes: Node[]; edges: Edge[] } => {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  const horizontalSpacing = 250
  const verticalSpacing = 200

  // Find root nodes (people with no parents)
  const rootNodes = people.filter((person) => person.parentIds.length === 0)

  // If no root nodes, use the first person as root
  const roots = rootNodes.length > 0 ? rootNodes : [people[0]]

  const nodes: Node[] = []
  const edges: Edge[] = []
  const visited = new Set<string>()
  const positions = new Map<string, { x: number; y: number }>()

  // BFS to assign levels
  const levelMap = new Map<string, number>()
  const queue: { person: Person; level: number }[] = roots.map((p) => ({ person: p, level: 0 }))

  while (queue.length > 0) {
    const { person, level } = queue.shift()!
    if (visited.has(person.id)) continue

    visited.add(person.id)
    levelMap.set(person.id, level)

    // Add children to queue
    person.childIds.forEach((childId) => {
      const child = people.find((p) => p.id === childId)
      if (child && !visited.has(childId)) {
        queue.push({ person: child, level: level + 1 })
      }
    })
  }

  // Group by level
  const levelGroups = new Map<number, Person[]>()
  people.forEach((person) => {
    const level = levelMap.get(person.id) ?? 0
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)!.push(person)
  })

  // Calculate positions
  levelGroups.forEach((persons, level) => {
    const y = level * verticalSpacing
    const totalWidth = persons.length * horizontalSpacing
    const startX = -totalWidth / 2 + horizontalSpacing / 2

    persons.forEach((person, index) => {
      const x = startX + index * horizontalSpacing
      positions.set(person.id, { x, y })

      nodes.push({
        id: person.id,
        type: 'person',
        position: { x, y },
        data: {
          person,
          onNodeClick: () => {
            // This will be set by the parent component
          },
        },
      })
    })
  })

  // Create edges for parent-child relationships
  people.forEach((person) => {
    person.childIds.forEach((childId) => {
      edges.push({
        id: `edge-${person.id}-${childId}`,
        source: person.id,
        target: childId,
        type: 'smoothstep',
        animated: false,
      })
    })
  })

  return { nodes, edges }
}

const FamilyTreeViewInner = ({ onNodeClick, onAddParent, onAddChild }: FamilyTreeViewProps) => {
  const { people } = useFamilyTree()

  const { nodes, edges } = useMemo(() => {
    const layout = calculateLayout(people)
    // Update handlers in node data
    layout.nodes.forEach((node) => {
      node.data.onNodeClick = onNodeClick
      node.data.onAddParent = onAddParent
      node.data.onAddChild = onAddChild
    })
    return layout
  }, [people, onNodeClick, onAddParent, onAddChild])

  if (people.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">No people in your family tree yet.</p>
          <p className="text-gray-500">Click "Add Person" to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export const FamilyTreeView = (props: FamilyTreeViewProps) => {
  return (
    <ReactFlowProvider>
      <FamilyTreeViewInner {...props} />
    </ReactFlowProvider>
  )
}
