"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api/client"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { AxiosError } from "axios"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      await api.post('/auth/forgot-password', { email })
      setStatus("success")
      setMessage("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.")
    } catch (err) {
      const apiError = err as AxiosError<{ detail?: string }>
      setStatus("error")
      setMessage(apiError.response?.data?.detail || "Ocorreu um erro. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-0 text-white shadow-2xl">
        <CardHeader className="space-y-1 flex flex-col items-center pt-8 pb-4">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
            <Mail className="h-6 w-6 text-lime-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Digite seu e-mail para receber um link de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" ? (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-sm text-green-200 text-center mb-6">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-200">
                  {message}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-0">
          <Button 
            variant="link" 
            className="text-gray-400 hover:text-white flex items-center"
            onClick={() => router.push('/login')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
