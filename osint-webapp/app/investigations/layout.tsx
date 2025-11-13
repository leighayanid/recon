import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function InvestigationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-16">
          <Sidebar />
        </div>
        <main className="flex-1 md:pl-72">
          <div className="h-full p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
