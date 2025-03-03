import { Button } from "@/components/ui/button"
import { userStore } from "@/lib/store"

export function LogoutButton() {
  return (
    <Button 
      variant="outline" 
      onClick={() => userStore.logout()}
      className="absolute top-4 right-4"
    >
      Logout
    </Button>
  )
}
