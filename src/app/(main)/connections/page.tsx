import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, UserCheck, UserX } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch all connections with avatar included
  const { data: connections } = await supabase
    .from('connections')
    .select(`
      id,
      status,
      sender:profiles!connections_sender_id_fkey (
        id,
        full_name,
        branch,
        year,
        avatar_url
      ),
      receiver:profiles!connections_receiver_id_fkey (
        id,
        full_name,
        branch,
        year,
        avatar_url
      )
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

  const pendingRequests =
    connections?.filter(
      (c) => c.status === 'pending' && c.receiver.id === user.id
    ) || []

  const acceptedConnections =
    connections?.filter((c) => c.status === 'accepted') || []

  const updateConnectionStatus = async (
    id: string,
    status: 'accepted' | 'rejected'
  ) => {
    'use server'
    const supabaseClient = await createClient()
    await supabaseClient
      .from('connections')
      .update({ status })
      .eq('id', id)

    revalidatePath('/connections')
    revalidatePath('/dashboard')
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your Network
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your connections and incoming requests.
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            Connection Requests
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((req) => {
              const sender = req.sender

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900/50 dark:bg-brand-950/20"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                      {sender.avatar_url ? (
                        <img
                          src={sender.avatar_url}
                          alt={sender.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-semibold">
                          {sender.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {sender.full_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {sender.branch}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <form
                      action={updateConnectionStatus.bind(
                        null,
                        req.id,
                        'accepted'
                      )}
                    >
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </form>

                    <form
                      action={updateConnectionStatus.bind(
                        null,
                        req.id,
                        'rejected'
                      )}
                    >
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full text-slate-500 hover:text-red-500"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Accepted Connections */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
          My Circle ({acceptedConnections.length})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {acceptedConnections.length > 0 ? (
            acceptedConnections.map((conn) => {
              const friend =
                conn.sender.id === user.id
                  ? conn.receiver
                  : conn.sender

              return (
                <div
                  key={conn.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold">
                          {friend.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {friend.full_name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {friend.branch} • Year {friend.year}
                      </p>
                    </div>
                  </div>

                  <Link href={`/chat/${conn.id}`} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:bg-brand-50 border-brand-200 dark:border-brand-900 dark:hover:bg-brand-950"
                    >
                      <MessageSquare className="h-4 w-4" /> Message
                    </Button>
                  </Link>
                </div>
              )
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">
                You haven't added anyone to your circle yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
