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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  const [isPlagiarismDialogOpen, setIsPlagiarismDialogOpen] = useState(false)
  const [plagiarismData, setPlagiarismData] = useState<{
    results: { student1: string, student2: string, similarityScore: number }[]
  }>({
    results: []
  })

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

  const handleCheckPlagiarism = async () => {
    try {
      setIsPlagiarismDialogOpen(true)
      setPlagiarismData({ results: [] })
      
      // Get all submissions
      const submissionContents = await Promise.all(
        submissions.map(async (sub) => {
          const content = await getSubmissionFile(sub.filepath)
          return {
            id: sub.id,
            studentName: sub.studentName,
            content: content || ""
          }
        })
      )
      
      const similarityResults = calculateSimilarity(submissionContents)
      
      setPlagiarismData({
        results: similarityResults.map(result => ({
          student1: result.student1,
          student2: result.student2,
          similarityScore: result.similarityScore
        }))
      })
    } catch (error) {
      console.error("Error checking plagiarism:", error)
      setIsPlagiarismDialogOpen(false)
    }
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 0.3) return "bg-red-600 text-white"
    if (score >= 0.2) return "bg-yellow-500 text-white"
    return "bg-green-600 text-white"
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
            <div className="mb-4">
              <Button 
                onClick={handleCheckPlagiarism}
                variant="secondary"
                className="w-full"
              >
                Check All Submissions for Plagiarism
              </Button>
            </div>
            <ul className="space-y-4">
              {submissions.map((submission) => (
                <li key={submission.id} className="relative border p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{submission.studentName}</span>
                    <div className="space-x-2">
                      <Button 
                        onClick={() => handleDownloadSubmission(submission)}
                        variant="outline"
                        size="sm"
                      >
                        Download
                      </Button>
                      <Button 
                        onClick={() => setSelectedSubmission(submission)}
                        size="sm"
                      >
                        Grade
                      </Button>
                    </div>
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
      <Dialog open={isPlagiarismDialogOpen} onOpenChange={setIsPlagiarismDialogOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Plagiarism Detection Results
            </DialogTitle>
          </DialogHeader>
          
          {plagiarismData.results.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Similarity Scores</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student 1</TableHead>
                          <TableHead>Student 2</TableHead>
                          <TableHead>Similarity Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plagiarismData.results.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.student1}</TableCell>
                            <TableCell>{result.student2}</TableCell>
                            <TableCell>
                              <Badge className={getSimilarityColor(result.similarityScore)}>
                                {(result.similarityScore * 100).toFixed(2)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="text-sm font-medium mb-2">Interpretation Guide</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <Badge className="bg-red-600 text-white mr-2">30%+</Badge>
                      <span>Significant similarity - review required</span>
                    </li>
                    <li className="flex items-center">
                      <Badge className="bg-yellow-500 text-white mr-2">20-30%</Badge>
                      <span>Moderate similarity - may need review</span>
                    </li>
                    <li className="flex items-center">
                      <Badge className="bg-green-600 text-white mr-2">&lt;20%</Badge>
                      <span>Minimal similarity - likely coincidental</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    These scores are based on algorithmic comparison and should be reviewed manually.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-sm text-gray-500">Analyzing submissions...</p>
                </div>
              </div>
            )}
          
          <DialogFooter>
            <Button onClick={() => setIsPlagiarismDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

