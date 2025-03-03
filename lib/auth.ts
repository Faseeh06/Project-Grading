import type { NextAuthOptions } from "next-auth"
// Import your providers and other auth configurations

export const authOptions: NextAuthOptions = {
  // Your auth configuration here
  providers: [
    // Configure your auth providers
  ],
  // Add other options as needed
}

// Extend the built-in session types
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

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Assume localhost
  return `http://localhost:${process.env.PORT || 3000}`;
}

export async function ensureAdminUser() {
  const response = await fetch(`${getBaseUrl()}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'ensureAdmin' })
  });
  
  if (!response.ok) {
    throw new Error('Failed to ensure admin user');
  }
  
  return response.json();
}

export async function registerUser(userData: Omit<User, "id" | "role">): Promise<User> {
  const response = await fetch(`${getBaseUrl()}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'register',
      data: userData
    })
  });

  if (!response.ok) {
    throw new Error('Failed to register user');
  }

  return response.json();
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const response = await fetch(`${getBaseUrl()}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'login',
      data: { email, password }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to login');
  }

  return response.json();
}

export async function logAuthAction(action: string, data: any) {
  try {
    await fetch('/api/auth/_log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    });
  } catch (error) {
    // Fail silently for logging
    console.error('Auth logging error:', error);
  }
}