import stringSimilarity from 'string-similarity';

export interface PlagiarismResult {
  similarity: number;
  matchedWith: {
    studentName: string;
    similarity: number;
  }[];
}

export function checkPlagiarism(
  currentSubmission: { content: string; studentName: string },
  otherSubmissions: { content: string; studentName: string }[]
): PlagiarismResult {
  const matches = otherSubmissions
    .filter(sub => sub.studentName !== currentSubmission.studentName)
    .map(submission => ({
      studentName: submission.studentName,
      similarity: stringSimilarity.compareTwoStrings(
        currentSubmission.content.toLowerCase(),
        submission.content.toLowerCase()
      )
    }))
    .filter(result => result.similarity > 0.3) // Only show matches with >50% similarity
    .sort((a, b) => b.similarity - a.similarity);

  const overallSimilarity = matches.length > 0 
    ? matches.reduce((acc, curr) => acc + curr.similarity, 0) / matches.length
    : 0;

  return {
    similarity: overallSimilarity,
    matchedWith: matches
  };
}
