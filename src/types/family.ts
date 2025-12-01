export interface Person {
  id: string
  name: string // Kept for backward compatibility, generated from name parts
  firstName?: string
  middleName?: string
  lastName?: string
  maidenName?: string
  preferredName?: string
  gender?: string
  birthDate?: string // ISO date string
  deathDate?: string // ISO date string
  notes?: string
  photo?: string // Base64 data URL or image URL
  parentIds: string[] // Array of parent IDs
  childIds: string[] // Array of child IDs
  partnerIds: string[] // Array of partner IDs
  spouseIds: string[] // Array of spouse IDs
}

export interface FamilyTree {
  version: string
  people: Person[]
}

export type RelationshipType = 'parent' | 'child' | 'partner' | 'spouse'
