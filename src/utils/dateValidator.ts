const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const isValidISODate = (dateString: string): boolean => {
  if (!dateString || !dateString.trim()) {
    return false
  }

  if (!ISO_DATE_REGEX.test(dateString)) {
    return false
  }

  const [year, month, day] = dateString.split('-').map(Number)
  
  if (year < 1 || year > 9999) {
    return false
  }
  
  if (month < 1 || month > 12) {
    return false
  }
  
  if (day < 1 || day > 31) {
    return false
  }

  const date = new Date(year, month - 1, day)
  
  if (isNaN(date.getTime())) {
    return false
  }

  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false
  }

  return true
}

export const validateDateRange = (birthDate?: string, deathDate?: string): string | null => {
  if (!birthDate && !deathDate) {
    return null
  }

  if (birthDate && !isValidISODate(birthDate)) {
    return null
  }

  if (deathDate && !isValidISODate(deathDate)) {
    return null
  }

  if (birthDate && deathDate) {
    const birth = new Date(birthDate)
    const death = new Date(deathDate)
    
    if (birth >= death) {
      return 'Birth date must be before death date'
    }
  }

  return null
}

