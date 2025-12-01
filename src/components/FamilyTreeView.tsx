import { useMemo } from 'react'
import ReactFlow, { Background, Controls, ReactFlowProvider, BaseEdge, useNodes } from 'reactflow'
import type { Node, Edge, EdgeProps } from 'reactflow'
import { layoutFromMap } from 'entitree-flex'
import type { TreeNode } from 'entitree-flex'
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

// Custom horizontal edge for partners/spouses
const HorizontalEdge = ({ source, target }: EdgeProps) => {
  const nodes = useNodes()
  const sourceNode = nodes.find((n) => n.id === source)
  const targetNode = nodes.find((n) => n.id === target)

  if (!sourceNode || !targetNode) {
    return null
  }

  // Get node center positions
  const nodeWidth = 180
  const nodeHeight = 120
  const sourceCenterX = sourceNode.position.x + nodeWidth / 2
  const sourceCenterY = sourceNode.position.y + nodeHeight / 2
  const targetCenterX = targetNode.position.x + nodeWidth / 2
  const targetCenterY = targetNode.position.y + nodeHeight / 2

  // Calculate midpoint Y (they should be on same level)
  const midY = (sourceCenterY + targetCenterY) / 2

  // Determine which node is left and which is right
  const leftX = Math.min(sourceCenterX, targetCenterX)
  const rightX = Math.max(sourceCenterX, targetCenterX)

  // Calculate connection points (right side of left node, left side of right node)
  const leftNodeRight = leftX + nodeWidth / 2
  const rightNodeLeft = rightX - nodeWidth / 2

  // Create horizontal path
  const edgePath = `M ${leftNodeRight} ${midY} L ${rightNodeLeft} ${midY}`

  return (
    <g>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: '#9ca3af',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        }}
      />
    </g>
  )
}

const edgeTypes = {
  horizontal: HorizontalEdge,
}

// Entitree-flex based hierarchical layout
const calculateLayout = (people: Person[]): { nodes: Node[]; edges: Edge[] } => {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  const nodeWidth = 180
  const nodeHeight = 120

  // Find root nodes (people with no parents)
  const rootNodes = people.filter((person) => person.parentIds.length === 0)
  const rootId = rootNodes.length > 0 ? rootNodes[0].id : people[0].id

  // Convert Person[] to entitree-flex map format
  interface EntitreeNode {
    id: string
    person: Person
    width: number
    height: number
    children: string[]
    parents: string[]
    spouses: string[]
  }

  const treeMap: Record<string, EntitreeNode> = {}
  people.forEach((person) => {
    const allPartners = [...person.partnerIds, ...person.spouseIds]
    treeMap[person.id] = {
      id: person.id,
      person,
      width: nodeWidth,
      height: nodeHeight,
      children: person.childIds,
      parents: person.parentIds,
      spouses: allPartners,
    }
  })

  // Run entitree-flex layout
  const layoutResult = layoutFromMap(rootId, treeMap, {
    orientation: 'vertical',
    nodeWidth,
    nodeHeight,
    firstDegreeSpacing: 250, // Spacing between siblings (partners)
    secondDegreeSpacing: 250, // Spacing between different families
    sourceTargetSpacing: 200, // Vertical spacing between levels
    nextAfterSpacing: 150, // Spacing for spouses/partners (reduced for tighter grouping)
    targetsAccessor: 'children',
    sourcesAccessor: 'parents',
    nextAfterAccessor: 'spouses',
  })

  // Convert entitree-flex nodes to React Flow nodes
  const nodes: Node[] = layoutResult.nodes.map((treeNode: TreeNode<EntitreeNode>) => {
    const person = treeNode.person
    return {
      id: treeNode.id as string,
      type: 'person',
      position: { x: treeNode.x, y: treeNode.y },
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

  // Create edges for partner/spouse relationships (horizontal dashed lines)
  people.forEach((person) => {
    const allPartners = [...person.partnerIds, ...person.spouseIds]
    allPartners.forEach((partnerId) => {
      if (person.id < partnerId) {
        edges.push({
          id: `edge-partner-${person.id}-${partnerId}`,
          source: person.id,
          target: partnerId,
          type: 'horizontal',
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
        edgeTypes={edgeTypes}
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
