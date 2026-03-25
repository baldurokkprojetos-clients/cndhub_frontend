"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api/client"
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react"
import { AxiosError } from "axios"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setStatus("error")
      setMessage("Token de redefinição ausente. Solicite um novo link.")
      return
    }

    if (password !== confirmPassword) {
      setStatus("error")
      setMessage("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      setStatus("error")
      setMessage("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      await api.post('/auth/reset-password', { 
        token, 
        new_password: password 
      })
      setStatus("success")
      setMessage("Senha redefinida com sucesso! Você já pode fazer login com a nova senha.")
    } catch (err) {
      const apiError = err as AxiosError<{ detail?: string }>
      setStatus("error")
      setMessage(apiError.response?.data?.detail || "Link de redefinição inválido ou expirado.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-0 text-white shadow-2xl">
      <CardHeader className="space-y-1 flex flex-col items-center pt-8 pb-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
          {status === 'success' ? (
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          ) : (
            <KeyRound className="h-6 w-6 text-lime-400" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Nova Senha</CardTitle>
        <CardDescription className="text-gray-400 text-center">
          Crie uma nova senha para sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "success" ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-sm text-green-200 text-center">
              {message}
            </div>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full bg-lime-400 text-black hover:bg-lime-500 transition-colors text-base h-11"
            >
              Ir para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-200">
                {message}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Nova Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-lime-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Nova Senha</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-lime-400"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-lime-400 text-black hover:bg-lime-500 transition-colors text-base h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-0 text-white shadow-2xl">
          <CardHeader className="space-y-1 flex flex-col items-center pt-8">
            <Loader2 className="h-8 w-8 text-lime-400 animate-spin mb-4" />
            <CardTitle className="text-2xl font-bold tracking-tight">Carregando...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
