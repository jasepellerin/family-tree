import type { FamilyTree, Person } from '../types/family'

const STORAGE_KEY = 'family-tree-data'
const CURRENT_VERSION = '1.0.0'

export const saveFamilyTree = (people: Person[]): void => {
  try {
    const familyTree: FamilyTree = {
      version: CURRENT_VERSION,
      people,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(familyTree))
    console.log(`Saved ${people.length} people to localStorage`)
  } catch (error) {
    console.error('Failed to save family tree to localStorage:', error)
    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Consider removing some photos or using a backend.')
    }
    throw new Error('Failed to save family tree data')
  }
}

export const loadFamilyTree = (): Person[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      console.log('No saved data found in localStorage')
      return []
    }

    const familyTree: FamilyTree = JSON.parse(data)

    // Validate structure
    if (!familyTree.people || !Array.isArray(familyTree.people)) {
      console.warn('Invalid family tree data structure, returning empty array')
      return []
    }

    // Ensure all people have required arrays and photo field
    const loaded = familyTree.people.map((person) => ({
      ...person,
      parentIds: person.parentIds || [],
      childIds: person.childIds || [],
      partnerIds: person.partnerIds || [],
      photo: person.photo || undefined,
    }))

    console.log(`Loaded ${loaded.length} people from localStorage`)
    return loaded
  } catch (error) {
    console.error('Failed to load family tree from localStorage:', error)
    // Return empty array on error to allow app to continue
    return []
  }
}

export const clearFamilyTree = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear family tree from localStorage:', error)
  }
}
