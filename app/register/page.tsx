"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { registerUser } from "@/lib/auth"

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    class: "",
    school: "",
    registrationId: "",
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerUser(formData)
      router.push("/login")
    } catch (error) {
      console.error("Registration failed:", error)
      // Handle error (e.g., show error message to user)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Input id="class" name="class" value={formData.class} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <Input id="school" name="school" value={formData.school} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationId">Registration ID</Label>
            <Input
              id="registrationId"
              name="registrationId"
              value={formData.registrationId}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Register
          </Button>
        </div>
      </form>
    </div>
  )
}

