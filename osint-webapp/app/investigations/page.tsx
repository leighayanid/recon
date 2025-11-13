import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FolderOpen, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { InvestigationList } from "@/components/investigations/InvestigationList"
import { CreateInvestigationDialog } from "@/components/investigations/CreateInvestigationDialog"

export default async function InvestigationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's investigations with stats
  const { data: investigations, error } = await supabase
    .from("investigations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  // Fetch stats for each investigation
  const investigationsWithStats = await Promise.all(
    (investigations || []).map(async (investigation) => {
      const { count: itemCount } = await supabase
        .from("investigation_items")
        .select("*", { count: "exact", head: true })
        .eq("investigation_id", investigation.id)

      const { data: jobs } = await supabase
        .from("jobs")
        .select("status")
        .eq("user_id", user.id)
        .eq("investigation_id", investigation.id)

      const completedJobs = jobs?.filter((j) => j.status === "completed").length || 0
      const pendingJobs = jobs?.filter((j) => ["pending", "running"].includes(j.status)).length || 0
      const failedJobs = jobs?.filter((j) => j.status === "failed").length || 0

      return {
        ...investigation,
        item_count: itemCount || 0,
        completed_jobs: completedJobs,
        pending_jobs: pendingJobs,
        failed_jobs: failedJobs,
      }
    })
  )

  const totalInvestigations = investigationsWithStats.length
  const activeInvestigations = investigationsWithStats.filter((i) => i.status === "active").length
  const completedInvestigations = investigationsWithStats.filter((i) => i.status === "completed").length

  const stats = [
    {
      name: "Total Investigations",
      value: totalInvestigations.toString(),
      icon: FolderOpen,
      color: "text-blue-600",
    },
    {
      name: "Active",
      value: activeInvestigations.toString(),
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      name: "Completed",
      value: completedInvestigations.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigations</h1>
          <p className="text-muted-foreground mt-2">
            Organize and manage your OSINT investigations
          </p>
        </div>
        <CreateInvestigationDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Investigations List */}
      {investigationsWithStats.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No investigations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first investigation to start organizing your OSINT research
              </p>
              <CreateInvestigationDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <InvestigationList investigations={investigationsWithStats} />
      )}
    </div>
  )
}
