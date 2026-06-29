import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../auth/AuthLayout'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { formatError } from '../../utils/error-handler'

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = formatError(err)
      if (msg.includes('Invalid login')) setError('ایمیل یا رمز عبور اشتباه است')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <h1 className="text-base font-semibold text-text-primary mb-5">ورود به حساب</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="ایمیل" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com" required autoComplete="email" />
        <Input label="رمز عبور" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required autoComplete="current-password" />
        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">{error}</p>
        )}
        <Button type="submit" variant="primary" loading={loading} className="w-full">ورود</Button>
      </form>
      <p className="mt-4 text-xs text-text-tertiary text-center">
        حساب ندارید؟{' '}
        <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">ثبت‌نام کنید</Link>
      </p>
    </AuthLayout>
  )
}
