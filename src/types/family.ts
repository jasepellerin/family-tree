export interface Person {
  id: string
  name: string
  birthDate?: string // ISO date string
  deathDate?: string // ISO date string
  notes?: string
  parentIds: string[] // Array of parent IDs
  childIds: string[] // Array of child IDs
  partnerIds: string[] // Array of partner/spouse IDs
}

export interface FamilyTree {
  version: string
  people: Person[]
}

export type RelationshipType = 'parent' | 'child' | 'partner'
