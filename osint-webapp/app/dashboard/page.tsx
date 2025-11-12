import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Globe, Mail, Phone, Image as ImageIcon, Users, Activity, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const tools = [
    {
      name: "Username Search",
      description: "Search for usernames across multiple platforms",
      icon: Search,
      href: "/tools/username",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      name: "Domain Analysis",
      description: "Analyze domains, subdomains, and DNS records",
      icon: Globe,
      href: "/tools/domain",
      color: "text-pink-700",
      bgColor: "bg-pink-500/10",
    },
    {
      name: "Email Investigation",
      description: "Investigate email addresses and find breaches",
      icon: Mail,
      href: "/tools/email",
      color: "text-orange-700",
      bgColor: "bg-orange-500/10",
    },
    {
      name: "Phone Lookup",
      description: "Lookup phone numbers and carrier information",
      icon: Phone,
      href: "/tools/phone",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      name: "Image Analysis",
      description: "Extract metadata and perform reverse image search",
      icon: ImageIcon,
      href: "/tools/image",
      color: "text-green-700",
      bgColor: "bg-green-500/10",
    },
    {
      name: "Social Media",
      description: "Analyze social media profiles and connections",
      icon: Users,
      href: "/tools/social",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  const stats = [
    {
      name: "Total Investigations",
      value: "0",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      name: "Completed Jobs",
      value: "0",
      icon: Clock,
      color: "text-green-600",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name || user.email}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your OSINT investigations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Quick Access Tools */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card
              key={tool.name}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-2`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              No recent activity. Start by running your first investigation!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
