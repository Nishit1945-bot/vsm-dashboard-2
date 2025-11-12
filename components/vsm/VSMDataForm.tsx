'use client'

interface VSMProcess {
  id: string
  name: string
  cycleTimeSec?: number
  changeoverSec?: number
  uptimePct?: number
  wipUnits?: number
}

interface VSMDataFormProps {
  customerDemand?: number
  processes: VSMProcess[]
  onCustomerDemandChange: (value: number) => void
  onAddProcess: () => void
  onUpdateProcess: (index: number, process: Partial<VSMProcess>) => void
  onRemoveProcess: (index: number) => void
}

export default function VSMDataForm({
  customerDemand,
  processes,
  onCustomerDemandChange,
  onAddProcess,
  onUpdateProcess,
  onRemoveProcess,
}: VSMDataFormProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 h-full overflow-auto">
      <h3 className="text-xl font-semibold mb-6">VSM Data Entry</h3>

      {/* Customer Demand */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Demand (units/day)
        </label>
        <input
          type="number"
          value={customerDemand || ''}
          onChange={(e) => onCustomerDemandChange(Number(e.target.value))}
          placeholder="e.g., 480"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Process Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">Process Steps</label>
          <button
            onClick={onAddProcess}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            + Add Process
          </button>
        </div>

        <div className="space-y-3">
          {processes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No processes added yet. Click "+ Add Process" to start.
            </div>
          ) : (
            processes.map((process, index) => (
              <div key={process.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Process {index + 1}</span>
                  <button
                    onClick={() => onRemoveProcess(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <input
                  value={process.name}
                  onChange={(e) => onUpdateProcess(index, { name: e.target.value })}
                  placeholder="Process name"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Cycle Time (sec)</label>
                    <input
                      type="number"
                      value={process.cycleTimeSec ?? ''}
                      onChange={(e) => onUpdateProcess(index, { cycleTimeSec: Number(e.target.value) || undefined })}
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-sm border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Changeover (sec)</label>
                    <input
                      type="number"
                      value={process.changeoverSec ?? ''}
                      onChange={(e) => onUpdateProcess(index, { changeoverSec: Number(e.target.value) || undefined })}
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-sm border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Uptime %</label>
                    <input
                      type="number"
                      value={process.uptimePct ?? ''}
                      onChange={(e) => onUpdateProcess(index, { uptimePct: Number(e.target.value) || undefined })}
                      placeholder="100"
                      className="w-full px-2 py-1.5 text-sm border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">WIP (units)</label>
                    <input
                      type="number"
                      value={process.wipUnits ?? ''}
                      onChange={(e) => onUpdateProcess(index, { wipUnits: Number(e.target.value) || undefined })}
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-sm border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button className="w-full mt-6 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
        Generate VSM Preview
      </button>
    </div>
  )
}