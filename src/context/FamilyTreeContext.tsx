import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Person } from '../types/family'
import { loadFamilyTree, saveFamilyTree } from '../services/storage'

interface FamilyTreeContextType {
  people: Person[]
  addPerson: (person: Omit<Person, 'id'>) => Person
  updatePerson: (id: string, updates: Partial<Person>) => void
  deletePerson: (id: string) => void
  getPerson: (id: string) => Person | undefined
  addRelationship: (
    personId: string,
    relatedId: string,
    type: 'parent' | 'child' | 'partner' | 'spouse'
  ) => void
  removeRelationship: (
    personId: string,
    relatedId: string,
    type: 'parent' | 'child' | 'partner' | 'spouse'
  ) => void
}

const FamilyTreeContext = createContext<FamilyTreeContextType | undefined>(undefined)

export const useFamilyTree = () => {
  const context = useContext(FamilyTreeContext)
  if (!context) {
    throw new Error('useFamilyTree must be used within a FamilyTreeProvider')
  }
  return context
}

interface FamilyTreeProviderProps {
  children: ReactNode
}

export const FamilyTreeProvider = ({ children }: FamilyTreeProviderProps) => {
  // Initialize state directly from localStorage to avoid race condition
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const loaded = loadFamilyTree()
      console.log('Initial state loaded:', loaded.length, 'people')
      return loaded
    } catch (error) {
      console.error('Error loading initial state:', error)
      return []
    }
  })
  const isInitialMount = useRef(true)

  // Save to localStorage whenever people change (but not on initial mount)
  useEffect(() => {
    // Skip save on initial mount to avoid overwriting with empty array
    if (isInitialMount.current) {
      console.log('Skipping save - initial mount')
      isInitialMount.current = false
      return
    }
    console.log('Saving to localStorage:', people.length, 'people')
    saveFamilyTree(people)
  }, [people])

  const addPerson = (personData: Omit<Person, 'id'>): Person => {
    const newPerson: Person = {
      ...personData,
      id: crypto.randomUUID(),
      parentIds: personData.parentIds || [],
      childIds: personData.childIds || [],
      partnerIds: personData.partnerIds || [],
      spouseIds: personData.spouseIds || [],
    }
    setPeople((prev) => [...prev, newPerson])
    return newPerson
  }

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople((prev) =>
      prev.map((person) => (person.id === id ? { ...person, ...updates } : person))
    )
  }

  const deletePerson = (id: string) => {
    setPeople((prev) => {
      // Remove the person and clean up all relationships
      const updated = prev.filter((person) => person.id !== id)
      return updated.map((person) => ({
        ...person,
        parentIds: person.parentIds.filter((pid) => pid !== id),
        childIds: person.childIds.filter((cid) => cid !== id),
        partnerIds: person.partnerIds.filter((pid) => pid !== id),
        spouseIds: person.spouseIds.filter((sid) => sid !== id),
      }))
    })
  }

  const getPerson = (id: string): Person | undefined => {
    return people.find((person) => person.id === id)
  }

  const addRelationship = (
    personId: string,
    relatedId: string,
    type: 'parent' | 'child' | 'partner' | 'spouse'
  ) => {
    setPeople((prev) => {
      const updated = prev.map((person) => {
        if (person.id === personId) {
          const relationshipKey = `${type}Ids` as keyof Person
          const ids = (person[relationshipKey] as string[]) || []
          if (!ids.includes(relatedId)) {
            return {
              ...person,
              [relationshipKey]: [...ids, relatedId],
            }
          }
        }
        // Handle reciprocal relationships
        if (type === 'parent' && person.id === relatedId) {
          const childIds = person.childIds || []
          if (!childIds.includes(personId)) {
            return {
              ...person,
              childIds: [...childIds, personId],
            }
          }
        }
        if (type === 'child' && person.id === relatedId) {
          const parentIds = person.parentIds || []
          if (!parentIds.includes(personId)) {
            return {
              ...person,
              parentIds: [...parentIds, personId],
            }
          }
        }
        if (type === 'partner' && person.id === relatedId) {
          const partnerIds = person.partnerIds || []
          if (!partnerIds.includes(personId)) {
            return {
              ...person,
              partnerIds: [...partnerIds, personId],
            }
          }
        }
        if (type === 'spouse' && person.id === relatedId) {
          const spouseIds = person.spouseIds || []
          if (!spouseIds.includes(personId)) {
            return {
              ...person,
              spouseIds: [...spouseIds, personId],
            }
          }
        }
        return person
      })
      return updated
    })
  }

  const removeRelationship = (
    personId: string,
    relatedId: string,
    type: 'parent' | 'child' | 'partner' | 'spouse'
  ) => {
    setPeople((prev) => {
      const updated = prev.map((person) => {
        if (person.id === personId) {
          const relationshipKey = `${type}Ids` as keyof Person
          const ids = (person[relationshipKey] as string[]) || []
          return {
            ...person,
            [relationshipKey]: ids.filter((id) => id !== relatedId),
          }
        }
        // Handle reciprocal relationships
        if (type === 'parent' && person.id === relatedId) {
          return {
            ...person,
            childIds: person.childIds.filter((id) => id !== personId),
          }
        }
        if (type === 'child' && person.id === relatedId) {
          return {
            ...person,
            parentIds: person.parentIds.filter((id) => id !== personId),
          }
        }
        if (type === 'partner' && person.id === relatedId) {
          return {
            ...person,
            partnerIds: person.partnerIds.filter((id) => id !== personId),
          }
        }
        if (type === 'spouse' && person.id === relatedId) {
          return {
            ...person,
            spouseIds: person.spouseIds.filter((id) => id !== personId),
          }
        }
        return person
      })
      return updated
    })
  }

  return (
    <FamilyTreeContext.Provider
      value={{
        people,
        addPerson,
        updatePerson,
        deletePerson,
        getPerson,
        addRelationship,
        removeRelationship,
      }}
    >
      {children}
    </FamilyTreeContext.Provider>
  )
}
