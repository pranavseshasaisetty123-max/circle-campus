import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus, UserCheck } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Check profile completeness
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('full_name, branch')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile?.full_name || !currentUserProfile?.branch) {
    redirect('/profile')
  }

  // Fetch all other users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)

  // Fetch connections
  const { data: connections } = await supabase
    .from('connections')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Campus Feed
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Discover and connect with students in your circle.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {profiles?.map((profile) => {
          const connection = connections?.find(
            (c) =>
              (c.sender_id === user.id && c.receiver_id === profile.id) ||
              (c.receiver_id === user.id && c.sender_id === profile.id)
          )

          return (
            <div
              key={profile.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Profile Info */}
              <div>
                <div className="mb-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-200">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold">
                        {profile.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {profile.full_name}
                    </h3>
                    <div className="mt-1 flex gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        {profile.branch}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        Year {profile.year}
                      </span>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6">
                {!connection ? (
                  <form
                    action={async () => {
                      'use server'
                      const supabaseClient = await createClient()
                      await supabaseClient.from('connections').insert({
                        sender_id: user.id,
                        receiver_id: profile.id,
                        status: 'pending',
                      })
                    }}
                  >
                    <Button className="w-full gap-2">
                      <UserPlus className="h-4 w-4" />
                      Send Request
                    </Button>
                  </form>
                ) : connection.status === 'accepted' ? (
                  <Link href={`/chat/${connection.id}`} className="block w-full">
                    <Button variant="outline" className="w-full">
                      Message
                    </Button>
                  </Link>
                ) : connection.sender_id === user.id ? (
                  <Button variant="outline" disabled className="w-full">
                    Request Sent
                  </Button>
                ) : (
                  <form
                    action={async () => {
                      'use server'
                      const supabaseClient = await createClient()
                      await supabaseClient
                        .from('connections')
                        .update({ status: 'accepted' })
                        .eq('id', connection.id)
                    }}
                  >
                    <Button className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                      <UserCheck className="h-4 w-4" />
                      Accept Request
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )
        })}

        {profiles?.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
              No students found
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Check back later when more people join your campus network.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
