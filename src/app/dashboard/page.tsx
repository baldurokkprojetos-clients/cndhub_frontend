"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CndProcessingCircle } from "@/components/cnd-processing-circle"
import { FileText, Users, Building, Activity, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { api } from "@/lib/api/client"
import { motion, Variants } from "framer-motion"
import { useQuery } from "@tanstack/react-query"

type Atividade = {
  status: string;
  cliente: string;
  tipo: string;
  time: string;
}

type Stats = {
  total_clientes: number;
  certidoes_emitidas: number;
  hubs_ativos: number;
  processamento_hoje: number;
  com_erro: number;
  percentage: number;
  atividades_recentes: Atividade[];
}

export default function DashboardPage() {
  const { data: stats = {
    total_clientes: 0,
    certidoes_emitidas: 0,
    hubs_ativos: 0,
    processamento_hoje: 0,
    com_erro: 0,
    percentage: 0,
    atividades_recentes: []
  }, isLoading: loading, refetch: fetchStats } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    }
  })

  const getActivityIconAndColor = (status: string) => {
    switch(status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-lime-500', bg: 'bg-lime-500/10 border-lime-500/20', text: 'Processamento concluído' }
      case 'error': return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', text: 'Falha no processamento' }
      case 'processing': return { icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', text: 'Processamento em andamento' }
      default: return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', text: 'Nova solicitação na fila' }
    }
  }

  const statCards = [
    { title: "Total de Clientes", value: stats.total_clientes, subtitle: "Sincronizado via banco", icon: Users, color: "text-lime-400" },
    { title: "Certidões Emitidas", value: stats.certidoes_emitidas, subtitle: "Concluídas com sucesso", icon: FileText, color: "text-emerald-400" },
    { title: "Hubs Ativos", value: stats.hubs_ativos, subtitle: "Sistema operante", icon: Building, color: "text-cyan-400" },
    { title: "Certidões Hoje", value: stats.processamento_hoje, subtitle: `${stats.com_erro} com erro`, icon: Activity, color: "text-teal-400" }
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            Dashboard
          </h1>
          <p className="text-zinc-400 mt-1 text-sm font-medium">Visão geral do sistema e processamento de certidões.</p>
        </div>
        <button 
          onClick={() => fetchStats()}
          className="flex items-center gap-2 px-5 py-2.5 bg-lime-500 hover:bg-lime-400 text-zinc-950 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden group hover:border-lime-500/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {card.title}
                </CardTitle>
                <div className="p-2.5 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-800 transition-colors">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-zinc-100 mb-1">{card.value}</div>
                <p className="text-xs text-zinc-500">{card.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
          <Card className="h-full bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-3 text-zinc-100">
                <div className="p-2 bg-lime-500/10 rounded-lg border border-lime-500/20">
                  <Activity className="h-5 w-5 text-lime-400" />
                </div>
                Status de Processamento Global
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[380px] p-6">
              <CndProcessingCircle percentage={stats.percentage} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1">
          <Card className="h-full bg-zinc-900/50 border-zinc-800 backdrop-blur-sm flex flex-col">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-3 text-zinc-100">
                <div className="p-2 bg-lime-500/10 rounded-lg border border-lime-500/20">
                  <Clock className="h-5 w-5 text-lime-400" />
                </div>
                Feed de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              <div className="h-[380px] overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {stats.atividades_recentes?.length > 0 ? stats.atividades_recentes.map((activity, i) => {
                  const style = getActivityIconAndColor(activity.status)
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 group"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.bg} transition-transform group-hover:scale-105`}>
                        <style.icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-zinc-200">{style.text}</p>
                        <div className="flex flex-col gap-1 text-xs text-zinc-500">
                          <span className="text-lime-400/90 font-medium">{activity.cliente}</span>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{activity.tipo === 'emitir_certidao' ? 'Emissão' : activity.tipo}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-700"></span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                }) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-800">
                      <CheckCircle2 className="h-8 w-8 text-zinc-600" />
                    </div>
                    <span className="text-sm font-medium">Nenhuma atividade recente</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
