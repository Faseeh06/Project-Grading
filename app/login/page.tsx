"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { loginUser } from "@/lib/auth"
import { userStore } from "@/lib/store"
import Link from "next/link"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await loginUser(email, password)
      if (user) {
        userStore.setUser({
          id: user.id,
          name: user.name,
          role: user.role
        });
        if (user.role === "teacher") {
          router.push("/teacher-portal")
        } else {
          router.push("/student-portal")
        }
      } else {
        console.error("Invalid credentials")
        alert("Invalid credentials. Please try again.")
      }
    } catch (error) {
      console.error("Login failed:", error)
      alert("Login failed. Please try again.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Please sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mt-6 space-y-4">
              <Button type="submit" className="w-full h-11 text-lg">
                Sign In
              </Button>
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Register here
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

