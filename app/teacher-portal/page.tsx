"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAssignments, createAssignment, getSubmissions, gradeSubmission, getSubmissionFile } from "@/lib/assignments"
import { LogoutButton } from "@/components/logout-button"
import { scheduleCall } from "@/lib/calls"
import { getUsers } from "@/lib/users"
import { checkPlagiarism } from "@/lib/plagiarism"

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
  filepath: string
  grade?: number
  feedback?: string
  content?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function TeacherPortal() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "" })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [callDetails, setCallDetails] = useState({ studentId: "", date: "", time: "" })
  const [users, setUsers] = useState<User[]>([])
  const [plagiarismResult, setPlagiarismResult] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignments()
    fetchSubmissions()
    fetchUsers()
  }, [])

  const fetchAssignments = async () => {
    try {
      const fetchedAssignments = await getAssignments();
      console.log('Fetched assignments in component:', fetchedAssignments);
      setAssignments(fetchedAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      throw err;
    }
  };

  const fetchSubmissions = async () => {
    try {
      const fetchedSubmissions = await getSubmissions();
      console.log('Fetched submissions in component:', fetchedSubmissions);
      setSubmissions(fetchedSubmissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      throw err;
    }
  };

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getUsers()
      const filteredUsers = fetchedUsers.filter((user: User) => user.email !== "admin@gmail.com")
      setUsers(filteredUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      throw err;
    }
  }

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    await createAssignment(newAssignment)
    setNewAssignment({ title: "", description: "", dueDate: "" })
    fetchAssignments()
  }

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSubmission && selectedSubmission.grade !== undefined) {
      await gradeSubmission(selectedSubmission.id, selectedSubmission.grade, selectedSubmission.feedback || "")
      setSelectedSubmission(null)
      fetchSubmissions()
    }
  }

  const handleDownloadSubmission = async (submission: Submission) => {
    try {
      const fileContent = await getSubmissionFile(submission.filepath)
      if (!fileContent) throw new Error('File content is empty')
      
      const blob = new Blob([fileContent])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = submission.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  const handleScheduleCall = async (e: React.FormEvent) => {
    e.preventDefault()
    await scheduleCall(callDetails.studentId, callDetails.date, callDetails.time)
    setCallDetails({ studentId: "", date: "", time: "" })
  }

  // First, let's modify the handleCheckPlagiarism function in your TeacherPortal component
const handleCheckPlagiarism = async (submission: Submission) => {
  try {
    // Set a loading state
    setPlagiarismResult("Loading plagiarism results...")
    
    // Fetch all submissions for the same assignment
    const assignmentSubmissions = submissions.filter(
      sub => sub.assignmentId === submission.assignmentId
    )
    
    // Get content for all submissions
    const submissionContents = await Promise.all(
      assignmentSubmissions.map(async (sub) => {
        const content = await getSubmissionFile(sub.filepath)
        return {
          id: sub.id,
          studentName: sub.studentName,
          content: content || ""
        }
      })
    )
    
    // Calculate similarity between all submissions
    const similarityResults = calculateSimilarity(submissionContents)
    
    // Format the results for display
    const formattedResults = formatPlagiarismResults(
      submissionContents, 
      similarityResults,
      submission.id
    )
    
    setPlagiarismResult(formattedResults)
  } catch (error) {
    console.error("Error checking plagiarism:", error)
    setPlagiarismResult("Error checking plagiarism: " + (error as Error).message)
  }
}

// Helper function to calculate similarity between submissions
function calculateSimilarity(submissions: { id: string, studentName: string, content: string }[]) {
  const results: { submission1: string, submission2: string, student1: string, student2: string, similarityScore: number }[] = []
  
  // Tokenize all submissions
  const tokenizedSubmissions = submissions.map(sub => ({
    id: sub.id,
    studentName: sub.studentName,
    tokens: tokenizeContent(sub.content)
  }))
  
  // Compare each submission with every other submission
  for (let i = 0; i < tokenizedSubmissions.length; i++) {
    for (let j = i + 1; j < tokenizedSubmissions.length; j++) {
      const sub1 = tokenizedSubmissions[i]
      const sub2 = tokenizedSubmissions[j]
      
      const similarityScore = calculateJaccardSimilarity(sub1.tokens, sub2.tokens)
      
      results.push({
        submission1: sub1.id,
        submission2: sub2.id,
        student1: sub1.studentName,
        student2: sub2.studentName,
        similarityScore
      })
    }
  }
  
  // Sort by similarity score (highest first)
  return results.sort((a, b) => b.similarityScore - a.similarityScore)
}

// Tokenize content into normalized words
function tokenizeContent(content: string) {
  if (!content) return new Set<string>()
  
  // Convert to lowercase
  const lowerContent = content.toLowerCase()
  
  // Remove common punctuation and split into words
  const words = lowerContent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3) // Filter out very short words
  
  // Create n-grams (sequences of 3 consecutive words)
  const ngrams = []
  for (let i = 0; i < words.length - 2; i++) {
    ngrams.push(`${words[i]} ${words[i+1]} ${words[i+2]}`)
  }
  
  return new Set(ngrams)
}

// Calculate Jaccard similarity coefficient between two sets of tokens
function calculateJaccardSimilarity(tokens1: Set<string>, tokens2: Set<string>) {
  if (tokens1.size === 0 || tokens2.size === 0) return 0
  
  // Find intersection
  const intersection = new Set([...tokens1].filter(token => tokens2.has(token)))
  
  // Find union
  const union = new Set([...tokens1, ...tokens2])
  
  // Calculate Jaccard similarity: intersection size / union size
  return intersection.size / union.size
}

// Format results for display
function formatPlagiarismResults(
  submissions: { id: string, studentName: string, content: string }[],
  similarityResults: { submission1: string, submission2: string, student1: string, student2: string, similarityScore: number }[],
  currentSubmissionId: string
) {
  // Create a map for quick student name lookup
  const submissionMap = new Map(
    submissions.map(sub => [sub.id, { name: sub.studentName, content: sub.content }])
  )
  
  // Format the results
  let formattedResult = "# Plagiarism Detection Results\n\n"
  
  // Add summary of submission being checked
  const currentSubmission = submissions.find(sub => sub.id === currentSubmissionId)
  if (currentSubmission) {
    formattedResult += `## Selected Submission\n`
    formattedResult += `Student: ${currentSubmission.studentName}\n`
    formattedResult += `Content length: ${currentSubmission.content.length} characters\n\n`
  }
  
  // Add similarity scores
  formattedResult += "## Similarity Scores\n\n"
  formattedResult += "| Student 1 | Student 2 | Similarity Score |\n"
  formattedResult += "|-----------|-----------|------------------|\n"
  
  similarityResults.forEach(result => {
    // Format the similarity as a percentage with 2 decimal places
    const similarityPercentage = (result.similarityScore * 100).toFixed(2) + "%"
    formattedResult += `| ${result.student1} | ${result.student2} | ${similarityPercentage} |\n`
  })
  
  // If no similarities found
  if (similarityResults.length === 0) {
    formattedResult += "No similarities found between submissions.\n"
  }
  
  // Add visualization warning and interpretation
  formattedResult += "\n## Interpretation Guide\n\n"
  formattedResult += "- Scores above 30% suggest significant similarity\n"
  formattedResult += "- Scores between 20-30% indicate moderate similarity\n"
  formattedResult += "- Scores below 20% suggest minimal or coincidental similarity\n"
  formattedResult += "\nNote: These scores are based on algorithmic comparison and should be reviewed manually."
  
  return formattedResult
}

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teacher Portal</h1>
        <LogoutButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignments Card */}
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

        {/* Add New Assignment Card */}
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
                  required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  required />
              </div>
              <Button type="submit">Add Assignment</Button>
            </form>
          </CardContent>
        </Card>

        {/* Submissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>Grade student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {submissions.map((submission) => (
                <li key={submission.id} className="flex justify-between items-center">
                  <span>{submission.studentName}</span>
                  <div>
                    <Button 
                      onClick={() => handleDownloadSubmission(submission)}
                      className="mr-2"
                    >
                      Download
                    </Button>
                    <Button onClick={() => setSelectedSubmission(submission)}>
                      Grade
                    </Button>
                    <Button onClick={() => handleCheckPlagiarism(submission)} className="mr-2">
                      Check Plagiarism
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Grade Submission Card */}
        {selectedSubmission && (
          <Card>
            <CardHeader>
              <CardTitle>Grade Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGradeSubmission} className="space-y-4">
                {/* Student Info */}
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input id="studentName" value={selectedSubmission.studentName} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filename">Submitted File</Label>
                  <Input id="filename" value={selectedSubmission.filename} readOnly />
                </div>

                {/* Grade and Feedback */}
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedSubmission.grade || ""}
                    onChange={(e) => setSelectedSubmission({ ...selectedSubmission, grade: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={selectedSubmission.feedback || ""}
                    onChange={(e) => setSelectedSubmission({ ...selectedSubmission, feedback: e.target.value })}
                    required
                  />
                </div>
                
                <Button type="submit">Submit Grade</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Schedule Call Card */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule a Call</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScheduleCall} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Select User</Label>
                <select
                  id="studentId"
                  value={callDetails.studentId}
                  onChange={(e) => setCallDetails({ ...callDetails, studentId: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={callDetails.date}
                  onChange={(e) => setCallDetails({ ...callDetails, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={callDetails.time}
                  onChange={(e) => setCallDetails({ ...callDetails, time: e.target.value })}
                  required
                />
              </div>
              <Button type="submit">Schedule Call</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      {plagiarismResult && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Plagiarism Result</h2>
            <pre>{plagiarismResult}</pre>
            <Button onClick={() => setPlagiarismResult(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  )
}

