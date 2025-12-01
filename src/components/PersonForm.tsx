import { useState, useEffect } from 'react'
import type { Person } from '../types/family'
import { format } from 'date-fns'
import { useFamilyTree } from '../context/FamilyTreeContext'

interface PersonFormProps {
  person?: Person
  onSubmit: (data: Omit<Person, 'id' | 'parentIds' | 'childIds' | 'partnerIds'>) => void
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
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<string>('')
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<'parent' | 'child' | 'partner'>('parent')

  useEffect(() => {
    if (person) {
      setName(person.name)
      setBirthDate(person.birthDate ? format(new Date(person.birthDate), 'yyyy-MM-dd') : '')
      setDeathDate(person.deathDate ? format(new Date(person.deathDate), 'yyyy-MM-dd') : '')
      setNotes(person.notes || '')
      setPhoto(person.photo || '')
    } else {
      // Reset form for new person
      setName('')
      setBirthDate('')
      setDeathDate('')
      setNotes('')
      setPhoto('')
    }
  }, [person])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Name is required')
      return
    }

    onSubmit({
      name: name.trim(),
      birthDate: birthDate || undefined,
      deathDate: deathDate || undefined,
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
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date
          </label>
          <input
            type="date"
            id="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700 mb-1">
            Death Date
          </label>
          <input
            type="date"
            id="deathDate"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
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
                    setRelationshipType(e.target.value as 'parent' | 'child' | 'partner')
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="partner">Partner</option>
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
                          <span className="text-sm text-gray-700">{parent.name}</span>
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
                          <span className="text-sm text-gray-700">{child.name}</span>
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
                          <span className="text-sm text-gray-700">{partner.name}</span>
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
