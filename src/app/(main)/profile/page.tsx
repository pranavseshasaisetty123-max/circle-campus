import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  async function updateProfile(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const full_name = formData.get('fullName') as string
    const branch = formData.get('branch') as string
    const year = formData.get('year') as string
    const bio = formData.get('bio') as string
    const file = formData.get('avatar') as File

    let avatar_url: string | null = null

    // If file uploaded
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (!uploadError) {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatar_url = data.publicUrl
      }
    }

    // If no new file uploaded, keep old avatar
    if (!avatar_url) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

      avatar_url = existing?.avatar_url || null
    }

    await supabase
      .from('profiles')
      .update({
        full_name,
        branch,
        year,
        bio,
        avatar_url,
      })
      .eq('id', user.id)

    revalidatePath('/profile')
    redirect('/profile')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Update how you appear to others on campus.
        </p>

        <form
          action={updateProfile}
          encType="multipart/form-data"
          className="mt-8 space-y-6"
        >
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-200">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold">
                  {profile?.full_name?.[0] || user.email?.[0]}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Profile Picture
              </label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input value={user.email || ''} disabled />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <Input
              name="fullName"
              defaultValue={profile?.full_name || ''}
              required
            />
          </div>

          {/* Branch & Year */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Branch
              </label>
              <Input
                name="branch"
                defaultValue={profile?.branch || ''}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Year
              </label>
              <Input
                name="year"
                defaultValue={profile?.year || ''}
                required
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              defaultValue={profile?.bio || ''}
              rows={4}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
