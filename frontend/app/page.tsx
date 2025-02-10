"use client"

import { useState } from "react"
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const downloadCSV = (csvContent: string, filename: string) => {
  // Create a blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv' });
  
  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append link to body, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  window.URL.revokeObjectURL(url);
};

export default function TradePage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string; data?: string } | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.name.endsWith(".tlg")) {
      setFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.name.endsWith(".tlg")) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsConverting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_URL}/api/convert`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Failed to convert file")
      }

      setResult(data)
      
      // Automatically download the file when conversion is successful
      if (data.success && data.data) {
        downloadCSV(data.data, data.filename)
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Trade Converter</h1>
            <p className="text-muted-foreground">Upload your .tlg file to convert it to CSV format</p>
          </div>

          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors
                    ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"}
                    ${file ? "bg-primary/5" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      {file ? (
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                      ) : (
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{file ? file.name : "Drag and drop your .tlg file here"}</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                    </div>
                    <input type="file" accept=".tlg" onChange={handleFileChange} className="hidden" id="file-upload" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="mt-2"
                    >
                      Select File
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={!file || isConverting}>
                  {isConverting ? (
                    <>
                      <FileUp className="mr-2 h-4 w-4 animate-bounce" />
                      Converting...
                    </>
                  ) : (
                    "Convert to CSV"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <Card className={result.success ? "bg-primary/5" : "bg-destructive/5"}>
              <CardContent className="pt-6">
                {result.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Conversion Successful</span>
                    </div>
                    <pre className="bg-card p-4 rounded-lg text-sm overflow-auto max-h-60">{result.data}</pre>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{result.error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

