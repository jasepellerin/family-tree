import { useState } from 'react'
import { FamilyTreeProvider, useFamilyTree } from './context/FamilyTreeContext'
import { FamilyTreeView } from './components/FamilyTreeView'
import { PersonForm } from './components/PersonForm'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'
import type { Person } from './types/family'

const AppContent = () => {
  const { addPerson, updatePerson, deletePerson, getPerson } = useFamilyTree()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null)

  const selectedPerson = selectedPersonId ? getPerson(selectedPersonId) : undefined

  const handleNodeClick = (personId: string) => {
    setSelectedPersonId(personId)
    setShowForm(true)
  }

  const handleAddPerson = () => {
    setSelectedPersonId(null)
    setShowForm(true)
  }

  const handleFormSubmit = (data: Omit<Person, 'id' | 'parentIds' | 'childIds' | 'partnerIds'>) => {
    if (selectedPerson) {
      updatePerson(selectedPerson.id, data)
    } else {
      addPerson({
        ...data,
        parentIds: [],
        childIds: [],
        partnerIds: [],
      })
    }
    setShowForm(false)
    setSelectedPersonId(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedPersonId(null)
  }

  const handleDeleteClick = () => {
    if (selectedPerson) {
      setPersonToDelete(selectedPerson)
    }
  }

  const handleDeleteConfirm = () => {
    if (personToDelete) {
      deletePerson(personToDelete.id)
      setPersonToDelete(null)
      setShowForm(false)
      setSelectedPersonId(null)
    }
  }

  const handleDeleteCancel = () => {
    setPersonToDelete(null)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Family Tree</h1>
        <button
          onClick={handleAddPerson}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Add Person
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Tree View */}
        <div className="flex-1">
          <FamilyTreeView onNodeClick={handleNodeClick} />
        </div>

        {/* Form Sidebar */}
        {showForm && (
          <div className="w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
            <div className="p-4">
              <PersonForm
                person={selectedPerson}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                onDelete={selectedPerson ? handleDeleteClick : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {personToDelete && (
        <DeleteConfirmDialog
          personName={personToDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <FamilyTreeProvider>
      <AppContent />
    </FamilyTreeProvider>
  )
}

export default App
