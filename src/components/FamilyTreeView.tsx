import { useMemo, memo } from 'react'
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
const HorizontalEdge = memo(({ source, target }: EdgeProps) => {
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
})

HorizontalEdge.displayName = 'HorizontalEdge'

const edgeTypes = {
  horizontal: HorizontalEdge,
}

// Find all connected components in the graph (based on parent-child and spouse/partner relationships)
const findConnectedComponents = (people: Person[]): Person[][] => {
  const visited = new Set<string>()
  const components: Person[][] = []

  const dfs = (personId: string, component: Person[]) => {
    if (visited.has(personId)) return
    visited.add(personId)

    const person = people.find((p) => p.id === personId)
    if (!person) return

    component.push(person)

    // Traverse parent-child relationships (bidirectional)
    person.parentIds.forEach((parentId) => {
      if (!visited.has(parentId)) {
        dfs(parentId, component)
      }
    })
    person.childIds.forEach((childId) => {
      if (!visited.has(childId)) {
        dfs(childId, component)
      }
    })

    // Traverse spouse/partner relationships (bidirectional)
    const allPartners = [...person.partnerIds, ...person.spouseIds]
    allPartners.forEach((partnerId) => {
      if (!visited.has(partnerId)) {
        dfs(partnerId, component)
      }
    })
  }

  people.forEach((person) => {
    if (!visited.has(person.id)) {
      const component: Person[] = []
      dfs(person.id, component)
      if (component.length > 0) {
        components.push(component)
      }
    }
  })

  return components
}

