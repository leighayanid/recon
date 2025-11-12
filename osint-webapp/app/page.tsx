import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Globe, Mail, Phone, Image as ImageIcon, Users, Shield, Zap, Lock } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"

export default function Home() {
  const features = [
    {
      name: "Username Search",
      description: "Search for usernames across 300+ social media platforms with Sherlock, Maigret, and more.",
      icon: Search,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      name: "Domain Analysis",
      description: "Comprehensive domain investigation with subdomain enumeration, DNS analysis, and WHOIS lookup.",
      icon: Globe,
      color: "text-pink-700",
      bgColor: "bg-pink-500/10",
    },
    {
      name: "Email Investigation",
      description: "Investigate email addresses, check breach databases, and find associated accounts.",
      icon: Mail,
      color: "text-orange-700",
      bgColor: "bg-orange-500/10",
    },
    {
      name: "Phone Lookup",
      description: "Lookup phone numbers, identify carriers, and discover associated social media accounts.",
      icon: Phone,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      name: "Image Analysis",
      description: "Extract EXIF metadata, perform reverse image searches, and analyze geolocation data.",
      icon: ImageIcon,
      color: "text-green-700",
      bgColor: "bg-green-500/10",
    },
    {
      name: "Social Media",
      description: "Analyze social media profiles, connections, and public post timelines.",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ]

  const benefits = [
    {
      name: "Secure & Private",
      description: "All investigations are encrypted and isolated in secure Docker containers.",
      icon: Shield,
    },
    {
      name: "Fast Results",
      description: "Asynchronous job processing with real-time updates and progress tracking.",
      icon: Zap,
    },
    {
      name: "Professional Reports",
      description: "Generate comprehensive PDF reports with evidence collection and timeline.",
      icon: Lock,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Open Source Intelligence
              <span className="block text-primary mt-2">Made Simple</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              A comprehensive OSINT platform integrating multiple tools for username search,
              domain analysis, email investigation, and more. All in one place.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Fast Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Professional Tools</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Powerful OSINT Tools
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Access industry-standard OSINT tools through an intuitive web interface
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle>{feature.name}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Why Choose OSINT WebApp?
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Professional-grade features for security researchers, investigators, and analysts
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.name}>
                <CardHeader>
                  <benefit.icon className="h-10 w-10 mb-4 text-primary" />
                  <CardTitle>{benefit.name}</CardTitle>
                  <CardDescription className="text-base">{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to get started?
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Join security researchers and investigators using OSINT WebApp for their investigations
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 OSINT WebApp. For authorized security testing and research purposes only.</p>
          <p className="mt-2">Always ensure compliance with local laws and platform terms of service.</p>
        </div>
      </footer>
    </div>
  )
}
