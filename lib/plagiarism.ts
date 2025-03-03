import fs from "fs"
import path from "path"
import { getSubmissions } from "@/lib/assignments"

export async function checkPlagiarism(assignmentId: string, filepath: string): Promise<string> {
  const submissions = await getSubmissions()
  const assignmentSubmissions = submissions.filter(sub => sub.assignmentId === assignmentId)

  const targetFileContent = await fs.promises.readFile(filepath, "utf-8")
  const targetTokens = tokenize(targetFileContent)

  let plagiarismReport = ""

  for (const submission of assignmentSubmissions) {
    if (submission.filepath === filepath) continue

    const fileContent = await fs.promises.readFile(submission.filepath, "utf-8")
    const tokens = tokenize(fileContent)

    const similarity = calculateSimilarity(targetTokens, tokens)
    plagiarismReport += `Similarity with ${submission.studentName}: ${similarity}%\n`
  }

  return plagiarismReport
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
