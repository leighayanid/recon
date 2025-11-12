"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/hooks/use-toast"
import { Search, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        })
      } else {
        setSent(true)
        toast({
          title: "Success",
          description: "Password reset email sent! Check your inbox.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-8 w-8" />
              <span className="text-2xl font-bold">OSINT WebApp</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset password</CardTitle>
          <CardDescription className="text-center">
            {sent
              ? "Check your email for a password reset link"
              : "Enter your email address and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </CardFooter>
          </>
        ) : (
          <CardContent>
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to reset your password.
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Link>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
