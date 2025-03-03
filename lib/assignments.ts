import fs from "fs"
import path from "path"

const SUBMISSIONS_FILE = path.join(process.cwd(), "data", "submissions.json")

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  filename: string;
  filepath: string;
  grade?: number;
  feedback?: string;
}

export const getAssignments = async (): Promise<Assignment[]> => {
  try {
    const formData = new FormData();
    formData.append('action', 'getAssignments');

    const response = await fetch('/api/assignments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
};

export const createAssignment = async (assignment: Omit<Assignment, "id">): Promise<Assignment | null> => {
  try {
    const formData = new FormData();
    formData.append('action', 'createAssignment');
    formData.append('title', assignment.title);
    formData.append('description', assignment.description);
    formData.append('dueDate', assignment.dueDate);

    const response = await fetch('/api/assignments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to create assignment:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    return null;
  }
};

export async function getSubmissions(): Promise<Submission[]> {
  try {
    const formData = new FormData();
    formData.append('action', 'getSubmissions');

    const response = await fetch('/api/assignments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
}

export const getStudentSubmissions = async (studentId: string): Promise<Submission[]> => {
  try {
    const formData = new FormData();
    formData.append('action', 'getStudentSubmissions');
    formData.append('studentId', studentId);

    const response = await fetch('/api/assignments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to fetch student submissions:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    return [];
  }
};

export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  studentName: string,
  file: File,
): Promise<Submission | null> => {
  try {
    const formData = new FormData();
    formData.append('action', 'submitAssignment');
    formData.append('assignmentId', assignmentId);
    formData.append('studentId', studentId);
    formData.append('studentName', studentName);
    formData.append('file', file);

    const response = await fetch('/api/assignments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to submit assignment:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return null;
  }
};

export const gradeSubmission = async (
  submissionId: string,
  grade: number,
  feedback: string
): Promise<Submission | null> => {
  try {
    const formData = new FormData();
    formData.append('action', 'gradeSubmission');
    formData.append('submissionId', submissionId);
    formData.append('grade', grade.toString());
    formData.append('feedback', feedback);

    const response = await fetch('/api/assignments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to grade submission:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error grading submission:', error);
    return null;
  }
};

export const getSubmissionFileBlob = async (filepath: string): Promise<Blob | null> => {
  try {
    const response = await fetch(`/api/assignments?filepath=${encodeURIComponent(filepath)}`);

    if (!response.ok) {
      console.error('Failed to fetch submission file:', response.statusText);
      return null;
    }

    return response.blob();
  } catch (error) {
    console.error('Error fetching submission file:', error);
    return null;
  }
};

export const getSubmissionFile = async (filepath: string): Promise<string> => {
  try {
    const response = await fetch(`/api/assignments?filepath=${encodeURIComponent(filepath)}`);
    if (!response.ok) throw new Error('Failed to fetch file');
    const data = await response.json();
    return data.content;
  } catch (error) {
    throw error;
  }
};