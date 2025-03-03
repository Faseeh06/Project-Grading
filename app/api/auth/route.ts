import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  class: string;
  school: string;
  registrationId: string;
  role: "student" | "teacher";
}

async function getUsers(): Promise<User[]> {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = await fs.promises.readFile(USERS_FILE, "utf-8");
  return JSON.parse(data);
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.promises.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'register': {
        const users = await getUsers();
        const newUser: User = {
          ...data,
          id: (users.length + 1).toString().padStart(3, "0"),
          role: data.email === "admin@gmail.com" ? "teacher" : "student",
        };
        users.push(newUser);
        await saveUsers(users);
        return NextResponse.json(newUser);
      }

      case 'login': {
        const allUsers = await getUsers();
        const user = allUsers.find(
          (user) => user.email === data.email && user.password === data.password
        );
        return NextResponse.json(user || null);
      }

      case 'ensureAdmin': {
        const existingUsers = await getUsers();
        const adminUser = existingUsers.find((user) => user.email === "admin@gmail.com");
        if (!adminUser) {
          const newAdminUser: User = {
            id: "000",
            name: "Admin",
            email: "admin@gmail.com",
            password: "admin",
            class: "N/A",
            school: "N/A",
            registrationId: "ADMIN",
            role: "teacher",
          };
          existingUsers.push(newAdminUser);
          await saveUsers(existingUsers);
          return NextResponse.json(newAdminUser);
        }
        return NextResponse.json(adminUser);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}