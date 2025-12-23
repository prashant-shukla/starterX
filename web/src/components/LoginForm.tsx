import { useState } from 'react'
import { Button } from './shared/button'
import { Input } from './shared/input'
import { Label } from './shared/label'
import { Alert, AlertDescription } from './shared/alert'
import { ArrowRight, Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react'
// Supabase has been removed; backend auth is used instead via apiRequest

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  onBackToHome?: () => void
}

export function LoginForm({ onLogin, onBackToHome }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent any event bubbling that might cause refresh
    
    setLoading(true)
    setError('')

    try {
      const result = await onLogin(email, password)
      
      if (!result.success) {
        setError(result.error || 'Login failed')
        setLoading(false)
      } else {
        // Success - don't set loading to false here, let the navigation handle it
        // The form will be unmounted on successful login anyway
      }
    } catch (error: any) {
      console.error('Login form error:', error)
      setError(error?.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F8F9FF] to-[#EFF2FE] flex">

      {/* Left Side - AI Accounting Content */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">AI-powered bookkeeping<br />with real human experts</h1>
          
          <p className="text-xl text-gray-600 leading-relaxed">
            Where human expertise meets AI intelligent automation — delivering smarter decisions, deeper insights, and a future-ready approach to financial management.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile AI Content */}
          <div className="lg:hidden mb-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Accounting</h1>
            <p className="text-gray-600">Transform your financial operations with intelligent automation.</p>
          </div>

          {/* Back to Home Button */}
          {onBackToHome && (
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={onBackToHome}
                className="text-gray-600 hover:text-gray-900 p-0 h-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          )}

          {/* Header Section */}
          <div className="text-center mb-12">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Synoro</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome back</h1>
            <p className="text-gray-600">Access your accounting portal and financial insights</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {error && (
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-semibold">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-14 pl-12 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-0 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-14 pl-12 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-0 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign in
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>


          {/* Bottom Text */}
          <div className="text-center mt-6">

          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle gradient circles */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#EFF2FE]/30 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#E5E9FD]/25 rounded-full blur-3xl opacity-35"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#F3F5FF]/40 rounded-full blur-2xl opacity-45"></div>
      </div>
    </div>
  )
}
