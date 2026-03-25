"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Hexagon,
  Activity,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"

// Definição dos itens de menu baseados no Prompt.yaml
const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["master", "admin", "cliente"],
    permission: "access_dashboard"
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
    roles: ["master", "admin", "cliente"],
    permission: "access_clientes"
  },
  {
    title: "Certidões",
    url: "/certidoes",
    icon: FileText,
    roles: ["master", "admin", "cliente"],
    permission: "access_certidoes"
  },
  {
    title: "Administração",
    url: "/admin",
    icon: Settings,
    roles: ["master", "admin"],
    permission: "access_admin"
  },
  {
    title: "Logs",
    url: "/logs",
    icon: Activity,
    roles: ["master"],
    permission: "access_logs"
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const [userRole, setUserRole] = useState("master")
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    setTimeout(() => {
      setUserRole(localStorage.getItem("mock_role") || "master")
    }, 0)
  }, [])

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const getDefaultPermissions = (role: string) => {
    if (role === "master") {
      return {
        access_dashboard: true,
        access_clientes: true,
        access_certidoes: true,
        access_admin: true,
        access_logs: true
      }
    }
    if (role === "admin") {
      return {
        access_dashboard: true,
        access_clientes: true,
        access_certidoes: true,
        access_admin: true,
        access_logs: false
      }
    }
    return {
      access_dashboard: true,
      access_clientes: true,
      access_certidoes: true,
      access_admin: false,
      access_logs: false
    }
  }

  const hasPermission = (permission: string) => {
    if (typeof window === "undefined") {
      return true
    }
    const storedRole = localStorage.getItem("role_permissions_role")
    const currentRole = localStorage.getItem("mock_role") || "master"
    const raw = localStorage.getItem("role_permissions")
    if (raw && storedRole === currentRole) {
      try {
        const parsed = JSON.parse(raw) as Record<string, boolean>
        if (permission in parsed) {
          return parsed[permission]
        }
      } catch {
        return getDefaultPermissions(currentRole)[permission as keyof ReturnType<typeof getDefaultPermissions>] ?? true
      }
    }
    const fallback = getDefaultPermissions(currentRole)
    return fallback[permission as keyof typeof fallback] ?? true
  }

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole) && (!item.permission || hasPermission(item.permission)))

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("mock_role")
    localStorage.removeItem("mock_user_id")
    localStorage.removeItem("role_permissions")
    localStorage.removeItem("role_permissions_role")
    queryClient.clear()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-zinc-950/40 backdrop-blur-2xl">
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 shadow-[0_0_20px_rgba(132,204,22,0.3)]">
            <Hexagon className="h-6 w-6 text-zinc-950 fill-zinc-950" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white group-data-[collapsible=icon]:hidden">
            Politeto<span className="text-lime-400">CND</span>
          </h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-4 px-2 group-data-[collapsible=icon]:hidden">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {filteredMenu.map((item) => {
                const isActive = pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      render={<Link href={item.url} onClick={handleMenuClick} />} 
                      isActive={isActive}
                      className={`
                        relative overflow-hidden rounded-xl transition-all duration-300 py-6 px-4 group
                        ${isActive 
                          ? "bg-lime-500/10 text-lime-400 font-semibold border border-lime-500/20" 
                          : "text-zinc-400 font-medium hover:bg-white/5 hover:text-zinc-100 border border-transparent"
                        }
                      `}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-lime-400 rounded-r-full shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
                      )}
                      <item.icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 py-6 px-4 group border border-transparent hover:border-red-500/20"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
