import { ensureAdminUser } from "./auth"

export async function initializeAppData() {
  await ensureAdminUser()
  // You can add more initialization steps here if needed
}

