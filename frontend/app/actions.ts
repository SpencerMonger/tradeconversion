"use server"

import { writeFile, readFile } from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import { join } from "path"

const execAsync = promisify(exec)

export async function convertTrade(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file uploaded")
    }

    if (!file.name.endsWith(".tlg")) {
      throw new Error("Invalid file type. Please upload a .tlg file")
    }

    // Save the uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadPath = join(process.cwd(), "tmp", file.name)
    const outputPath = join(process.cwd(), "tmp", "output.csv")

    await writeFile(uploadPath, buffer)

    // Execute the Python script
    await execAsync(`python3 tradeconverter.py ${uploadPath} ${outputPath}`)

    // Read the output CSV
    const csvContent = await readFile(outputPath, "utf-8")

    return {
      success: true,
      data: csvContent,
    }
  } catch (error) {
    console.error("Conversion error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

