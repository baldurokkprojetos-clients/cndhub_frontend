"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopHeader } from "@/components/top-header"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isAuthRoute = pathname?.startsWith('/login') || 
                      pathname?.startsWith('/verify-email') || 
                      pathname?.startsWith('/forgot-password') || 
                      pathname?.startsWith('/reset-password')
  const token = typeof window !== "undefined" ? localStorage.getItem('access_token') : null
  const shouldRedirect = !token && !isAuthRoute

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login')
    }
  }, [shouldRedirect, router])

  // Don't render content until authentication is verified
  if (shouldRedirect) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div></div>
  }

  if (isAuthRoute) {
    return <div className="min-h-screen w-full">{children}</div>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative overflow-hidden bg-zinc-950">
        {/* Modern Ambient Background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-[128px] opacity-50 mix-blend-screen pointer-events-none animate-in fade-in duration-1000" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lime-600/5 rounded-full blur-[128px] opacity-50 mix-blend-screen pointer-events-none animate-in fade-in duration-1000 delay-300" />
        <div className="absolute inset-0 bg-zinc-950/10 opacity-[0.015] pointer-events-none" />
        
        <div className="relative z-10 flex w-full h-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col w-full overflow-hidden">
            <TopHeader />
            <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
