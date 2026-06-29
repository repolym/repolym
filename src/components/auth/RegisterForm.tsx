import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../auth/AuthLayout'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { formatError } from '../../utils/error-handler'

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email || !password) return
    if (password.length < 8) { setError('رمز عبور باید حداقل ۸ کاراکتر باشد'); return }
    setLoading(true)
    setError(null)
    try {
      await signUp(email.trim(), name.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = formatError(err)
      if (msg.includes('already registered')) setError('این ایمیل قبلاً ثبت‌نام کرده است')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <h1 className="text-base font-semibold text-text-primary mb-5">ایجاد حساب کاربری</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="نام و نام‌خانوادگی" type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="علی رضایی" required autoFocus />
        <Input label="ایمیل" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com" required autoComplete="email" />
        <Input label="رمز عبور" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="حداقل ۸ کاراکتر" required autoComplete="new-password"
          hint="حداقل ۸ کاراکتر" />
        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-xs px-3 py-2">{error}</p>
        )}
        <Button type="submit" variant="primary" loading={loading} className="w-full">ثبت‌نام</Button>
      </form>
      <p className="mt-4 text-xs text-text-tertiary text-center">
        حساب دارید؟{' '}
        <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">وارد شوید</Link>
      </p>
    </AuthLayout>
  )
}
