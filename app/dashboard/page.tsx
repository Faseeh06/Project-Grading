"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Dashboard() {
  const [assignments, setAssignments] = useState([
    { id: 1, title: "Chemical Reactions Lab Report", dueDate: "2023-07-15" },
    { id: 2, title: "Periodic Table Quiz", dueDate: "2023-07-20" },
  ])

  const [newAssignment, setNewAssignment] = useState({ title: "", dueDate: "" })

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault()
    setAssignments([...assignments, { id: Date.now(), ...newAssignment }])
    setNewAssignment({ title: "", dueDate: "" })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Manage your class assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assignments.map((assignment) => (
                <li key={assignment.id} className="flex justify-between items-center">
                  <span>{assignment.title}</span>
                  <span className="text-sm text-gray-500">Due: {assignment.dueDate}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add New Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  required
                />
              </div>
              <Button type="submit">Add Assignment</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

