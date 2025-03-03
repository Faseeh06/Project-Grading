import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readFileContent } from '@/lib/file-handler';
import { checkPlagiarism } from "@/lib/plagiarism";

const ASSIGNMENTS_FILE = path.join(process.cwd(), "data", "assignments.json");
const SUBMISSIONS_FILE = path.join(process.cwd(), "data", "submissions.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  filename: string;
  filepath: string;
  grade?: number;
  feedback?: string;
}

async function getAssignments(): Promise<Assignment[]> {
  if (!fs.existsSync(ASSIGNMENTS_FILE)) {
    return [];
  }
  const data = await fs.promises.readFile(ASSIGNMENTS_FILE, "utf-8");
  return JSON.parse(data);
}

async function getSubmissions(): Promise<Submission[]> {
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    return [];
  }
  const data = await fs.promises.readFile(SUBMISSIONS_FILE, "utf-8");
  return JSON.parse(data);
}

async function saveAssignments(assignments: Assignment[]): Promise<void> {
  await fs.promises.mkdir(path.dirname(ASSIGNMENTS_FILE), { recursive: true });
  await fs.promises.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2));
}

async function saveSubmissions(submissions: Submission[]): Promise<void> {
  await fs.promises.mkdir(path.dirname(SUBMISSIONS_FILE), { recursive: true });
  await fs.promises.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    switch (action) {
      case 'getAssignments': {
        const assignments = await getAssignments();
        return NextResponse.json(assignments);
      }

      case 'createAssignment': {
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const dueDate = formData.get('dueDate') as string;

        const assignments = await getAssignments();
        const newAssignment: Assignment = {
          id: (assignments.length + 1).toString().padStart(3, "0"),
          title,
          description,
          dueDate,
        };
        assignments.push(newAssignment);
        await saveAssignments(assignments);
        return NextResponse.json(newAssignment);
      }

      case 'getSubmissions': {
        const submissions = await getSubmissions();
        return NextResponse.json(submissions);
      }

      case 'getStudentSubmissions': {
        const studentId = formData.get('studentId') as string;
        const submissions = await getSubmissions();
        const studentSubmissions = submissions.filter(
          (submission) => submission.studentId === studentId
        );
        return NextResponse.json(studentSubmissions);
      }

      case 'submitAssignment': {
        const assignmentId = formData.get('assignmentId') as string;
        const studentId = formData.get('studentId') as string;
        const studentName = formData.get('studentName') as string;
        const file = formData.get('file') as File;

        if (!file) {
          return NextResponse.json(
            { error: "No file provided" },
            { status: 400 }
          );
        }

        const submissions = await getSubmissions();
        const filename = `${Date.now()}-${file.name}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        // Ensure uploads directory exists
        await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });

        // Write file to uploads directory
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.promises.writeFile(filepath, buffer);

        const newSubmission: Submission = {
          id: (submissions.length + 1).toString().padStart(3, "0"),
          assignmentId,
          studentId,
          studentName,
          filename: file.name,
          filepath,
        };
        submissions.push(newSubmission);
        await saveSubmissions(submissions);
        return NextResponse.json(newSubmission);
      }

      case 'gradeSubmission': {
        const submissionId = formData.get('submissionId') as string;
        const grade = Number(formData.get('grade'));
        const feedback = formData.get('feedback') as string;

        const submissions = await getSubmissions();
        const submissionIndex = submissions.findIndex((s) => s.id === submissionId);
        
        if (submissionIndex === -1) {
          return NextResponse.json(
            { error: "Submission not found" },
            { status: 404 }
          );
        }

        submissions[submissionIndex] = {
          ...submissions[submissionIndex],
          grade,
          feedback,
        };
        await saveSubmissions(submissions);
        return NextResponse.json(submissions[submissionIndex]);
      }

      case 'checkPlagiarism': {
        const assignmentId = formData.get('assignmentId') as string;
        const filepath = formData.get('filepath') as string;
        const result = await checkPlagiarism(assignmentId, filepath);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const filepath = request.nextUrl.searchParams.get('filepath');
    if (!filepath) {
      return NextResponse.json({ error: 'Filepath is required' }, { status: 400 });
    }

    const content = await readFileContent(decodeURIComponent(filepath));
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}