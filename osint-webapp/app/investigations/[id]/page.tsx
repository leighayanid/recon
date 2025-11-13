import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Archive, AlertCircle, FolderOpen } from "lucide-react"
import { InvestigationHeader } from "@/components/investigations/InvestigationHeader"
import { InvestigationTimeline } from "@/components/investigations/InvestigationTimeline"
import { InvestigationItems } from "@/components/investigations/InvestigationItems"
import { AddJobToInvestigation } from "@/components/investigations/AddJobToInvestigation"
import type { InvestigationDetail } from "@/types/investigations"

interface InvestigationPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function InvestigationPage({ params }: InvestigationPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  // Fetch investigation with items
  const { data: investigation, error } = await supabase
    .from("investigations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !investigation) {
    notFound()
  }

  // Fetch investigation items with jobs
  const { data: items, error: itemsError } = await supabase
    .from("investigation_items")
    .select(`
      *,
      job:jobs(*)
    `)
    .eq("investigation_id", id)
    .order("created_at", { ascending: false })

  if (itemsError) {
    console.error("Failed to fetch investigation items:", itemsError)
  }

  // Calculate stats
  const allJobs = items?.map((item: any) => item.job).filter(Boolean) || []
  const completedJobs = allJobs.filter((j: any) => j.status === "completed").length
  const pendingJobs = allJobs.filter((j: any) => ["pending", "running"].includes(j.status)).length
  const failedJobs = allJobs.filter((j: any) => j.status === "failed").length

  const investigationDetail: InvestigationDetail = {
    ...investigation,
    items: items || [],
    stats: {
      total_items: items?.length || 0,
      completed_jobs: completedJobs,
      pending_jobs: pendingJobs,
      failed_jobs: failedJobs,
    },
  }

  const stats = [
    {
      name: "Total Items",
      value: investigationDetail.stats.total_items.toString(),
      icon: FolderOpen,
      color: "text-blue-600",
    },
    {
      name: "Completed",
      value: investigationDetail.stats.completed_jobs.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      name: "Pending",
      value: investigationDetail.stats.pending_jobs.toString(),
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      name: "Failed",
      value: investigationDetail.stats.failed_jobs.toString(),
      icon: AlertCircle,
      color: "text-red-600",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <InvestigationHeader investigation={investigation} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items List - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Investigation Items</h2>
            <AddJobToInvestigation investigationId={id} />
          </div>
          <InvestigationItems items={investigationDetail.items} investigationId={id} />
        </div>

        {/* Timeline - Takes 1 column */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
          <InvestigationTimeline investigation={investigationDetail} />
        </div>
      </div>
    </div>
  )
}
