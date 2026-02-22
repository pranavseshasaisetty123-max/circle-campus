import { AuthForm } from './AuthForm'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <div className="absolute top-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-brand-500">
                    Circle
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    The Campus Social Network
                </p>
            </div>

            <AuthForm />

            <div className="absolute bottom-8 text-center text-xs text-slate-400">
                <p>A private network. By students, for students.</p>
            </div>
        </main>
    )
}
