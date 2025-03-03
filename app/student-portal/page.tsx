"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAssignments, getStudentSubmissions, submitAssignment } from "@/lib/assignments"
import { getScheduledCalls } from "@/lib/calls"
import { userStore } from "@/lib/store"
import { LogoutButton } from "@/components/logout-button"

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
}

interface Submission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  filename: string
  grade?: number
  feedback?: string
}

interface ScheduledCall {
  studentId: string
  date: string
  time: string
}

export default function StudentPortal() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([])

  const user = userStore.getUser();
  const studentId = user?.id || "unknown";
  const studentName = user?.name || "Unknown Student";

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchAssignments();
    fetchSubmissions();
    fetchScheduledCalls();
  }, []);

  const fetchAssignments = async () => {
    const fetchedAssignments = await getAssignments()
    setAssignments(fetchedAssignments)
  }

  const fetchSubmissions = async () => {
    const fetchedSubmissions = await getStudentSubmissions(studentId)
    setSubmissions(fetchedSubmissions)
  }

  const fetchScheduledCalls = async () => {
    const calls = await getScheduledCalls(studentId)
    setScheduledCalls(calls)
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAssignment && file) {
      await submitAssignment(selectedAssignment.id, studentId, studentName, file)
      setSelectedAssignment(null)
      setFile(null)
      fetchSubmissions()
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Student Portal</h1>
          <p className="text-gray-600">Welcome, {studentName}</p>
        </div>
        <LogoutButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>View and submit your assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assignments.map((assignment) => (
                <li key={assignment.id} className="flex justify-between items-center">
                  <span>{assignment.title}</span>
                  <Button onClick={() => setSelectedAssignment(assignment)}>Submit</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        {selectedAssignment && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold">{selectedAssignment.title}</h3>
                  <p>{selectedAssignment.description}</p>
                  <p className="text-sm text-gray-500">Due: {selectedAssignment.dueDate}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Assignment</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    required
                  />
                </div>
                <Button type="submit">Submit Assignment</Button>
              </form>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
            <CardDescription>View your submitted assignments and grades</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {submissions.map((submission) => (
                <li key={submission.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>
                      Assignment: {assignments.find((a) => a.id === submission.assignmentId)?.title || "Unknown"}
                    </span>
                    <span className="text-sm text-gray-500">File: {submission.filename}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Status: {submission.grade !== undefined ? "Graded" : "Pending"}
                    </span>
                    {submission.grade !== undefined && (
                      <span className="text-sm font-bold">Grade: {submission.grade}</span>
                    )}
                  </div>
                  {submission.feedback && <p className="text-sm text-gray-700">Feedback: {submission.feedback}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        {/* Scheduled Calls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Calls</CardTitle>
            <CardDescription>View your scheduled callss</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledCalls.length > 0 ? (
              <ul className="space-y-2">
                {scheduledCalls.map((call) => (
                  <li key={call.date + call.time} className="flex justify-between items-center">
                    <span>Call on {call.date} at {call.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No meetings scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

