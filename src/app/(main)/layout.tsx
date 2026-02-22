import { Navbar } from '@/components/layout/Navbar'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    )
}
