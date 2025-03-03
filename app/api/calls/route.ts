import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const CALLS_FILE = path.join(process.cwd(), "data", "calls.json")

interface Call {
  studentId: string
  date: string
  time: string
}

async function getCalls(): Promise<Call[]> {
  if (!fs.existsSync(CALLS_FILE)) {
    return []
  }
  const data = await fs.promises.readFile(CALLS_FILE, "utf-8")
  return JSON.parse(data)
}

async function saveCalls(calls: Call[]): Promise<void> {
  await fs.promises.mkdir(path.dirname(CALLS_FILE), { recursive: true })
  await fs.promises.writeFile(CALLS_FILE, JSON.stringify(calls, null, 2))
}

export async function POST(request: Request) {
  try {
    const { studentId, date, time } = await request.json()
    const calls = await getCalls()
    const newCall: Call = { studentId, date, time }
    calls.push(newCall)
    await saveCalls(calls)
    return NextResponse.json(newCall)
  } catch (error) {
    return NextResponse.json({ error: "Failed to schedule call" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }
    const calls = await getCalls()
    const studentCalls = calls.filter(call => call.studentId === studentId)
    return NextResponse.json(studentCalls)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch scheduled calls" }, { status: 500 })
  }
}
