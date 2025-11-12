"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Search, Menu, User, LogOut } from "lucide-react"
import { toast } from "@/lib/hooks/use-toast"
import { useState, useEffect } from "react"

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Search className="h-6 w-6" />
          <span>OSINT WebApp</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/tools">
                <Button variant="ghost">Tools</Button>
              </Link>
              <Link href="/investigations">
                <Button variant="ghost">Investigations</Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
