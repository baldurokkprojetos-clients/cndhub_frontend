"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { AxiosError } from "axios"

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [showResend, setShowResend] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setInfo("")
    setShowResend(false)

    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const { access_token, user_id, role, permissions } = response.data
      
      // Armazenar o token JWT e as informações do usuário
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('mock_user_id', user_id) // Atualizando para manter a compatibilidade
      localStorage.setItem('mock_role', role)
      if (permissions) {
        localStorage.setItem('role_permissions', JSON.stringify(permissions))
        localStorage.setItem('role_permissions_role', role)
      } else {
        localStorage.removeItem('role_permissions')
        localStorage.removeItem('role_permissions_role')
      }
      queryClient.clear()

      router.push('/dashboard')
    } catch (err) {
      const apiError = err as AxiosError
      if (apiError.response?.status === 403) {
        setError("E-mail não verificado. Verifique sua caixa de entrada.")
        setShowResend(true)
      } else if (apiError.response?.status === 401 || apiError.response?.status === 400) {
        setError("E-mail ou senha incorretos.")
      } else {
        setError("Ocorreu um erro ao fazer login. Tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Informe o e-mail para reenviar o link de confirmação.")
      return
    }
    setIsResending(true)
    setError("")
    setInfo("")
    try {
      const response = await api.post('/auth/resend-verification', { email })
      setInfo(response.data?.msg || "Se o e-mail estiver cadastrado, você receberá um novo link de verificação.")
      setShowResend(false)
    } catch {
      setError("Não foi possível reenviar o link. Tente novamente.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-0 text-white shadow-2xl">
        <CardHeader className="space-y-1 flex flex-col items-center pt-8">
          <div className="w-16 h-16 bg-lime-400/20 rounded-full mb-4 flex items-center justify-center border border-lime-400/30">
            <span className="text-lime-400 font-bold text-2xl">P</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Politeto CND</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Hub de Automação de Certidões Negativas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3 rounded-md text-sm">
                {info}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@politeto.com.br" 
                className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-lime-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 h-auto text-xs text-lime-400 hover:text-lime-300"
                  onClick={() => router.push('/forgot-password')}
                >
                  Esqueceu a senha?
                </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                className="bg-white/5 border-gray-700 text-white focus-visible:ring-lime-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="pb-8 pt-4">
            <div className="w-full space-y-3">
              <Button type="submit" disabled={isLoading} className="w-full bg-lime-400 text-black hover:bg-lime-500 transition-colors text-base h-11">
                {isLoading ? "Entrando..." : "Entrar no Sistema"}
              </Button>
              {showResend && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-lime-500/50 text-lime-300 hover:text-lime-200 hover:bg-lime-500/10"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? "Reenviando..." : "Reenviar link de confirmação"}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
