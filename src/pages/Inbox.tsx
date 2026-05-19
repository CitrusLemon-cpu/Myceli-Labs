import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface InboxItem {
  id: string
  content: string
  url: string | null
  added_by: string
  status: string
  created_at: string
  profiles: { display_name: string } | null
}

export default function Inbox() {
  const { user } = useAuth()
  const [items, setItems] = useState<InboxItem[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchItems()

    const channel = supabase
      .channel('inbox-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inbox_items' },
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchItems() {
    const { data } = await supabase
      .from('inbox_items')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false })

    if (data) setItems(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !user) return

    setSubmitting(true)
    const trimmed = input.trim()

    // Auto-detect URLs
    const urlPattern = /^https?:\/\/\S+$/i
    const isUrl = urlPattern.test(trimmed)

    try {
      await supabase.from('inbox_items').insert({
        content: trimmed,
        url: isUrl ? trimmed : null,
        added_by: user.id,
      })
      setInput('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('inbox_items').delete().eq('id', id)
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="inbox">
      <h2>Inbox</h2>
      <form className="inbox-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Paste a link or type a note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !input.trim()}>
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="inbox-empty">Nothing here yet. Paste a link or note above.</p>
      ) : (
        <ul className="inbox-list">
          {items.map((item) => (
            <li key={item.id} className="inbox-item">
              <div className="inbox-item-content">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.content}
                  </a>
                ) : (
                  <span>{item.content}</span>
                )}
                <div className="inbox-item-meta">
                  {item.profiles?.display_name ?? 'unknown'} · {formatTime(item.created_at)}
                </div>
              </div>
              <button
                className="inbox-item-delete"
                onClick={() => handleDelete(item.id)}
                title="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
