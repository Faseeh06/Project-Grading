import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const USERS_FILE = path.join(process.cwd(), "data", "users.json")

async function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = await fs.promises.readFile(USERS_FILE, "utf-8")
  return JSON.parse(data)
}

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