// Entitree-flex based hierarchical layout
const calculateLayout = (people: Person[]): { nodes: Node[]; edges: Edge[] } => {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  const nodeWidth = 180
  const nodeHeight = 120

  // Find all connected components
  const components = findConnectedComponents(people)

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

  // Layout each component separately and combine them
  const allNodes: Node[] = []
  const allEdges: Edge[] = []
  let currentXOffset = 0
  const componentSpacing = 400 // Horizontal spacing between disconnected components

  components.forEach((component) => {
    // Find root node for this component (person with no parents, or first person)
    const rootNodes = component.filter((person) => person.parentIds.length === 0)
    const rootId = rootNodes.length > 0 ? rootNodes[0].id : component[0].id

    // Run entitree-flex layout for this component
    // Create a set of person IDs in this component for quick lookup
    const componentPersonIds = new Set(component.map((p) => p.id))

    const componentTreeMap: Record<string, EntitreeNode> = {}
    component.forEach((person) => {
      // Filter spouses to only include those in the same component
      const filteredSpouses = treeMap[person.id].spouses.filter((spouseId) =>
        componentPersonIds.has(spouseId)
      )

      componentTreeMap[person.id] = {
        ...treeMap[person.id],
        spouses: filteredSpouses,
      }
    })

    const layoutResult = layoutFromMap(rootId, componentTreeMap, {
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

    // Create a map of laid-out nodes by ID
    const laidOutNodesMap = new Map<string, TreeNode<EntitreeNode>>()
    layoutResult.nodes.forEach((node) => {
      laidOutNodesMap.set(node.id as string, node)
    })

    // Helper function to check if a position collides with existing nodes
    const isPositionOccupied = (x: number, y: number, excludeId?: string): boolean => {
      const padding = 10 // Small padding to avoid tight overlaps
      for (const node of laidOutNodesMap.values()) {
        if (excludeId && node.id === excludeId) continue
        const nodeRight = node.x + nodeWidth
        const nodeBottom = node.y + nodeHeight
        const checkRight = x + nodeWidth
        const checkBottom = y + nodeHeight

        // Check if rectangles overlap
        if (
          x < nodeRight + padding &&
          checkRight > node.x - padding &&
          y < nodeBottom + padding &&
          checkBottom > node.y - padding
        ) {
          return true
        }
      }
      return false
    }

    // Helper function to find an available position near a target position
    const findAvailablePosition = (
      targetX: number,
      targetY: number,
      preferHorizontal: boolean = false
    ): { x: number; y: number } => {
      if (!isPositionOccupied(targetX, targetY)) {
        return { x: targetX, y: targetY }
      }

      // Try positions around the target
      const offsets = preferHorizontal
        ? [
            { x: nodeWidth + 150, y: 0 }, // Right
            { x: -(nodeWidth + 150), y: 0 }, // Left
            { x: nodeWidth + 150, y: nodeHeight + 200 }, // Right and down
            { x: -(nodeWidth + 150), y: nodeHeight + 200 }, // Left and down
          ]
        : [
            { x: 0, y: nodeHeight + 200 }, // Below
            { x: nodeWidth + 150, y: 0 }, // Right
            { x: -(nodeWidth + 150), y: 0 }, // Left
            { x: 0, y: -(nodeHeight + 200) }, // Above
          ]

      for (const offset of offsets) {
        const newX = targetX + offset.x
        const newY = targetY + offset.y
        if (!isPositionOccupied(newX, newY)) {
          return { x: newX, y: newY }
        }
      }

      // If all nearby positions are occupied, find the rightmost position
      if (laidOutNodesMap.size > 0) {
        const allNodes = Array.from(laidOutNodesMap.values())
        const maxX = Math.max(...allNodes.map((n) => n.x + nodeWidth))
        return { x: maxX + nodeWidth + 150, y: targetY }
      }

      return { x: targetX, y: targetY }
    }

    // Find people in component that weren't included in the layout
    // Use iterative approach to include all connected people
    let missingPeople = component.filter((person) => !laidOutNodesMap.has(person.id))

    // Keep adding missing people until all are included
    while (missingPeople.length > 0) {
      const newlyAdded: string[] = []

      missingPeople.forEach((person) => {
        let position = { x: 0, y: 0 }
        let foundConnection = false

        // First, try to position based on parent-child relationships (vertical)
        // Check if any parent is laid out - position below parent
        for (const parentId of person.parentIds) {
          const parentNode = laidOutNodesMap.get(parentId)
          if (parentNode) {
            // Position below parent, but check for other parents of the same children
            const targetY = parentNode.y + nodeHeight + 200 // sourceTargetSpacing
            // Check if there are other parents of this person's children at this level
            const childrenAtThisLevel = person.childIds
              .map((childId) => laidOutNodesMap.get(childId))
              .filter((node) => node !== undefined)
            if (childrenAtThisLevel.length > 0) {
              // Position at the same Y as the child's other parents
              const childY = childrenAtThisLevel[0]!.y - nodeHeight - 200
              position = findAvailablePosition(parentNode.x, childY, false)
            } else {
              position = findAvailablePosition(parentNode.x, targetY, false)
            }
            foundConnection = true
            break
          }
        }

        // If no parent found, check if any child is laid out - position above child
        if (!foundConnection) {
          for (const childId of person.childIds) {
            const childNode = laidOutNodesMap.get(childId)
            if (childNode) {
              // Position above child, but check for other parents
              const targetY = childNode.y - nodeHeight - 200 // sourceTargetSpacing
              // Check if this child has other parents already laid out at this level
              const child = component.find((p) => p.id === childId)
              if (child) {
                const otherParents = child.parentIds
                  .filter((pid) => pid !== person.id)
                  .map((pid) => laidOutNodesMap.get(pid))
                  .filter((node) => node !== undefined)
                if (otherParents.length > 0) {
                  // Position horizontally next to other parents
                  const rightmostParent = otherParents.reduce(
                    (rightmost, node) => {
                      return node && (!rightmost || node.x > rightmost.x) ? node : rightmost
                    },
                    null as TreeNode<EntitreeNode> | null
                  )
                  if (rightmostParent) {
                    position = findAvailablePosition(
                      rightmostParent.x + nodeWidth + 150,
                      rightmostParent.y,
                      true
                    )
                  } else {
                    position = findAvailablePosition(childNode.x, targetY, false)
                  }
                } else {
                  position = findAvailablePosition(childNode.x, targetY, false)
                }
              } else {
                position = findAvailablePosition(childNode.x, targetY, false)
              }
              foundConnection = true
              break
            }
          }
        }

        // If no parent/child found, try to position near a partner/spouse (horizontal)
        if (!foundConnection) {
          const allPartners = [...person.partnerIds, ...person.spouseIds]
          for (const partnerId of allPartners) {
            const partnerNode = laidOutNodesMap.get(partnerId)
            if (partnerNode) {
              // Position to the right of the partner
              position = findAvailablePosition(partnerNode.x + nodeWidth + 150, partnerNode.y, true)
              foundConnection = true
              break
            }
          }
        }

        // If still no connection found, position at a default location
        if (!foundConnection) {
          if (laidOutNodesMap.size > 0) {
            const allNodes = Array.from(laidOutNodesMap.values())
            const maxX = Math.max(...allNodes.map((n) => n.x + nodeWidth))
            const maxY = Math.max(...allNodes.map((n) => n.y))
            position = findAvailablePosition(maxX + nodeWidth + 150, maxY, false)
          } else {
            position = { x: 0, y: 0 }
          }
        }

        // Add the missing person as a node
        laidOutNodesMap.set(person.id, {
          id: person.id,
          person,
          x: position.x,
          y: position.y,
          width: nodeWidth,
          height: nodeHeight,
        } as TreeNode<EntitreeNode>)

        newlyAdded.push(person.id)
      })

      // Update missing people list - exclude newly added and check for any new connections
      missingPeople = component.filter((person) => !laidOutNodesMap.has(person.id))
    }

    // Find the width of this component to position the next one
    let componentWidth = 0
    if (laidOutNodesMap.size > 0) {
      const allXValues = Array.from(laidOutNodesMap.values()).map((n) => n.x + nodeWidth)
      componentWidth = Math.max(...allXValues)
    }

    // Convert all nodes (including missing ones) to React Flow nodes with offset
    const componentNodes: Node[] = Array.from(laidOutNodesMap.values()).map(
      (treeNode: TreeNode<EntitreeNode>) => {
        const person = treeNode.person
        return {
          id: treeNode.id as string,
          type: 'person',
          position: { x: treeNode.x + currentXOffset, y: treeNode.y },
          data: {
            person,
            onNodeClick: () => {
              // This will be set by the parent component
            },
          },
        }
      }
    )

    allNodes.push(...componentNodes)

    // Update offset for next component
    currentXOffset += componentWidth + componentSpacing
  })

  // Create a set of node IDs that actually exist in the layout
  const nodeIds = new Set(allNodes.map((node) => node.id))

  // Create React Flow edges for parent-child relationships
  // Only create edges if both nodes exist in the layout
  people.forEach((person) => {
    if (!nodeIds.has(person.id)) return

    person.childIds.forEach((childId) => {
      if (nodeIds.has(childId)) {
        allEdges.push({
          id: `edge-${person.id}-${childId}`,
          source: person.id,
          target: childId,
          type: 'smoothstep',
          animated: false,
        })
      }
    })
  })

  // Create edges for partner/spouse relationships (horizontal dashed lines)
  // Only create edges if both nodes exist in the layout
  people.forEach((person) => {
    if (!nodeIds.has(person.id)) return

    const allPartners = [...person.partnerIds, ...person.spouseIds]
    allPartners.forEach((partnerId) => {
      if (person.id < partnerId && nodeIds.has(partnerId)) {
        allEdges.push({
          id: `edge-partner-${person.id}-${partnerId}`,
          source: person.id,
          target: partnerId,
          type: 'horizontal',
          animated: false,
        })
      }
    })
  })

  return { nodes: allNodes, edges: allEdges }
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
