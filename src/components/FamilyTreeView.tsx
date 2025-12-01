import { useMemo } from 'react'
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import dagre from 'dagre'
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

// Clean dagre-based hierarchical layout
const calculateLayout = (people: Person[]): { nodes: Node[]; edges: Edge[] } => {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  const nodeWidth = 180
  const nodeHeight = 120

  // Create dagre graph
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 250,
    ranksep: 200,
    marginx: 50,
    marginy: 50,
  })

  // Add nodes to dagre graph
  people.forEach((person) => {
    graph.setNode(person.id, { width: nodeWidth, height: nodeHeight })
  })

  // Add parent-child edges (directed, these define the hierarchy)
  people.forEach((person) => {
    person.childIds.forEach((childId) => {
      graph.setEdge(person.id, childId)
    })
  })

  // Run dagre layout
  dagre.layout(graph)

  // Extract positions from dagre and create React Flow nodes
  const nodes: Node[] = graph.nodes().map((nodeId) => {
    const node = graph.node(nodeId)
    const person = people.find((p) => p.id === nodeId)!
    return {
      id: nodeId,
      type: 'person',
      position: { x: node.x - nodeWidth / 2, y: node.y - nodeHeight / 2 },
      data: {
        person,
        onNodeClick: () => {
          // This will be set by the parent component
        },
      },
    }
  })

  // Create React Flow edges for parent-child relationships
  const edges: Edge[] = []
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

  // Create edges for partner/spouse relationships (dashed lines)
  people.forEach((person) => {
    const allPartners = [...person.partnerIds, ...person.spouseIds]
    allPartners.forEach((partnerId) => {
      if (person.id < partnerId) {
        edges.push({
          id: `edge-partner-${person.id}-${partnerId}`,
          source: person.id,
          target: partnerId,
          type: 'straight',
          style: { stroke: '#9ca3af', strokeWidth: 2, strokeDasharray: '5,5' },
          animated: false,
        })
      }
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
