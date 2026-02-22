'use client'

import { useState } from 'react'
import { login, signup } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = isLogin
                ? await login(formData)
                : await signup(formData)

            if (response?.error) {
                setError(response.error)
            }
        } catch (e) {
            setError('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Enter your details below to {isLogin ? 'log in' : 'sign up'}
                </p>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email
                    </label>
                    <Input
                        name="email"
                        type="email"
                        required
                        placeholder="student@university.edu"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Password
                    </label>
                    <Input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-brand-600 hover:text-brand-500 hover:underline dark:text-brand-400"
                >
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </div>
        </div>
    )
}
