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
import { Plus, Search, Edit2, Trash2, Loader2, PlayCircle, Users } from "lucide-react"
import { motion } from "framer-motion"

type Cliente = {
  id: string
  razao_social: string
  cnpj: string
  telefone: string
  email: string
  responsavel: string
  ativo: boolean
  tipos_certidoes?: string[]
  hub_id?: string
}

type TipoCertidao = {
  id: string
  nome: string
}

export default function ClientesPage() {
  const queryClient = useQueryClient()
  const [userRole, setUserRole] = useState("master")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedClienteForJob, setSelectedClienteForJob] = useState<Cliente | null>(null)
  const [selectedTiposCertidao, setSelectedTiposCertidao] = useState<string[]>([])

  useEffect(() => {
    setTimeout(() => {
      setUserRole(localStorage.getItem("mock_role") || "master")
    }, 0)
  }, [])

  const getDefaultPermissions = (role: string) => {
    if (role === "master") {
      return {
        create_cliente: true,
        edit_cliente: true,
        inactivate_cliente: true,
        import_certidoes: true
      }
    }
    if (role === "admin") {
      return {
        create_cliente: true,
        edit_cliente: true,
        inactivate_cliente: true,
        import_certidoes: true
      }
    }
    return {
      create_cliente: false,
      edit_cliente: false,
      inactivate_cliente: false,
      import_certidoes: true
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
  
  // Form state
  const [formData, setFormData] = useState({
    cnpj: "",
    razao_social: "",
    responsavel: "",
    telefone: "",
    email: "",
    ativo: true,
    tipos_certidoes: [] as string[],
    hub_id: ""
  })

  // Queries
  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs'],
    queryFn: async () => {
      const { data } = await api.get('/hubs/')
      return data
    }
  })
  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/')
      return data
    }
  })

  const { data: tiposCertidaoData = [] } = useQuery<TipoCertidao[]>({
    queryKey: ['tipos-certidao'],
    queryFn: async () => {
      const { data } = await api.get('/tipos-certidao/')
      return data
    }
  })

  // Deduplicar tipos de certidão pelo nome para evitar duplicatas visuais
  const tiposCertidao = Array.from(new Map(tiposCertidaoData.map((item: TipoCertidao) => [item.nome, item])).values()) as TipoCertidao[]
  const availableTiposCertidao = userRole === "cliente"
    ? tiposCertidao.filter(tipo => selectedClienteForJob?.tipos_certidoes?.includes(tipo.id))
    : tiposCertidao


  // Mutations
  const createMutation = useMutation({
    mutationFn: async (newCliente: typeof formData) => {
      const { data } = await api.post('/clientes/', newCliente)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setIsDialogOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Cliente> & { id: string }) => {
      const { data } = await api.put(`/clientes/${id}`, updateData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setIsDialogOpen(false)
    }
  })



  const createJobMutation = useMutation({
    mutationFn: async (data: { cliente_id: string, tipo_certidao_id: string }) => {
      const response = await api.post('/jobs/', data)
      return response.data
    },
    onSuccess: () => {
      // Ocultado sucesso individual pois enviaremos múltiplos
    },
    onError: (error: Error & { response?: { status: number } }) => {
      // Ignorar erro 400 que é a constraint de unique para não sujar o log visualmente, 
      // ou apenas mostrar se for diferente
      if (error?.response?.status !== 400) {
        console.error("Erro ao criar job:", error);
      }
    }
  })

  const filteredClientes = clientes.filter(c => 
    c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj.includes(searchTerm)
  )

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        cnpj: cliente.cnpj || "",
        razao_social: cliente.razao_social || "",
        responsavel: cliente.responsavel || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        ativo: cliente.ativo,
        tipos_certidoes: cliente.tipos_certidoes || [],
        hub_id: cliente.hub_id || (hubs.length === 1 ? hubs[0].id : "")
      })
    } else {
      setEditingCliente(null)
      setFormData({
        cnpj: "",
        razao_social: "",
        responsavel: "",
        telefone: "",
        email: "",
        ativo: true,
        tipos_certidoes: [],
        hub_id: hubs.length === 1 ? hubs[0].id : ""
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.cnpj || !formData.razao_social) {
      alert("CNPJ e Razão Social são obrigatórios.")
      return
    }

    if (hubs.length > 1 && !formData.hub_id) {
      alert("Selecione uma HUB.")
      return
    }

    // Se houver só uma hub, garante que seja enviada
    const payload = { ...formData }
    if (hubs.length === 1 && !payload.hub_id) {
      payload.hub_id = hubs[0].id
    }

    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    // Para simplificar, o "Inativar" usará o updateMutation
    if (window.confirm("Tem certeza que deseja inativar este cliente?")) {
      updateMutation.mutate({ id, ativo: false })
    }
  }

  const handleOpenJobDialog = (cliente: Cliente) => {
    setSelectedClienteForJob(cliente)
    setSelectedTiposCertidao([])
    setIsJobDialogOpen(true)
  }

  const handleCreateJob = async () => {
    if (!selectedClienteForJob || selectedTiposCertidao.length === 0) {
      alert("Selecione pelo menos um tipo de certidão.")
      return
    }
    
    try {
      for (const tipo_id of selectedTiposCertidao) {
        await createJobMutation.mutateAsync({
          cliente_id: selectedClienteForJob.id,
          tipo_certidao_id: tipo_id
        })
      }
      setIsJobDialogOpen(false)
      setSelectedTiposCertidao([])
      alert("Jobs criados com sucesso para as certidões selecionadas!")
    } catch (error) {
      console.error("Erro ao criar múltiplos jobs", error)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
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
            Gestão de Clientes
          </h1>
          <p className="text-zinc-400 mt-1 text-sm font-medium">Gerencie clientes e crie novos jobs de certidão.</p>
        </div>
        
        {hasPermission("create_cliente") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold transition-all duration-300 w-full sm:w-auto rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] hover:scale-105 active:scale-95" onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-5 w-5" />
                  Novo Cliente
                </Button>} />
          <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-lime-500">{editingCliente ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              {hubs.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="hub" className="sm:text-right font-semibold text-zinc-400">HUB <span className="text-rose-500">*</span></Label>
                  <div className="sm:col-span-3">
                    <Select value={formData.hub_id || undefined} onValueChange={(v) => setFormData({...formData, hub_id: v || ""})}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus:ring-lime-500 w-full">
                        <SelectValue placeholder="Selecione a HUB">
                          {hubs.find((h: { id: string; nome: string }) => h.id === formData.hub_id)?.nome || "Selecione a HUB"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl">
                        {hubs.map((h: { id: string; nome: string }) => (
                          <SelectItem key={h.id} value={h.id} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                            {h.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="cnpj" className="sm:text-right font-semibold text-zinc-400">CNPJ <span className="text-rose-500">*</span></Label>
                <Input 
                  id="cnpj" 
                  className="sm:col-span-3 focus-visible:ring-lime-500 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl placeholder:text-zinc-600 transition-all focus:bg-zinc-900" 
                  placeholder="00.000.000/0000-00" 
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="razao" className="sm:text-right font-semibold text-zinc-400">Razão Social <span className="text-rose-500">*</span></Label>
                <Input 
                  id="razao" 
                  className="sm:col-span-3 focus-visible:ring-lime-500 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl placeholder:text-zinc-600 transition-all focus:bg-zinc-900" 
                  placeholder="Nome da empresa"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="resp" className="sm:text-right font-semibold text-zinc-400">Responsável</Label>
                <Input 
                  id="resp" 
                  className="sm:col-span-3 focus-visible:ring-lime-500 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl placeholder:text-zinc-600 transition-all focus:bg-zinc-900" 
                  placeholder="Nome do responsável"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="tel" className="sm:text-right font-semibold text-zinc-400">Telefone</Label>
                <Input 
                  id="tel" 
                  className="sm:col-span-3 focus-visible:ring-lime-500 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl placeholder:text-zinc-600 transition-all focus:bg-zinc-900" 
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="email" className="sm:text-right font-semibold text-zinc-400">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  className="sm:col-span-3 focus-visible:ring-lime-500 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl placeholder:text-zinc-600 transition-all focus:bg-zinc-900" 
                  placeholder="email@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4 mt-2">
                <Label className="sm:text-right font-semibold text-zinc-400 pt-2">Certidões Permitidas</Label>
                <div className="sm:col-span-3 flex flex-col gap-1 max-h-[150px] overflow-y-auto p-3 border border-zinc-800 rounded-xl bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  <div className="flex items-center gap-3 mb-2 pb-2 border-b border-zinc-800">
                    <input
                      type="checkbox"
                      id="select_all_form"
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                      checked={formData.tipos_certidoes.length === tiposCertidao.length && tiposCertidao.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, tipos_certidoes: tiposCertidao.map(t => t.id)})
                        } else {
                          setFormData({...formData, tipos_certidoes: []})
                        }
                      }}
                    />
                    <Label htmlFor="select_all_form" className="text-zinc-300 cursor-pointer font-bold select-none text-sm">
                      Selecionar Todas
                    </Label>
                  </div>
                  {tiposCertidao.map(tipo => (
                    <div key={tipo.id} className="flex items-center gap-3 p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        id={`form_certidao_${tipo.id}`}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500 focus:ring-offset-0 transition-all cursor-pointer"
                        checked={formData.tipos_certidoes.includes(tipo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, tipos_certidoes: [...formData.tipos_certidoes, tipo.id]})
                          } else {
                            setFormData({...formData, tipos_certidoes: formData.tipos_certidoes.filter(id => id !== tipo.id)})
                          }
                        }}
                      />
                      <Label htmlFor={`form_certidao_${tipo.id}`} className="text-zinc-400 cursor-pointer group-hover:text-zinc-200 transition-colors text-sm">
                        {tipo.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
              <Button variant="outline" className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl transition-all" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400 transition-all rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.2)]" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Cliente
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        )}

        <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
          <DialogContent className="sm:max-w-[450px] bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-lime-500 flex items-center gap-2">
                <PlayCircle className="h-6 w-6" />
                Importar Certidões
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <p className="text-sm text-zinc-500">Cliente Selecionado</p>
                <p className="text-lg font-bold text-zinc-100 mt-1">{selectedClienteForJob?.razao_social}</p>
                <p className="text-xs text-zinc-400 mt-1">{selectedClienteForJob?.cnpj}</p>
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
                            setSelectedTiposCertidao(prev => [...prev, tipo.id])
                          } else {
                            setSelectedTiposCertidao(prev => prev.filter(id => id !== tipo.id))
                          }
                        }}
                      />
                      <Label htmlFor={`certidao_${tipo.id}`} className="text-zinc-400 cursor-pointer group-hover:text-zinc-200 transition-colors">
                        {tipo.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl transition-all" onClick={() => setIsJobDialogOpen(false)} disabled={isCreatingJob}>Cancelar</Button>
              <Button className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400 transition-all rounded-xl shadow-[0_0_15px_rgba(132,204,22,0.2)]" onClick={handleCreateJob} disabled={isCreatingJob || availableTiposCertidao.length === 0}>
                {isCreatingJob && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm text-zinc-100 shadow-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-zinc-800/50 bg-zinc-900/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-lime-500" />
                Lista de Clientes
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-lime-500 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-950/50">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-400 h-12">Razão Social</TableHead>
                    <TableHead className="font-semibold text-zinc-400">CNPJ</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Responsável</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Contato</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-lime-500" />
                        Carregando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="h-10 w-10 text-zinc-700 mb-3" />
                          <p>Nenhum cliente encontrado.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                        <TableCell className="font-medium text-zinc-200 py-4">{cliente.razao_social}</TableCell>
                        <TableCell className="text-zinc-400">{cliente.cnpj}</TableCell>
                        <TableCell className="text-zinc-400">{cliente.responsavel || "-"}</TableCell>
                        <TableCell className="text-zinc-400">
                          {cliente.email && <div className="truncate max-w-[150px]" title={cliente.email}>{cliente.email}</div>}
                          {cliente.telefone && <div className="text-xs text-zinc-500 mt-1">{cliente.telefone}</div>}
                          {!cliente.email && !cliente.telefone && "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${
                            cliente.ativo 
                              ? "bg-lime-500/10 text-lime-400 border-lime-500/20" 
                              : "bg-zinc-800/50 text-zinc-500 border-zinc-700"
                          }`}>
                            {cliente.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 transition-opacity">
                            {hasPermission("import_certidoes") && (
                              <Button variant="ghost" size="icon" title="Importar Certidões" className="h-8 w-8 text-zinc-400 hover:text-lime-400 hover:bg-lime-500/10 rounded-lg" onClick={() => handleOpenJobDialog(cliente)}>
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("edit_cliente") && (
                              <Button variant="ghost" size="icon" title="Editar" className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg" onClick={() => handleOpenDialog(cliente)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("inactivate_cliente") && (
                              <Button variant="ghost" size="icon" title="Inativar" className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg" onClick={() => handleDelete(cliente.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
    </div>
  )
}
