import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, UserCheck, UserX } from 'lucide-react'
import { revalidatePath } from 'next/cache'

type Profile = {
  id: string
  full_name: string
  branch: string
  year: string
  avatar_url: string | null
}

type Connection = {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  sender: Profile | Profile[]
  receiver: Profile | Profile[]
}

export default async function ConnectionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data } = await supabase
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

  const connections = (data ?? []) as Connection[]

  const normalize = (profile: Profile | Profile[]) =>
    Array.isArray(profile) ? profile[0] : profile

  const pendingRequests = connections.filter((c) => {
    const receiver = normalize(c.receiver)
    return c.status === 'pending' && receiver?.id === user.id
  })

  const acceptedConnections = connections.filter(
    (c) => c.status === 'accepted'
  )

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
        <h1 className="text-3xl font-bold">Your Network</h1>
        <p className="mt-2 text-slate-600">
          Manage your connections and incoming requests.
        </p>
      </div>

      {pendingRequests.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Connection Requests
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((req) => {
              const sender = normalize(req.sender)

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                      {sender?.avatar_url ? (
                        <img
                          src={sender.avatar_url}
                          alt={sender.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-semibold">
                          {sender?.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {sender?.full_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {sender?.branch}
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
                      <Button size="icon">
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
                      <Button size="icon" variant="outline">
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

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          My Circle ({acceptedConnections.length})
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {acceptedConnections.map((conn) => {
            const sender = normalize(conn.sender)
            const receiver = normalize(conn.receiver)

            const friend =
              sender?.id === user.id ? receiver : sender

            return (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-2xl border p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                    {friend?.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold">
                        {friend?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {friend?.full_name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {friend?.branch} • Year {friend?.year}
                    </p>
                  </div>
                </div>

                <Link href={`/chat/${conn.id}`}>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
