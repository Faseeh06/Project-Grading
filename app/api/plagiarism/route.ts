import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getSubmissions, Submission } from "@/lib/assignments"

export async function POST(request: Request) {
  try {
    const { assignmentId, filepath } = await request.json()
    console.log("Received request to check plagiarism for assignmentId:", assignmentId, "and filepath:", filepath)
    
    const submissions = await getSubmissions()
    const assignmentSubmissions = submissions.filter((sub: Submission) => sub.assignmentId === assignmentId)

    const absoluteFilepath = path.join(process.cwd(), filepath)
    if (!fs.existsSync(absoluteFilepath)) {
      throw new Error(`File not found: ${absoluteFilepath}`)
    }

    const targetFileContent = await fs.promises.readFile(absoluteFilepath, "utf-8")
    const targetTokens = tokenize(targetFileContent)

    let plagiarismReport = ""

    for (const submission of assignmentSubmissions) {
      if (submission.filepath === filepath) continue

      const submissionAbsoluteFilepath = path.join(process.cwd(), submission.filepath)
      if (!fs.existsSync(submissionAbsoluteFilepath)) {
        console.warn(`File not found: ${submissionAbsoluteFilepath}`)
        plagiarismReport += `File not found for ${submission.studentName}\n`
        continue
      }

      const fileContent = await fs.promises.readFile(submissionAbsoluteFilepath, "utf-8")
      const tokens = tokenize(fileContent)

      const similarity = calculateSimilarity(targetTokens, tokens)
      plagiarismReport += `Similarity with ${submission.studentName}: ${similarity.toFixed(2)}%\n`
    }

    return NextResponse.json({ result: plagiarismReport })
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error checking plagiarism:", error.message)
      return NextResponse.json({ error: "Failed to check plagiarism", details: error.message }, { status: 500 })
    } else {
      console.error("Unknown error checking plagiarism:", error)
      return NextResponse.json({ error: "Failed to check plagiarism", details: "Unknown error" }, { status: 500 })
    }
  }
}

function tokenize(content: string): string[] {
  return content.split(/\s+/)
}

function calculateSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1)
  const set2 = new Set(tokens2)
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  return (intersection.size / Math.max(set1.size, set2.size)) * 100
}
