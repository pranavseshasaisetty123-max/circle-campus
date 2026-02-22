import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatRoom } from './ChatRoom'

export default async function ChatPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/')

    // Validate connection exists and is accepted
    const { data: connection } = await supabase
        .from('connections')
        .select(`
      *,
      sender:profiles!connections_sender_id_fkey(*),
      receiver:profiles!connections_receiver_id_fkey(*)
    `)
        .eq('id', params.id)
        .single()

    if (!connection || connection.status !== 'accepted') {
        redirect('/dashboard')
    }

    // Ensure user is part of connection
    if (connection.sender_id !== user.id && connection.receiver_id !== user.id) {
        redirect('/dashboard')
    }

    // Determine friend
    const friend = connection.sender_id === user.id ? connection.receiver : connection.sender
    const friendObj = Array.isArray(friend) ? friend[0] : friend

    // Fetch initial messages
    const { data: initialMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', params.id)
        .order('created_at', { ascending: true })

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
                        {friendObj.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">{friendObj.full_name}</h2>
                        <p className="text-xs text-slate-500">{friendObj.branch}</p>
                    </div>
                </div>
            </div>

            <ChatRoom
                connectionId={params.id}
                currentUserId={user.id}
                initialMessages={initialMessages || []}
            />
        </div>
    )
}
