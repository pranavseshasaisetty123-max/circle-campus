'use client'

import { useState } from 'react'
import { login, signup } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm dark:bg-slate-900">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
      </div>

      <form action={isLogin ? login : signup} className="space-y-4">
        <Input
          name="email"
          type="email"
          required
          placeholder="student@university.edu"
        />

        <Input
          name="password"
          type="password"
          required
          placeholder="••••••••"
        />

        <Button type="submit" className="w-full">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="font-medium text-brand-600 hover:underline"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )

}
