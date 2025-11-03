"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;


export const dynamic = "force-dynamic";
export const revalidate = 0;


import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

type TrainingRecord = {
  id: string
  input_data: any
  output_graph: any
  created_at: string
}

export default function TrainingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!currentUser) {
          router.push("/")
          return
        }

        setUser(currentUser)

        const { data: records } = await supabase
          .from("training_data")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (records) {
          setTrainingData(records)
        }
      } catch (error) {
        console.error("[v0] Error loading training data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length || !user) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        if (file.name.endsWith(".csv")) {
          const text = await file.text()
          const lines = text.split("\n").filter(Boolean)
          const headers = lines[0].split(",")

          const records = lines.slice(1).map((line) => {
            const values = line.split(",")
            const record: any = {}
            headers.forEach((h, i) => {
              record[h.trim()] = values[i]?.trim()
            })
            return record
          })

          for (const record of records) {
            await supabase.from("training_data").insert({
              user_id: user.id,
              input_data: record,
              output_graph: { generated: false },
            })
          }
        }
      }

      const { data: updatedRecords } = await supabase
        .from("training_data")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (updatedRecords) {
        setTrainingData(updatedRecords)
      }

      alert("Training data uploaded successfully!")
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm("Delete this training record?")) return

    try {
      await supabase.from("training_data").delete().eq("id", id)
      setTrainingData((prev) => prev.filter((r) => r.id !== id))
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  async function exportTrainingData() {
    if (!trainingData.length) {
      alert("No training data to export")
      return
    }

    const csv = [
      "ID,Created At,Input Data,Output Graph",
      ...trainingData.map((r) =>
        [r.id, r.created_at, JSON.stringify(r.input_data), JSON.stringify(r.output_graph)].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `training_data_${new Date().toISOString()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <div>
              <div className="text-lg font-semibold">Model Training Interface</div>
              <div className="text-xs text-gray-500">Upload and manage training data for VSM model</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="border rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Training Data</h2>
                  <p className="text-sm text-gray-600 mt-1">{trainingData.length} records</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportTrainingData}
                    disabled={!trainingData.length}
                    className="px-4 py-2 border rounded-xl text-sm disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                  <label className="px-4 py-2 bg-gray-900 text-white rounded-xl cursor-pointer text-sm">
                    {uploading ? "Uploading..." : "Upload CSV"}
                    <input
                      type="file"
                      accept=".csv"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="overflow-auto max-h-[600px]">
                {trainingData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">No training data yet</p>
                    <p className="text-sm">Upload CSV files to start building your training dataset</p>
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b">
                      <tr className="text-left text-gray-600">
                        <th className="p-3">ID</th>
                        <th className="p-3">Created</th>
                        <th className="p-3">Input Data</th>
                        <th className="p-3">Output</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingData.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-xs">{record.id.slice(0, 8)}...</td>
                          <td className="p-3">{new Date(record.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:underline">View</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                                {JSON.stringify(record.input_data, null, 2)}
                              </pre>
                            </details>
                          </td>
                          <td className="p-3">
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:underline">View</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                                {JSON.stringify(record.output_graph, null, 2)}
                              </pre>
                            </details>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => deleteRecord(record.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1 space-y-4">
            <div className="border rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Training Guide</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium mb-1">1. Collect Data</h4>
                  <p className="text-gray-600 text-xs">
                    Upload CSV files containing VSM input data and expected outputs
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">2. Review Records</h4>
                  <p className="text-gray-600 text-xs">Verify that all training records are accurate and complete</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">3. Export Dataset</h4>
                  <p className="text-gray-600 text-xs">Download the complete training dataset for model training</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">4. Train Model</h4>
                  <p className="text-gray-600 text-xs">
                    Use the exported data to train your custom VSM generation model
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold mb-3">CSV Format</h3>
              <div className="text-xs space-y-2">
                <p className="text-gray-600">Your CSV should include columns for:</p>
                <ul className="list-disc ml-4 space-y-1 text-gray-600">
                  <li>Process names</li>
                  <li>Cycle times (C/T)</li>
                  <li>Changeover times (C/O)</li>
                  <li>Uptime percentages</li>
                  <li>WIP inventory</li>
                  <li>Customer demand</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-semibold">{trainingData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Used:</span>
                  <span className="font-semibold">{(JSON.stringify(trainingData).length / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
