export async function scheduleCall(studentId: string, date: string, time: string) {
  const response = await fetch("/api/calls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studentId, date, time }),
  })

  if (!response.ok) {
    throw new Error("Failed to schedule call")
  }

  return response.json()
}

export async function getScheduledCalls(studentId: string) {
  const response = await fetch(`/api/calls?studentId=${studentId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch scheduled calls")
  }
  return response.json()
}
