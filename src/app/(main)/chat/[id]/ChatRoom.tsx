'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
}

type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
}

export function ChatRoom({
  connectionId,
  currentUserId,
  initialMessages
}: {
  connectionId: string
  currentUserId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Fetch all profiles once
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')

      if (data) {
        const map: Record<string, Profile> = {}
        data.forEach((p) => {
          map[p.id] = p
        })
        setProfiles(map)
      }
    }

    fetchProfiles()
  }, [supabase])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`room:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          const incomingMessage = payload.new as Message
          setMessages((current) => {
            if (current.find((m) => m.id === incomingMessage.id)) return current
            return [...current, incomingMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [connectionId, supabase])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const tempMessage = newMessage
    setNewMessage('')

    const { error, data } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: currentUserId,
        content: tempMessage.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(tempMessage)
    } else if (data) {
      setMessages((current) => {
        if (current.find((m) => m.id === data.id)) return current
        return [...current, data]
      })
    }

    setIsSending(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            <p>Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            const senderProfile = profiles[msg.sender_id]

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex w-full items-end gap-2',
                  isMe ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Avatar (only for other person) */}
                {!isMe && (
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
                    {senderProfile?.avatar_url ? (
                      <img
                        src={senderProfile.avatar_url}
                        alt={senderProfile.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                        {senderProfile?.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm md:text-base',
                    isMe
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-sm'
                  )}
                >
                  <p className="break-words">{msg.content}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-slate-50 dark:bg-slate-950 px-4"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="rounded-full shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
