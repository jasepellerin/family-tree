interface ImportConfirmDialogProps {
  peopleCount: number
  onConfirm: () => void
  onCancel: () => void
}

export const ImportConfirmDialog = ({
  peopleCount,
  onConfirm,
  onCancel,
}: ImportConfirmDialogProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Import</h3>
        <p className="text-gray-600 mb-6">
          This will replace your current family tree with <strong>{peopleCount}</strong> people from
          the imported file. Your current data will be lost. Are you sure you want to continue?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  )
}

