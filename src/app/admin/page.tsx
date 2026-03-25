"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Shield, Users, Edit2, Trash2, Plus, Settings as SettingsIcon, Building } from "lucide-react"
import { motion } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const permissionOptions = [
  { key: "access_dashboard", label: "Acessar Dashboard" },
  { key: "access_clientes", label: "Acessar Clientes" },
  { key: "access_certidoes", label: "Acessar Certidões" },
  { key: "access_admin", label: "Acessar Administração" },
  { key: "access_logs", label: "Acessar Logs" },
  { key: "create_cliente", label: "Criar Cliente" },
  { key: "edit_cliente", label: "Editar Cliente" },
  { key: "inactivate_cliente", label: "Inativar Cliente" },
  { key: "import_certidoes", label: "Importar Certidões" },
  { key: "emitir_certidao", label: "Emitir Certidão" },
  { key: "manage_users", label: "Gerenciar Usuários" },
  { key: "manage_hubs", label: "Gerenciar HUBs" },
  { key: "manage_worker_config", label: "Gerenciar Configurações do Worker" }
]

const defaultRolePermissions = {
  master: {
    access_dashboard: true,
    access_clientes: true,
    access_certidoes: true,
    access_admin: true,
    access_logs: true,
    create_cliente: true,
    edit_cliente: true,
    inactivate_cliente: true,
    import_certidoes: true,
    emitir_certidao: true,
    manage_users: true,
    manage_hubs: true,
    manage_worker_config: true
  },
  admin: {
    access_dashboard: true,
    access_clientes: true,
    access_certidoes: true,
    access_admin: true,
    access_logs: false,
    create_cliente: true,
    edit_cliente: true,
    inactivate_cliente: true,
    import_certidoes: true,
    emitir_certidao: true,
    manage_users: true,
    manage_hubs: false,
    manage_worker_config: false
  },
  cliente: {
    access_dashboard: true,
    access_clientes: true,
    access_certidoes: true,
    access_admin: false,
    access_logs: false,
    create_cliente: false,
    edit_cliente: false,
    inactivate_cliente: false,
    import_certidoes: true,
    emitir_certidao: true,
    manage_users: false,
    manage_hubs: false,
    manage_worker_config: false
  }
}

