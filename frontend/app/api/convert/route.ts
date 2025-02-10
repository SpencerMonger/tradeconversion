import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"
import { spawn } from "child_process"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!file.name.endsWith(".tlg")) {
      return NextResponse.json({ error: "Invalid file type. Please upload a .tlg file" }, { status: 400 })
    }

    // Create unique filenames using timestamp
    const timestamp = Date.now()
    const inputPath = join("/tmp", `input_${timestamp}.tlg`)
    const outputPath = join("/tmp", `output_${timestamp}.csv`)

    // Save the uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(inputPath, buffer)

    // Execute Python script
    const pythonProcess = spawn("python3", ["tradeconverter.py", inputPath, outputPath])

    // Wait for the Python script to complete
    await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(code)
        } else {
          reject(new Error(`Python script exited with code ${code}`))
        }
      })

      pythonProcess.on("error", (err) => {
        reject(err)
      })
    })

    // Read the output CSV
    const csvContent = await readFile(outputPath, "utf-8")

    return NextResponse.json({ success: true, data: csvContent })
  } catch (error) {
    console.error("Conversion error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

