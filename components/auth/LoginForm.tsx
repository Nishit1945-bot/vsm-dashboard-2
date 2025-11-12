'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Image from 'next/image'

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(' ')
}

interface LoginFormProps {
  onSuccess: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isCreateAccount, setIsCreateAccount] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const emailInput = String(formData.get('resetEmail') || '').trim()

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput)) {
      alert('Enter a valid email')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        alert(`Error: ${error.message}`)
        return
      }

      alert('Password reset link sent to your email!')
      setShowForgotPassword(false)
    } catch (error: any) {
      console.error('[Login] Password reset error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      console.error('[Login] Supabase client not available')
      return
    }

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const emailInput = String(formData.get('email') || '').trim()
    const passwordInput = String(formData.get('password') || '').trim()
    const fullNameInput = String(formData.get('fullName') || '').trim()
    const confirmPasswordInput = String(formData.get('confirmPassword') || '').trim()
    const phoneInput = String(formData.get('phone') || '').trim()
    const companyInput = String(formData.get('company') || '').trim()

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput)) {
      alert('Enter a valid email')
      return
    }

    if (!passwordInput || passwordInput.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (isCreateAccount) {
      if (!fullNameInput) {
        alert('Please enter your full name')
        return
      }

      if (passwordInput !== confirmPasswordInput) {
        alert('Passwords do not match')
        return
      }
    }

    try {
      setLoading(true)

      if (isCreateAccount) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
          options: {
            data: {
              full_name: fullNameInput,
              phone: phoneInput,
              company: companyInput,
            },
          },
        })

        if (signUpError) {
          alert(`Error: ${signUpError.message}`)
          return
        }

        if (signUpData.user) {
          await supabase.from('user_profiles').insert({
            id: signUpData.user.id,
            email: emailInput,
            full_name: fullNameInput,
            phone: phoneInput,
            company: companyInput,
          })

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput,
          })

          if (signInError) {
            alert(`Account created but sign in failed: ${signInError.message}`)
            return
          }

          alert('Account created successfully!')
          onSuccess()
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        })

        if (signInError) {
          alert(`Error: ${signInError.message}`)
          return
        }

        onSuccess()
      }
    } catch (error: any) {
      console.error('[Login] Auth error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #e8b4bc 0%, #d4a5b8 25%, #b8a5c8 50%, #8fa5d8 75%, #6b8fd8 100%)',
          }}
        />
        <div className="relative w-full max-w-md">
          <form onSubmit={handleForgotPassword}>
            <div className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm bg-white/85">
              <h2 className="text-2xl font-bold text-center mb-6 text-[#1a3a52]">Reset Password</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="mb-6">
                <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                  <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    name="resetEmail"
                    type="email"
                    placeholder="Email Address"
                    required
                    className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full font-semibold text-lg tracking-wider shadow-lg hover:shadow-xl transition-all mb-4"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  color: '#1a3a52',
                }}
              >
                SEND RESET LINK
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-2 text-[#5a7a92] hover:text-[#1a3a52] text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #e8b4bc 0%, #d4a5b8 25%, #b8a5c8 50%, #8fa5d8 75%, #6b8fd8 100%)',
        }}
      />

      <div className="relative w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Welcome to Lean Vision</h1>
          <p className="text-lg text-white/90 drop-shadow">The Gen-AI-VSM</p>
        </div>

        <div className="mb-8">
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border-4 border-white/30">
            <Image src="/logo.png" alt="Lean Vision Logo" width={80} height={80} className="drop-shadow-lg" />
          </div>
        </div>

        <form onSubmit={submitLogin} className="w-full">
          <div className="rounded-3xl p-8 shadow-2xl backdrop-blur-sm bg-white/85">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setIsCreateAccount(false)}
                className={classNames(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  !isCreateAccount ? 'bg-[#1a3a52] text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsCreateAccount(true)}
                className={classNames(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isCreateAccount ? 'bg-[#1a3a52] text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                Create Account
              </button>
            </div>

            {isCreateAccount && (
              <div className="mb-4">
                <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                  <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    name="fullName"
                    type="text"
                    placeholder="Full Name"
                    required={isCreateAccount}
                    className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="Email ID"
                  required
                  className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                />
              </div>
            </div>

            {isCreateAccount && (
              <>
                <div className="mb-4">
                  <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                    <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Phone Number (Optional)"
                      className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                    <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <input
                      name="company"
                      type="text"
                      placeholder="Company Name (Optional)"
                      className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mb-4">
              <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  minLength={6}
                  className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                />
              </div>
            </div>

            {isCreateAccount && (
              <div className="mb-4">
                <div className="flex items-center rounded-lg overflow-hidden shadow-md">
                  <div className="bg-[#1a3a52] px-4 py-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    required={isCreateAccount}
                    minLength={6}
                    className="flex-1 px-4 py-3 bg-[#5a7a92] text-white placeholder-gray-300 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#1a3a52]"
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              {!isCreateAccount && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[#5a7a92] hover:text-[#1a3a52] italic"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-semibold text-lg tracking-wider shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                color: '#1a3a52',
              }}
            >
              {loading ? 'PLEASE WAIT...' : isCreateAccount ? 'CREATE ACCOUNT' : 'LOGIN'}
            </button>

            <button
              type="button"
              onClick={onSuccess}
              className="w-full mt-3 py-2 text-[#5a7a92] hover:text-[#1a3a52] text-sm font-medium transition-colors"
            >
              Skip Login (Use Local Mode)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}