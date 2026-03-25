"use client"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, RefreshCw, AlertCircle, CheckCircle2, Clock, Plus, Loader2, FileText, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

type Certidao = {
  id: string
  cliente_id: string
  tipo_certidao_id: string
  status: string
  caminho_arquivo?: string
  mensagem_erro?: string
  criado_em: string
}

type Cliente = {
  id: string
  razao_social: string
  cnpj: string
  tipos_certidoes?: string[]
}

type TipoCertidao = {
  id: string
  nome: string
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "valida":
      return <span className="inline-flex items-center gap-1.5 rounded-md bg-lime-500/10 px-2.5 py-1 text-xs font-semibold text-lime-400 border border-lime-500/20"><CheckCircle2 className="h-3.5 w-3.5" /> Concluída</span>
    case "processing":
    case "pending":
    case "processando":
      return <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20"><Clock className="h-3.5 w-3.5 animate-pulse" /> Processando</span>
    case "error":
    case "erro":
      return <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20"><AlertCircle className="h-3.5 w-3.5" /> Erro</span>
    default:
      return <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-500/10 px-2.5 py-1 text-xs font-semibold text-zinc-400 border border-zinc-500/20"><AlertCircle className="h-3.5 w-3.5" /> {status}</span>
  }
}

export default function CertidoesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<string>("")
  const [selectedTiposCertidao, setSelectedTiposCertidao] = useState<string[]>([])
  const [userRole, setUserRole] = useState("master")

  const queryClient = useQueryClient()

  const { data: certidoes = [], isLoading: isLoadingCertidoes } = useQuery<Certidao[]>({
    queryKey: ['certidoes'],
    queryFn: async () => {
      const { data } = await api.get('/certidoes/')
      return data
    },
    refetchInterval: (query) => {
      // Poll a cada 5 segundos se houver alguma certidão em processamento
      const hasPending = query.state.data?.some(c => 
        ['pending', 'processing', 'processando'].includes(c.status.toLowerCase())
      )
      return hasPending ? 5000 : false
    }
  })

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/')
      return data
    }
  })

  const { data: tiposCertidaoData = [], isLoading: isLoadingTipos } = useQuery<TipoCertidao[]>({
    queryKey: ['tipos-certidao'],
    queryFn: async () => {
      const { data } = await api.get('/tipos-certidao/')
      return data
    }
  })

  // Deduplicar tipos de certidão pelo nome (caso haja duplicatas do DB)
  const tiposCertidao = Array.from(new Map(tiposCertidaoData.map((item: TipoCertidao) => [item.nome, item])).values()) as TipoCertidao[]
  const selectedClienteData = clientes.find(c => c.id === selectedCliente)
  const availableTiposCertidao = userRole === "cliente"
    ? tiposCertidao.filter(tipo => selectedClienteData?.tipos_certidoes?.includes(tipo.id))
    : tiposCertidao

  useEffect(() => {
    setTimeout(() => {
      setUserRole(localStorage.getItem("mock_role") || "master")
    }, 0)
  }, [])


  const getDefaultPermissions = (role: string) => {
    if (role === "master") {
      return {
        import_certidoes: true,
        emitir_certidao: true
      }
    }
    if (role === "admin") {
      return {
        import_certidoes: true,
        emitir_certidao: true
      }
    }
    return {
      import_certidoes: true,
      emitir_certidao: true
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

  const createJobMutation = useMutation({
    mutationFn: async (variables?: { cliente_id: string; tipo_certidao_id: string }) => {
      const { data } = await api.post('/jobs/', {
        cliente_id: variables?.cliente_id,
        tipo_certidao_id: variables?.tipo_certidao_id,
        tipo: "emitir_certidao"
      })
      return data
    },
    onMutate: async (variables) => {
      // Cancelar queries ativas para não sobrescrever o optimistic update
      await queryClient.cancelQueries({ queryKey: ['certidoes'] })

      // Pegar os dados anteriores para poder reverter em caso de erro
      const previousCertidoes = queryClient.getQueryData<Certidao[]>(['certidoes'])

      // Fazer o optimistic update mudando o status para "pending" (Processando)
      if (previousCertidoes && variables) {
        queryClient.setQueryData<Certidao[]>(['certidoes'], (old) => {
          if (!old) return []
          return old.map(c => {
            if (c.cliente_id === variables.cliente_id && c.tipo_certidao_id === variables.tipo_certidao_id) {
              return { ...c, status: "pending", mensagem_erro: "" }
            }
            return c
          })
        })
      }

      return { previousCertidoes }
    },
    onError: (err: Error & { response?: { status: number } }, newJob, context) => {
      // Se der erro, reverter para os dados anteriores
      if (context?.previousCertidoes) {
        queryClient.setQueryData(['certidoes'], context.previousCertidoes)
      }
      if (err?.response?.status !== 400) {
        console.error("Erro ao processar:", err);
        toast.error("Erro ao processar a certidão.")
      }
    },
    onSettled: () => {
      // Sempre refetch no final para garantir sincronia com o DB
      queryClient.invalidateQueries({ queryKey: ['certidoes'] })
    },
    onSuccess: () => {
      // toast de sucesso é disparado no componente ou aqui
    }
  })

  const handleCreateJob = async () => {
    if (!selectedCliente || selectedTiposCertidao.length === 0) {
      toast.error("Selecione um cliente e pelo menos um tipo de certidão.")
      return
    }

    try {
      for (const tipo_id of selectedTiposCertidao) {
        await createJobMutation.mutateAsync({
          cliente_id: selectedCliente,
          tipo_certidao_id: tipo_id
        })
      }
      setIsJobDialogOpen(false)
      setSelectedCliente("")
      setSelectedTiposCertidao([])
      toast.success("Jobs criados com sucesso!")
    } catch (error) {
      console.error("Erro ao criar múltiplos jobs", error)
      toast.error("Erro ao criar alguns jobs.")
    }
  }

  const getClienteName = (id: string) => clientes.find(c => c.id === id)?.razao_social || id
  const getTipoName = (id: string) => tiposCertidao.find(t => t.id === id)?.nome || id

  const filteredCertidoes = certidoes.filter(c => {
    const clienteName = getClienteName(c.cliente_id).toLowerCase()
    const tipoName = getTipoName(c.tipo_certidao_id).toLowerCase()
    const search = searchTerm.toLowerCase()
    return clienteName.includes(search) || tipoName.includes(search)
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }



  const isLoading = isLoadingCertidoes || isLoadingClientes || isLoadingTipos
  const isCreatingJob = createJobMutation.isPending

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
            Gestão de Certidões
          </h1>
          <p className="text-zinc-400 mt-1 text-sm font-medium">Acompanhe e solicite a emissão de certidões.</p>
        </div>
        
        {hasPermission("import_certidoes") && (
          <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
            <DialogTrigger render={<Button className="bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold transition-all duration-300 w-full sm:w-auto rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] hover:scale-105 active:scale-95" onClick={() => { setSelectedCliente(""); setSelectedTiposCertidao([]); }}>
                  <Plus className="mr-2 h-5 w-5" />
                  Nova Solicitação
                </Button>} />
          <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-lime-500 flex items-center gap-2">
                <PlayCircle className="h-6 w-6" />
                Novo Processamento
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="font-semibold text-zinc-400">Cliente</Label>
                <Select value={selectedCliente} onValueChange={(val) => { setSelectedCliente(val || ""); setSelectedTiposCertidao([]); }}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus:ring-lime-500">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                        {c.razao_social} <span className="text-zinc-500 text-xs ml-2">({c.cnpj})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 mt-2">
                <Label className="font-semibold text-zinc-400">Selecione os Tipos de Certidão</Label>
                <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto p-3 border border-zinc-800 rounded-xl bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800">
                    <input
                      type="checkbox"
                      id="select_all_certidoes"
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                      checked={selectedTiposCertidao.length === availableTiposCertidao.length && availableTiposCertidao.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTiposCertidao(availableTiposCertidao.map(t => t.id))
                        } else {
                          setSelectedTiposCertidao([])
                        }
                      }}
                    />
                    <Label htmlFor="select_all_certidoes" className="text-zinc-300 cursor-pointer font-bold select-none">
                      Selecionar Todos
                    </Label>
                  </div>
                  {availableTiposCertidao.length === 0 && (
                    <div className="text-sm text-zinc-500 px-2 py-2">
                      Nenhum tipo de certidão foi vinculado para este cliente.
                    </div>
                  )}
                  {availableTiposCertidao.map(tipo => (
                    <div key={tipo.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        id={`certidao_${tipo.id}`}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500 focus:ring-offset-0 transition-all cursor-pointer"
                        checked={selectedTiposCertidao.includes(tipo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTiposCertidao([...selectedTiposCertidao, tipo.id])
                          } else {
                            setSelectedTiposCertidao(selectedTiposCertidao.filter(id => id !== tipo.id))
                          }
                        }}
                      />
                      <Label htmlFor={`certidao_${tipo.id}`} className="text-zinc-300 cursor-pointer flex-1 select-none group-hover:text-lime-400 transition-colors">
                        {tipo.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setIsJobDialogOpen(false)} className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl transition-all" disabled={isCreatingJob}>Cancelar</Button>
              <Button onClick={handleCreateJob} disabled={isCreatingJob || availableTiposCertidao.length === 0} className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400 transition-all rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.2)]">
                {isCreatingJob ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                Importar
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/50 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-lime-500" />
                Certidões Emitidas e em Processamento
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row w-full gap-3 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input 
                  type="text" 
                  placeholder="Buscar por cliente ou tipo de certidão..." 
                  className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-lime-500 rounded-xl transition-all h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-900/80">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-400 h-12">Cliente</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Tipo</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Criado em</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-lime-500" />
                        Carregando certidões...
                      </TableCell>
                    </TableRow>
                  ) : filteredCertidoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-10 w-10 text-zinc-700 mb-3" />
                          <p>Nenhuma certidão encontrada.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCertidoes.map((certidao) => (
                    <TableRow key={certidao.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                      <TableCell className="font-medium text-zinc-200 py-4">
                        <div className="max-w-[150px] sm:max-w-[250px] truncate" title={getClienteName(certidao.cliente_id)}>
                          {getClienteName(certidao.cliente_id)}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">{getTipoName(certidao.tipo_certidao_id)}</TableCell>
                      <TableCell className="text-zinc-400">{new Date(certidao.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(certidao.status)}
                          {certidao.mensagem_erro && <div className="text-[10px] text-rose-400/80 mt-1 max-w-[200px] truncate" title={certidao.mensagem_erro}>{certidao.mensagem_erro}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                          {hasPermission("emitir_certidao") && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 bg-lime-500/10 text-lime-400 hover:text-lime-300 hover:bg-lime-500/20 flex items-center gap-1 border border-lime-500/20" 
                              title="Emitir/Atualizar Certidão" 
                              onClick={() => {
                                createJobMutation.mutate({
                                  cliente_id: certidao.cliente_id,
                                  tipo_certidao_id: certidao.tipo_certidao_id
                                }, {
                                  onSuccess: () => {
                                    toast.success("Job de emissão criado com sucesso!")
                                  }
                                });
                              }}
                              disabled={createJobMutation.isPending}
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${createJobMutation.isPending ? 'animate-spin' : ''}`} />
                              <span className="hidden sm:inline font-medium">Emitir</span>
                            </Button>
                          )}
                          
                          {(certidao.status.toLowerCase() === "completed" || certidao.status.toLowerCase() === "valida" || certidao.caminho_arquivo) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 bg-zinc-800 text-zinc-400 hover:text-lime-400 hover:bg-lime-500/10 border border-zinc-700 hover:border-lime-500/30 transition-all rounded-lg" 
                              title="Baixar PDF" 
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/certidoes/${certidao.id}/download`, {
                                    responseType: 'blob'
                                  });
                                  
                                  if (response.data.type === 'application/json') {
                                    // It might be an object containing a url if it fell back to a public URL
                                    const text = await response.data.text();
                                    const json = JSON.parse(text);
                                    if (json.url) {
                                      window.open(json.url, '_blank');
                                      return;
                                    }
                                  }

                                  const url = window.URL.createObjectURL(new Blob([response.data]));
                                  const link = document.createElement('a');
                                  link.href = url;
                                  
                                  // Try to get filename from Content-Disposition header
                                  let filename = `certidao_${certidao.id}.pdf`;
                                  const contentDisposition = response.headers['content-disposition'];
                                  if (contentDisposition) {
                                    const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*utf-8''([^;]+)/i);
                                    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                                    
                                    if (filenameStarMatch && filenameStarMatch[1]) {
                                      filename = decodeURIComponent(filenameStarMatch[1]);
                                    } else if (filenameMatch && filenameMatch[1]) {
                                      filename = filenameMatch[1];
                                    }
                                  }
                                  
                                  link.setAttribute('download', filename);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error("Erro ao baixar certidão", error);
                                  toast.error("Erro ao baixar arquivo da certidão.");
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
