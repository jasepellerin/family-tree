import { useState, useEffect } from 'react'
import type { Person } from '../types/family'
import { useFamilyTree } from '../context/FamilyTreeContext'
import { formatPersonName } from '../utils/nameFormatter'
import { isValidISODate, validateDateRange } from '../utils/dateValidator'

interface PersonFormProps {
  person?: Person
  onSubmit: (
    data: Omit<Person, 'id' | 'parentIds' | 'childIds' | 'partnerIds' | 'spouseIds'>
  ) => void
  onCancel: () => void
  onDelete?: () => void
  relationshipHint?: string
}

export const PersonForm = ({
  person,
  onSubmit,
  onCancel,
  onDelete,
  relationshipHint,
}: PersonFormProps) => {
  const { people, addRelationship, removeRelationship, getPerson } = useFamilyTree()
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [maidenName, setMaidenName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<string>('')
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<
    'parent' | 'child' | 'partner' | 'spouse'
  >('parent')
  const [birthDateError, setBirthDateError] = useState<string | null>(null)
  const [deathDateError, setDeathDateError] = useState<string | null>(null)

  useEffect(() => {
    if (person) {
      // Handle backward compatibility: if no firstName/lastName, try to parse from name
      if (!person.firstName && !person.lastName && person.name) {
        // Simple parsing: assume "First Last" or just "Name"
        const nameParts = person.name.trim().split(/\s+/)
        if (nameParts.length > 1) {
          setFirstName(nameParts[0])
          setLastName(nameParts.slice(1).join(' '))
        } else {
          setFirstName(nameParts[0] || '')
        }
      } else {
        setFirstName(person.firstName || '')
        setLastName(person.lastName || '')
      }
      setMiddleName(person.middleName || '')
      setMaidenName(person.maidenName || '')
      setPreferredName(person.preferredName || '')
      setGender(person.gender || '')
      setBirthDate(person.birthDate || '')
      setDeathDate(person.deathDate || '')
      setNotes(person.notes || '')
      setPhoto(person.photo || '')
    } else {
      // Reset form for new person
      setFirstName('')
      setMiddleName('')
      setLastName('')
      setMaidenName('')
      setPreferredName('')
      setGender('')
      setBirthDate('')
      setDeathDate('')
      setNotes('')
      setPhoto('')
    }
  }, [person])

  const formatDateInput = (
    value: string,
    cursorPos: number
  ): { formatted: string; newCursorPos: number } => {
    const beforeCursor = value.slice(0, cursorPos)
    const digitsBefore = beforeCursor.replace(/\D/g, '').length
    const allDigits = value.replace(/\D/g, '')

    let formatted = ''
    let newCursorPos = cursorPos

    if (allDigits.length <= 4) {
      formatted = allDigits
      newCursorPos = digitsBefore
    } else if (allDigits.length <= 6) {
      formatted = `${allDigits.slice(0, 4)}-${allDigits.slice(4)}`
      newCursorPos = digitsBefore <= 4 ? digitsBefore : digitsBefore + 1
    } else {
      formatted = `${allDigits.slice(0, 4)}-${allDigits.slice(4, 6)}-${allDigits.slice(6, 8)}`
      if (digitsBefore <= 4) {
        newCursorPos = digitsBefore
      } else if (digitsBefore <= 6) {
        newCursorPos = digitsBefore + 1
      } else {
        newCursorPos = Math.min(digitsBefore + 2, formatted.length)
      }
    }

    return { formatted, newCursorPos }
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const value = input.value
    const cursorPos = input.selectionStart || 0

    const { formatted, newCursorPos } = formatDateInput(value, cursorPos)
    setBirthDate(formatted)

    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)

    if (birthDateError) {
      if (!formatted.trim()) {
        setBirthDateError(null)
        if (deathDate && isValidISODate(deathDate)) {
          setDeathDateError(null)
        }
      } else if (isValidISODate(formatted)) {
        const rangeError = validateDateRange(formatted, deathDate)
        if (!rangeError) {
          setBirthDateError(null)
          if (deathDate && isValidISODate(deathDate)) {
            setDeathDateError(null)
          }
        }
      }
    }
  }

  const handleDeathDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const value = input.value
    const cursorPos = input.selectionStart || 0

    const { formatted, newCursorPos } = formatDateInput(value, cursorPos)
    setDeathDate(formatted)

    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)

    if (deathDateError) {
      if (!formatted.trim()) {
        setDeathDateError(null)
        if (birthDate && isValidISODate(birthDate)) {
          setBirthDateError(null)
        }
      } else if (isValidISODate(formatted)) {
        const rangeError = validateDateRange(birthDate, formatted)
        if (!rangeError) {
          setDeathDateError(null)
          if (birthDate && isValidISODate(birthDate)) {
            setBirthDateError(null)
          }
        }
      }
    }
  }

  const validateBirthDate = () => {
    if (!birthDate.trim()) {
      setBirthDateError(null)
      if (deathDate && isValidISODate(deathDate)) {
        setDeathDateError(null)
      }
      return
    }

    if (!isValidISODate(birthDate)) {
      setBirthDateError('Invalid date format. Use YYYY-MM-DD')
      return
    }

    const rangeError = validateDateRange(birthDate, deathDate)
    if (rangeError) {
      setBirthDateError(rangeError)
      if (deathDate && isValidISODate(deathDate)) {
        setDeathDateError(rangeError)
      }
      return
    }

    setBirthDateError(null)
    if (deathDate && isValidISODate(deathDate)) {
      setDeathDateError(null)
    }
  }

  const validateDeathDate = () => {
    if (!deathDate.trim()) {
      setDeathDateError(null)
      if (birthDate && isValidISODate(birthDate)) {
        setBirthDateError(null)
      }
      return
    }

    if (!isValidISODate(deathDate)) {
      setDeathDateError('Invalid date format. Use YYYY-MM-DD')
      return
    }

    const rangeError = validateDateRange(birthDate, deathDate)
    if (rangeError) {
      setDeathDateError(rangeError)
      if (birthDate && isValidISODate(birthDate)) {
        setBirthDateError(rangeError)
      }
      return
    }

    setDeathDateError(null)
    if (birthDate && isValidISODate(birthDate)) {
      setBirthDateError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Require at least first name or last name
    if (!firstName.trim() && !lastName.trim()) {
      alert('First name or last name is required')
      return
    }

    // Validate dates
    validateBirthDate()
    validateDeathDate()

    if (birthDateError || deathDateError) {
      return
    }

    if (birthDate && !isValidISODate(birthDate)) {
      setBirthDateError('Invalid date format. Use YYYY-MM-DD')
      return
    }

    if (deathDate && !isValidISODate(deathDate)) {
      setDeathDateError('Invalid date format. Use YYYY-MM-DD')
      return
    }

    const rangeError = validateDateRange(birthDate || undefined, deathDate || undefined)
    if (rangeError) {
      if (birthDate) {
        setBirthDateError(rangeError)
      } else {
        setDeathDateError(rangeError)
      }
      return
    }

    // Generate name for backward compatibility
    const nameParts: string[] = []
    if (firstName) nameParts.push(firstName)
    if (preferredName && preferredName !== firstName) nameParts.push(preferredName)
    if (lastName) nameParts.push(lastName)
    if (maidenName && maidenName !== lastName) nameParts.push(`(${maidenName})`)
    const generatedName = nameParts.join(' ') || firstName || lastName || 'Unknown'

    onSubmit({
      name: generatedName,
      firstName: firstName.trim() || undefined,
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      maidenName: maidenName.trim() || undefined,
      preferredName: preferredName.trim() || undefined,
      gender: gender.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      deathDate: deathDate.trim() || undefined,
      notes: notes.trim() || undefined,
      photo: photo || undefined,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {person ? 'Edit Person' : 'Add Person'}
      </h2>
      {relationshipHint && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-800">{relationshipHint}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="preferredName" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Name
            </label>
            <input
              type="text"
              id="preferredName"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
            Middle Name
          </label>
          <input
            type="text"
            id="middleName"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="maidenName" className="block text-sm font-medium text-gray-700 mb-1">
              Maiden Name
            </label>
            <input
              type="text"
              id="maidenName"
              value={maidenName}
              onChange={(e) => setMaidenName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select gender...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date
          </label>
          <input
            type="text"
            id="birthDate"
            value={birthDate}
            onChange={handleBirthDateChange}
            onBlur={validateBirthDate}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              birthDateError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {birthDateError && <p className="mt-1 text-sm text-red-600">{birthDateError}</p>}
        </div>

        <div>
          <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700 mb-1">
            Death Date
          </label>
          <input
            type="text"
            id="deathDate"
            value={deathDate}
            onChange={handleDeathDateChange}
            onBlur={validateDeathDate}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              deathDateError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {deathDateError && <p className="mt-1 text-sm text-red-600">{deathDateError}</p>}
        </div>

        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
            Photo
          </label>
          <div className="space-y-2">
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Check file size (limit to 2MB to avoid localStorage issues)
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Image size must be less than 2MB')
                    return
                  }
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setPhoto(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            {photo && (
              <div className="relative">
                <img
                  src={photo}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setPhoto('')}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Relationships Section */}
        {person && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Relationships</h3>

            {/* Add Relationship */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={relationshipType}
                  onChange={(e) =>
                    setRelationshipType(e.target.value as 'parent' | 'child' | 'partner' | 'spouse')
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="partner">Partner</option>
                  <option value="spouse">Spouse</option>
                </select>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select person...</option>
                  {people
                    .filter((p) => p.id !== person.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPersonId) {
                      addRelationship(person.id, selectedPersonId, relationshipType)
                      setSelectedPersonId('')
                    }
                  }}
                  disabled={!selectedPersonId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Display Relationships */}
            <div className="space-y-3">
              {/* Parents */}
              {person.parentIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Parents</h4>
                  <div className="space-y-1">
                    {person.parentIds.map((parentId) => {
                      const parent = getPerson(parentId)
                      return parent ? (
                        <div
                          key={parentId}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="text-sm text-gray-700">{formatPersonName(parent)}</span>
                          <button
                            type="button"
                            onClick={() => removeRelationship(person.id, parentId, 'parent')}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Children */}
              {person.childIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Children</h4>
                  <div className="space-y-1">
                    {person.childIds.map((childId) => {
                      const child = getPerson(childId)
                      return child ? (
                        <div
                          key={childId}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="text-sm text-gray-700">{formatPersonName(child)}</span>
                          <button
                            type="button"
                            onClick={() => removeRelationship(person.id, childId, 'child')}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Partners */}
              {person.partnerIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Partners</h4>
                  <div className="space-y-1">
                    {person.partnerIds.map((partnerId) => {
                      const partner = getPerson(partnerId)
                      return partner ? (
                        <div
                          key={partnerId}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="text-sm text-gray-700">{formatPersonName(partner)}</span>
                          <button
                            type="button"
                            onClick={() => removeRelationship(person.id, partnerId, 'partner')}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Spouses */}
              {person.spouseIds && person.spouseIds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Spouses</h4>
                  <div className="space-y-1">
                    {person.spouseIds.map((spouseId) => {
                      const spouse = getPerson(spouseId)
                      return spouse ? (
                        <div
                          key={spouseId}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="text-sm text-gray-700">{formatPersonName(spouse)}</span>
                          <button
                            type="button"
                            onClick={() => removeRelationship(person.id, spouseId, 'spouse')}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {person ? 'Update' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          {person && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
