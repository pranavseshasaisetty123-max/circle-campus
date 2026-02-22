import Link from 'next/link'
import { logout } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Home, User, Users, LogOut } from 'lucide-react'

export function Navbar() {
    return (
        <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-50">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <Link
                    href="/dashboard"
                    className="text-xl font-bold tracking-tight text-brand-500 transition-colors hover:text-brand-600"
                >
                    Circle
                </Link>

                <div className="flex items-center space-x-2 md:space-x-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                            <Home className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/connections">
                        <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                            <Users className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/profile">
                        <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                            <User className="h-5 w-5" />
                        </Button>
                    </Link>
                    <form action={logout}>
                        <Button variant="ghost" size="icon" type="submit" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </nav>
    )
}
