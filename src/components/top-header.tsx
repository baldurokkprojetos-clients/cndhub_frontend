"use client";

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Search, User, LogOut } from "lucide-react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

export function TopHeader() {
  const [role, setRole] = useState(() => {
    if (typeof window === "undefined") {
      return "master";
    }
    return localStorage.getItem("mock_role") || "master";
  });
  const [isMockMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return !localStorage.getItem("access_token");
  });
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setRole(newRole);
    localStorage.setItem("mock_role", newRole);
    localStorage.removeItem("mock_user_id"); // Remove to prevent role conflict in backend
    localStorage.removeItem("role_permissions");
    localStorage.removeItem("role_permissions_role");
    window.location.reload(); // Reload to apply new role everywhere
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("mock_role");
    localStorage.removeItem("mock_user_id");
    localStorage.removeItem("role_permissions");
    localStorage.removeItem("role_permissions_role");
    queryClient.clear();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/5 bg-zinc-950/40 backdrop-blur-2xl px-4 sm:px-8 shadow-sm">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger className="text-zinc-400 hover:text-white" />
      </div>
      
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md hidden md:flex items-center group">
          <Search className="absolute left-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-lime-400 transition-colors" />
          <input
            type="search"
            placeholder="Buscar clientes, certidões ou jobs..."
            className="h-10 w-full rounded-full border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition-all focus:border-lime-500/50 focus:bg-white/10 focus:ring-2 focus:ring-lime-500/20 placeholder:text-zinc-500 shadow-inner"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        {isMockMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Test Role:</span>
            <select 
              value={role} 
              onChange={handleRoleChange}
              className="bg-zinc-900 border border-zinc-800 text-lime-500 text-xs rounded-lg px-2 py-1 outline-none focus:border-lime-500"
            >
              <option value="master">Master</option>
              <option value="admin">Admin</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
        )}

        <button className="relative rounded-full p-2.5 text-zinc-400 hover:bg-white/10 hover:text-zinc-100 transition-all duration-300 hover:scale-105 active:scale-95 border border-transparent hover:border-white/10">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.8)]"></span>
          </span>
        </button>
        
        <div className="h-8 w-px bg-white/5 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 group p-1.5 rounded-full pr-3 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-lime-400/20 to-lime-500/20 text-lime-400 border border-lime-500/30 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(132,204,22,0.15)]">
              <User className="h-5 w-5" />
            </div>
            <div className="hidden flex-col items-start text-sm sm:flex">
              <span className="font-semibold text-zinc-100 group-hover:text-lime-50 transition-colors">Usuário</span>
              <span className="text-[11px] font-bold text-lime-500 tracking-wider uppercase">{role}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            title="Sair"
            className="flex items-center justify-center p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
