import type { Person } from '../types/family'

/**
 * Formats a person's name as: First Preferred Last (Maiden)
 */
export const formatPersonName = (person: Person): string => {
  const parts: string[] = []

  // First name
  if (person.firstName) {
    parts.push(person.firstName)
  }

  // Preferred name (if different from first name)
  if (person.preferredName && person.preferredName !== person.firstName) {
    parts.push(person.preferredName)
  }

  // Last name
  if (person.lastName) {
    parts.push(person.lastName)
  }

  // Maiden name (in parentheses at the end if different from last name)
  if (person.maidenName && person.maidenName !== person.lastName) {
    parts.push(`(${person.maidenName})`)
  }

  // Fallback to old name field if no name parts exist (backward compatibility)
  if (parts.length === 0) {
    return person.name || 'Unknown'
  }

  return parts.join(' ')
}

/**
 * Gets the initial for display (preferred name, first name, or old name)
 */
export const getPersonInitial = (person: Person): string => {
  if (person.preferredName) {
    return person.preferredName.charAt(0).toUpperCase()
  }
  if (person.firstName) {
    return person.firstName.charAt(0).toUpperCase()
  }
  if (person.name) {
    return person.name.charAt(0).toUpperCase()
  }
  return '?'
}

