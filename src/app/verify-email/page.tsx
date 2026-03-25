"use client"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { AxiosError } from "axios"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const hasToken = Boolean(token)
  const [status, setStatus] = useState<"loading" | "success" | "error">(hasToken ? "loading" : "error")
  const [message, setMessage] = useState(hasToken ? "Verificando seu e-mail..." : "Token de verificação ausente.")

  useEffect(() => {
    if (!token) return

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token })
        setStatus("success")
        setMessage("E-mail verificado com sucesso! Agora você pode fazer login.")
      } catch (err) {
        const apiError = err as AxiosError<{ detail?: string }>
        setStatus("error")
        setMessage(apiError.response?.data?.detail || "Link de verificação inválido ou expirado.")
      }
    }

    verify()
  }, [token])

  return (
    <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-0 text-white shadow-2xl">
      <CardHeader className="space-y-1 flex flex-col items-center pt-8">
        <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center border ${
          status === 'loading' ? 'bg-blue-400/20 border-blue-400/30' :
          status === 'success' ? 'bg-green-400/20 border-green-400/30' :
          'bg-red-400/20 border-red-400/30'
        }`}>
          {status === 'loading' && <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="h-8 w-8 text-green-400" />}
          {status === 'error' && <XCircle className="h-8 w-8 text-red-400" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Verificação de E-mail</CardTitle>
        <CardDescription className="text-gray-400 text-center">
          Politeto CND
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col items-center pb-8">
        <p className="text-center text-gray-200">{message}</p>
        
        {status !== 'loading' && (
          <Button 
            onClick={() => router.push('/login')} 
            className="w-full mt-4 bg-lime-400 text-black hover:bg-lime-500 transition-colors text-base h-11"
          >
            Ir para o Login
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-0 text-white shadow-2xl">
          <CardHeader className="space-y-1 flex flex-col items-center pt-8">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-4" />
            <CardTitle className="text-2xl font-bold tracking-tight">Carregando...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
