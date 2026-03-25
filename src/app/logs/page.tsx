"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Activity, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export default function LogsPage() {
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data } = await api.get('/logs/')
      return data
    }
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            Logs do Sistema
          </h1>
          <p className="text-zinc-400 mt-1 text-sm font-medium">Histórico de execução de jobs e worker.</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-lime-500" />
                  Registro de Jobs
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  Acompanhe o status e as tentativas de execução dos jobs.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-950/50">
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="font-semibold text-zinc-400">ID</TableHead>
                      <TableHead className="font-semibold text-zinc-400">Cliente</TableHead>
                      <TableHead className="font-semibold text-zinc-400">Certidão</TableHead>
                      <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                      <TableHead className="font-semibold text-zinc-400">Tentativas</TableHead>
                      <TableHead className="font-semibold text-zinc-400">Criado Em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Carregando logs...</TableCell>
                      </TableRow>
                    ) : jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500">Nenhum log encontrado.</TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job: {id: string, cliente_nome?: string, certidao_tipo?: string, tipo?: string, status: string, tentativas: number, created_at: string}) => (
                        <TableRow key={job.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                          <TableCell className="font-mono text-xs text-zinc-500 py-4">
                            {job.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium text-zinc-200">
                            {job.cliente_nome}
                          </TableCell>
                          <TableCell className="text-zinc-300">
                            {job.certidao_tipo || job.tipo}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${
                              job.status === 'completed' 
                                ? "bg-lime-500/10 text-lime-400 border-lime-500/20" 
                                : job.status === 'error'
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : job.status === 'processing'
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            }`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {job.tentativas}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">
                            {new Date(job.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}