const buildRolePermissions = (data?: {chave: string; valor: string}[]) => {
  const parseBool = (value?: string) => {
    if (!value) return undefined
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false
    return undefined
  }
  const nextPermissions = JSON.parse(JSON.stringify(defaultRolePermissions)) as typeof defaultRolePermissions
  if (!data) {
    return nextPermissions
  }
  const roles = ["master", "admin", "cliente"]
  roles.forEach(role => {
    permissionOptions.forEach(option => {
      const key = `perm_${role}_${option.key}`
      const found = data.find((item) => item.chave === key)
      const parsed = parseBool(found?.valor)
      if (typeof parsed === "boolean") {
        nextPermissions[role as keyof typeof defaultRolePermissions][option.key as keyof typeof defaultRolePermissions.master] = parsed
      }
    })
  })
  return nextPermissions
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<{id: string; nome: string; email: string; role: string; hub_ids?: string[]; cliente_ids?: string[]} | null>(null)
  const [userFormData, setUserFormData] = useState({
    nome: "",
    email: "",
    role: "master",
    senha: "",
    hub_ids: [] as string[],
    cliente_ids: [] as string[]
  })

  // Queries
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get('/clientes/')
      return data
    }
  })

  const { data: hubs = [] } = useQuery({
    queryKey: ['hubs'],
    queryFn: async () => {
      const { data } = await api.get('/hubs/')
      return data
    }
  })

  // Worker Config State
  const [workerConfig, setWorkerConfig] = useState({
    worker_timeout: "60",
    max_retries: "3",
    user_data_dir: "/worker/core/uc_profile",
    twocaptcha_api_key: "",
    resend_api_key: "",
    smtp_host: "",
    smtp_port: "465",
    smtp_user: "",
    smtp_pass: "",
    smtp_from: ""
  })

  const [rolePermissionsOverride, setRolePermissionsOverride] = useState<typeof defaultRolePermissions | null>(null)

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await api.get('/usuarios/')
      return data
    }
  })

  const { data: configsData } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data } = await api.get('/configuracoes/')
      return data
    }
  })

  const rolePermissions = useMemo(() => {
    const data = Array.isArray(configsData) ? configsData : undefined
    return rolePermissionsOverride ?? buildRolePermissions(data)
  }, [configsData, rolePermissionsOverride])

  // HUB Modal State
  const [isHubDialogOpen, setIsHubDialogOpen] = useState(false)
  const [editingHub, setEditingHub] = useState<{id: string; nome: string; api_key?: string} | null>(null)
  const [hubFormData, setHubFormData] = useState({
    nome: ""
  })

  const [userRole, setUserRole] = useState("master")
  useEffect(() => {
    setTimeout(() => {
      setUserRole(localStorage.getItem("mock_role") || "master")
    }, 0)
  }, [])

  useEffect(() => {
    if (userRole === "cliente") {
      router.push("/dashboard")
    }
  }, [userRole, router])

  useEffect(() => {
    if (configsData && Array.isArray(configsData)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkerConfig(prev => {
        const newConfig = { ...prev }
        let hasChanges = false
        configsData.forEach((item: {chave: string; valor: string}) => {
          if (item.chave in newConfig && (newConfig as Record<string, string>)[item.chave] !== item.valor) {
            (newConfig as Record<string, string>)[item.chave] = item.valor
            hasChanges = true
          }
        })
        return hasChanges ? newConfig : prev
      })
    }
  }, [configsData])

  const handlePermissionToggle = (role: "master" | "admin" | "cliente", key: string, value: boolean) => {
    setRolePermissionsOverride(prev => {
      const base = prev ?? buildRolePermissions(Array.isArray(configsData) ? configsData : undefined)
      return {
        ...base,
        [role]: {
          ...base[role],
          [key]: value
        }
      }
    })
  }

  const handleSavePermissions = () => {
    const payload: Record<string, string> = {}
    ;(["master", "admin", "cliente"] as const).forEach(role => {
      permissionOptions.forEach(option => {
        const value = rolePermissions[role][option.key as keyof typeof rolePermissions.master]
        payload[`perm_${role}_${option.key}`] = value ? "true" : "false"
      })
    })
    saveConfigMutation.mutate(payload)
  }

  const saveConfigMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const response = await api.post('/configuracoes/batch', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] })
      alert("Configurações salvas com sucesso!")
    }
  })

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(workerConfig)
  }

  const saveUserMutation = useMutation({
    mutationFn: async (data: {nome: string; email: string; role: string; senha?: string; hub_ids?: string[]; cliente_ids?: string[]}) => {
      // Clear unnecessary fields depending on role
      const payload = { ...data }
      if (payload.role === 'master') {
        payload.hub_ids = []
        payload.cliente_ids = []
      } else if (payload.role === 'admin') {
        payload.cliente_ids = []
      } else if (payload.role === 'cliente') {
        payload.hub_ids = []
      }

      if (editingUser) {
        const response = await api.put(`/usuarios/${editingUser.id}`, payload)
        return response.data
      } else {
        const response = await api.post('/usuarios/', payload)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setIsUserDialogOpen(false)
      // reset form
      setUserFormData({ nome: "", email: "", role: "master", senha: "", hub_ids: [], cliente_ids: [] })
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/usuarios/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    }
  })

  const saveHubMutation = useMutation({
    mutationFn: async (data: {nome: string}) => {
      if (editingHub) {
        const response = await api.put(`/hubs/${editingHub.id}`, data)
        return response.data
      } else {
        const response = await api.post('/hubs/', data)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] })
      setIsHubDialogOpen(false)
      setHubFormData({ nome: "" })
    }
  })

  const deleteHubMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hubs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] })
    }
  })

  const handleOpenHubDialog = (hub?: {id: string; nome: string; api_key: string}) => {
    if (hub) {
      setEditingHub(hub)
      setHubFormData({ nome: hub.nome })
    } else {
      setEditingHub(null)
      setHubFormData({ nome: "" })
    }
    setIsHubDialogOpen(true)
  }

  const handleSaveHub = () => {
    if (!hubFormData.nome) {
      alert("O nome da HUB é obrigatório")
      return
    }
    saveHubMutation.mutate(hubFormData)
  }

  const handleOpenUserDialog = (user?: {id: string; nome: string; email: string; role: string; hub_ids?: string[]; cliente_ids?: string[]}) => {
    const defaultRole = userRole === 'master' ? 'master' : (userRole === 'admin' ? 'admin' : 'cliente');
    
    if (user) {
      setEditingUser(user)
      setUserFormData({ 
        nome: user.nome, 
        email: user.email, 
        role: ["master", "admin", "cliente"].includes(user.role?.toLowerCase()) ? user.role.toLowerCase() : defaultRole, 
        senha: "",
        hub_ids: user.hub_ids || [],
        cliente_ids: user.cliente_ids || []
      })
    } else {
      setEditingUser(null)
      setUserFormData({ nome: "", email: "", role: defaultRole, senha: "", hub_ids: [], cliente_ids: [] })
    }
    setIsUserDialogOpen(true)
  }

  const handleSaveUser = () => {
    if (!userFormData.nome || !userFormData.email || (!editingUser && !userFormData.senha)) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    if (userFormData.role === "admin" && userFormData.hub_ids.length === 0) {
      alert("Selecione pelo menos um HUB para o perfil Admin")
      return
    }

    if (userFormData.role === "cliente" && userFormData.cliente_ids.length === 0) {
      alert("Selecione pelo menos um Cliente para o perfil Cliente")
      return
    }

    saveUserMutation.mutate(userFormData)
  }

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
            Administração
          </h1>
          <p className="text-zinc-400 mt-1 text-sm font-medium">Gestão de usuários e configurações do worker.</p>
        </div>
      </motion.div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="bg-zinc-900 border-zinc-800 border mb-6">
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-lime-400">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          {userRole === 'master' && (
            <TabsTrigger value="hubs" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-lime-400">
              <Building className="w-4 h-4 mr-2" />
              HUBs
            </TabsTrigger>
          )}
          {userRole === 'master' && (
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-lime-400">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Configurações do Worker
            </TabsTrigger>
          )}
          {userRole === 'master' && (
            <TabsTrigger value="permissoes" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-lime-400">
              <Shield className="w-4 h-4 mr-2" />
              Permissões
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="usuarios" className="mt-0">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-1"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50">
                  <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Users className="h-5 w-5 text-lime-500" />
                    Gestão de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex justify-end p-4">
                    <Button onClick={() => handleOpenUserDialog()} className="bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold transition-all duration-300 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] hover:scale-105 active:scale-95" size="sm">
                      <Plus className="mr-2 h-4 w-4"/>
                      Novo Usuário
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-zinc-950/50">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                          <TableHead className="font-semibold text-zinc-400">Nome</TableHead>
                          <TableHead className="font-semibold text-zinc-400">Perfil</TableHead>
                          <TableHead className="text-right font-semibold text-zinc-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {usuarios.map((u: {id: string; nome: string; email: string; role: string; hub_ids?: string[]; cliente_ids?: string[]}) => (
                        <TableRow key={u.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                            <TableCell className="font-medium text-zinc-200 py-4">
                              <div>{u.nome}</div>
                              <div className="text-xs text-zinc-500">{u.email}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${
                                u.role?.toLowerCase() === 'master' 
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                  : u.role?.toLowerCase() === 'admin'
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-lime-500/10 text-lime-400 border-lime-500/20"
                              }`}>
                                {u.role?.toLowerCase() === 'master' ? 'Master' : u.role?.toLowerCase() === 'admin' ? 'Admin' : u.role?.toLowerCase() === 'cliente' ? 'Cliente' : u.role || 'Operador'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-lime-400 hover:bg-lime-500/10 rounded-lg" onClick={() => handleOpenUserDialog(u)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg" onClick={() => { if(confirm('Tem certeza que deseja excluir este usuário?')) deleteUserMutation.mutate(u.id) }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </motion.div>
        </TabsContent>

        {userRole === 'master' && (
          <TabsContent value="configuracoes" className="mt-0">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-1"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl">
                  <CardHeader className="border-b border-zinc-800/50">
                    <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-lime-500" />
                      Configurações do Worker
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Gerencie parâmetros de timeout, diretórios e integrações do sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">Worker e Automação</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="worker_timeout" className="text-zinc-400">Tempo de Ociosidade (segundos)</Label>
                          <Input id="worker_timeout" value={workerConfig.worker_timeout} onChange={e => setWorkerConfig({...workerConfig, worker_timeout: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_retries" className="text-zinc-400">Máximo de Tentativas</Label>
                          <Input id="max_retries" value={workerConfig.max_retries} onChange={e => setWorkerConfig({...workerConfig, max_retries: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="user_data_dir" className="text-zinc-400">Diretório de Perfil do Chrome</Label>
                          <Input id="user_data_dir" value={workerConfig.user_data_dir} onChange={e => setWorkerConfig({...workerConfig, user_data_dir: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">Integrações de Terceiros</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="twocaptcha_api_key" className="text-zinc-400">2Captcha API Key (Opcional)</Label>
                          <Input id="twocaptcha_api_key" type="password" value={workerConfig.twocaptcha_api_key} onChange={e => setWorkerConfig({...workerConfig, twocaptcha_api_key: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" placeholder="Insira a chave do 2Captcha" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="resend_api_key" className="text-zinc-400">Resend API Key (E-mails)</Label>
                          <Input id="resend_api_key" type="password" value={workerConfig.resend_api_key} onChange={e => setWorkerConfig({...workerConfig, resend_api_key: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" placeholder="Insira a chave da API do Resend (ex: re_...)" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp_host" className="text-zinc-400">SMTP Host</Label>
                          <Input id="smtp_host" value={workerConfig.smtp_host} onChange={e => setWorkerConfig({...workerConfig, smtp_host: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" placeholder="smtp.gmail.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp_port" className="text-zinc-400">SMTP Port</Label>
                          <Input id="smtp_port" value={workerConfig.smtp_port} onChange={e => setWorkerConfig({...workerConfig, smtp_port: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" placeholder="465" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="smtp_user" className="text-zinc-400">SMTP User</Label>
                          <Input id="smtp_user" value={workerConfig.smtp_user} onChange={e => setWorkerConfig({...workerConfig, smtp_user: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" placeholder="email@dominio.com" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="smtp_pass" className="text-zinc-400">SMTP Password</Label>
                          <Input id="smtp_pass" type="password" value={workerConfig.smtp_pass} onChange={e => setWorkerConfig({...workerConfig, smtp_pass: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="smtp_from" className="text-zinc-400">SMTP From</Label>
                          <Input id="smtp_from" value={workerConfig.smtp_from} onChange={e => setWorkerConfig({...workerConfig, smtp_from: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" placeholder="Cadastro Politehub <email@dominio.com>" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-zinc-800/50 mt-6">
                      <Button className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400" onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                        {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        )}

        {userRole === 'master' && (
          <TabsContent value="permissoes" className="mt-0">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-1"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl">
                  <CardHeader className="border-b border-zinc-800/50">
                    <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-lime-500" />
                      Configuração de Permissões
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Defina quais ações cada perfil pode acessar no sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {(["master", "admin", "cliente"] as const).map(role => (
                      <div key={role} className="space-y-3">
                        <div className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
                          {role === "master" ? "Perfil Master" : role === "admin" ? "Perfil Admin" : "Perfil Cliente"}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {permissionOptions.map(option => (
                            <label key={`${role}_${option.key}`} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500/50 focus:ring-offset-0"
                                checked={rolePermissions[role][option.key as keyof typeof rolePermissions.master]}
                                onChange={(e) => handlePermissionToggle(role, option.key, e.target.checked)}
                              />
                              <span className="text-sm text-zinc-300">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-4 border-t border-zinc-800/50">
                      <Button className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400" onClick={handleSavePermissions} disabled={saveConfigMutation.isPending}>
                        {saveConfigMutation.isPending ? "Salvando..." : "Salvar Permissões"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        )}

        {userRole === 'master' && (
          <TabsContent value="hubs" className="mt-0">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-1"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm shadow-xl h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50">
                    <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <Building className="h-5 w-5 text-lime-500" />
                      Gestão de HUBs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex justify-end p-4">
                      <Button className="bg-lime-500 hover:bg-lime-400 text-zinc-950 font-bold transition-all duration-300 rounded-xl shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] hover:scale-105 active:scale-95" size="sm" onClick={() => handleOpenHubDialog()}>
                        <Plus className="mr-2 h-4 w-4"/>
                        Nova HUB
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-zinc-950/50">
                          <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="font-semibold text-zinc-400">Nome</TableHead>
                            <TableHead className="font-semibold text-zinc-400">API Key</TableHead>
                            <TableHead className="text-right font-semibold text-zinc-400">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {hubs.map((h: {id: string; nome: string; api_key: string}) => (
                          <TableRow key={h.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                              <TableCell className="font-medium text-zinc-200 py-4">
                                <div>{h.nome}</div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-zinc-500">{h.api_key}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-lime-400 hover:bg-lime-500/10 rounded-lg" onClick={() => handleOpenHubDialog(h)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg" onClick={() => { if(confirm('Tem certeza que deseja excluir esta HUB?')) deleteHubMutation.mutate(h.id) }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
            </motion.div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-zinc-400">Nome</Label>
                <Input id="nome" value={userFormData.nome} onChange={(e) => setUserFormData({...userFormData, nome: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">E-mail</Label>
                <Input id="email" type="email" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-zinc-400">Senha {editingUser && "(deixe em branco para manter)"}</Label>
                <Input id="senha" type="password" value={userFormData.senha} onChange={(e) => setUserFormData({...userFormData, senha: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-zinc-400">Perfil</Label>
                <Select value={userFormData.role} onValueChange={(v) => setUserFormData({...userFormData, role: v || "cliente"})}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    {[
                      { id: 'master', nome: 'Master' },
                      { id: 'admin', nome: 'Admin' },
                      { id: 'cliente', nome: 'Cliente' }
                    ].filter(perfil => {
                      if (userRole === 'master') return true;
                      if (userRole === 'admin') return perfil.id === 'admin' || perfil.id === 'cliente';
                      if (userRole === 'cliente') return perfil.id === 'cliente';
                      return false;
                    }).map(perfil => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {userFormData.role === "admin" && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">Vincular a HUBs</Label>
                  <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto p-3 border border-zinc-800 rounded-xl bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {hubs.map((hub: {id: string; nome: string}) => (
                      <div key={hub.id} className="flex items-center gap-3 p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer group">
                        <input
                          type="checkbox"
                          id={`form_hub_${hub.id}`}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500 focus:ring-offset-0 transition-all cursor-pointer"
                          checked={userFormData.hub_ids.includes(hub.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormData({...userFormData, hub_ids: [...userFormData.hub_ids, hub.id]})
                            } else {
                              setUserFormData({...userFormData, hub_ids: userFormData.hub_ids.filter(id => id !== hub.id)})
                            }
                          }}
                        />
                        <Label htmlFor={`form_hub_${hub.id}`} className="text-zinc-400 cursor-pointer group-hover:text-zinc-200 transition-colors text-sm">
                          {hub.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userFormData.role === "cliente" && (
                <div className="space-y-2">
                  <Label className="text-zinc-400">Vincular a Clientes</Label>
                  <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto p-3 border border-zinc-800 rounded-xl bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {clientes.map((c: {id: string; razao_social: string; cnpj: string}) => (
                      <div key={c.id} className="flex items-center gap-3 p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer group">
                        <input
                          type="checkbox"
                          id={`form_cliente_${c.id}`}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-lime-500 focus:ring-offset-0 transition-all cursor-pointer"
                          checked={userFormData.cliente_ids.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormData({...userFormData, cliente_ids: [...userFormData.cliente_ids, c.id]})
                            } else {
                              setUserFormData({...userFormData, cliente_ids: userFormData.cliente_ids.filter(id => id !== c.id)})
                            }
                          }}
                        />
                        <Label htmlFor={`form_cliente_${c.id}`} className="text-zinc-400 cursor-pointer group-hover:text-zinc-200 transition-colors text-sm">
                          {c.razao_social} ({c.cnpj})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-800" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400" onClick={handleSaveUser}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isHubDialogOpen} onOpenChange={setIsHubDialogOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingHub ? "Editar HUB" : "Nova HUB"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hub_nome" className="text-zinc-400">Nome da HUB</Label>
                <Input id="hub_nome" value={hubFormData.nome} onChange={(e) => setHubFormData({...hubFormData, nome: e.target.value})} className="bg-zinc-900 border-zinc-800 text-zinc-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-800" onClick={() => setIsHubDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-lime-500 text-zinc-950 font-bold hover:bg-lime-400" onClick={handleSaveHub}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}
