import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Project Grading System</h1>
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive platform for submitting and grading student assignments
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
            <Button asChild size="lg" className="w-full h-12 text-lg">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full h-12 text-lg">
              <Link href="/register">Register</Link>
            </Button>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">For Students</h3>
              <p className="text-gray-600">Submit assignments and track your grades easily</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">For Teachers</h3>
              <p className="text-gray-600">Manage assignments and grade submissions efficiently</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-gray-600">Simple and intuitive interface for everyone</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

