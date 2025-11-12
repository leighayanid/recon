"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  Search,
  Globe,
  Mail,
  Phone,
  Image,
  Users,
  FileText,
  Folder,
  Settings,
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Username Search",
    icon: Search,
    href: "/tools/username",
    color: "text-violet-500",
  },
  {
    label: "Domain Analysis",
    icon: Globe,
    href: "/tools/domain",
    color: "text-pink-700",
  },
  {
    label: "Email Investigation",
    icon: Mail,
    href: "/tools/email",
    color: "text-orange-700",
  },
  {
    label: "Phone Lookup",
    icon: Phone,
    href: "/tools/phone",
    color: "text-emerald-500",
  },
  {
    label: "Image Analysis",
    icon: Image,
    href: "/tools/image",
    color: "text-green-700",
  },
  {
    label: "Social Media",
    icon: Users,
    href: "/tools/social",
    color: "text-blue-500",
  },
  {
    label: "Investigations",
    icon: Folder,
    href: "/investigations",
    color: "text-yellow-500",
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
    color: "text-red-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-gray-500",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-neutral-900 text-white">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
