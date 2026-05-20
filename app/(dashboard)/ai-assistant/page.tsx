'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Send, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface ChatSession {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

export default function AIAssistantPage() {
  const { user } = useAuth()
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    async function checkApiKey() {
      if (!user?.email) return

      // Check localStorage first (temporary workaround)
      const localKey = localStorage.getItem('gemini_api_key')
      if (localKey) {
        setHasApiKey(true)
        return
      }

      try {
        const response = await fetch(`/api/user/gemini-key?email=${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          setHasApiKey(data.hasKey)
        }
      } catch (error) {
        console.error('Error checking API key:', error)
      }
    }
    checkApiKey()
  }, [user])

  useEffect(() => {
    async function fetchSessions() {
      if (!user?.email) return
      try {
        const response = await fetch(`/api/ai/sessions?email=${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setLoadingSessions(false)
      }
    }
    if (hasApiKey && user?.email) {
      fetchSessions()
    }
  }, [hasApiKey, user])

  useEffect(() => {
    async function loadSession() {
      if (!currentSessionId) {
        setMessages([])
        return
      }

      if (!user?.email) {
        console.error('No user email available')
        return
      }

      try {
        console.log('[AI Assistant] Loading session:', currentSessionId)
        const response = await fetch(`/api/ai/chat/${currentSessionId}?email=${encodeURIComponent(user.email)}`)
        console.log('[AI Assistant] Response status:', response.status)

        if (response.ok) {
          const session = await response.json()
          console.log('[AI Assistant] Loaded session data:', {
            id: session.id,
            messagesCount: session.messages?.length || 0,
            messages: session.messages
          })
          setMessages(session.messages || [])
          console.log('[AI Assistant] Messages state updated')
        } else {
          const error = await response.json()
          console.error('Failed to load session:', error)
          toast.error('Failed to load chat history')
        }
      } catch (error) {
        console.error('Error loading session:', error)
        toast.error('Failed to load chat history')
      }
    }
    loadSession()
  }, [currentSessionId, user?.email])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!currentMessage.trim() || sending) return

    setError(null)
    setSending(true)

    const userMessage = currentMessage.trim()
    setCurrentMessage('')

    // Add user message to UI immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      // Get API key from localStorage (temporary workaround)
      const apiKey = localStorage.getItem('gemini_api_key')

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          userEmail: user?.email,
          apiKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])

      // Update session ID if new
      if (!currentSessionId) {
        setCurrentSessionId(data.sessionId)
        // Refresh sessions list
        if (user?.email) {
          const sessionsResponse = await fetch(`/api/ai/sessions?email=${encodeURIComponent(user.email)}`)
          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json()
            setSessions(sessionsData)
          }
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSending(false)
    }
  }

  function handleNewChat() {
    setCurrentSessionId(null)
    setMessages([])
    setError(null)
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Delete this chat session?')) return
    if (!user?.email) {
      toast.error('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/ai/chat/${sessionId}?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setSessions(sessions.filter((s) => s.id !== sessionId))

        // If deleting current session, start a new chat
        if (currentSessionId === sessionId) {
          handleNewChat()
        }

        toast.success('Chat session deleted successfully')
      } else {
        const error = await response.json()
        console.error('Delete failed:', error)

        // Show specific error message
        if (response.status === 401) {
          toast.error('Unauthorized: Please sign in again')
        } else if (response.status === 404) {
          toast.error('Chat session not found')
        } else {
          toast.error(error.error || 'Failed to delete chat session')
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Network error: Failed to delete chat session')
    }
  }

  if (hasApiKey === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasApiKey) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
          <p className="text-muted-foreground">Legal chat and document drafting powered by Gemini</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Setup Required
            </CardTitle>
            <CardDescription>Configure your Gemini API key to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to add your Gemini API key before using AI features.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm">To use the AI Assistant, you need:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>A free Gemini API key from Google AI Studio</li>
                <li>Add the key in your Settings page</li>
                <li>Return here to start chatting</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Link href="/settings">
                <Button>
                  Go to Settings
                </Button>
              </Link>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  Get API Key
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
          <p className="text-muted-foreground">Ask legal questions or discuss strategy</p>
        </div>
        <Button onClick={handleNewChat} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat History Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chat History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingSessions ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chats yet</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentSessionId(session.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(session.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-300px)] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    General Legal Chat
                  </CardTitle>
                  <CardDescription>
                    Ask questions about Indian law, procedures, or legal strategy
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Online
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-4 max-w-md">
                    <Sparkles className="h-12 w-12 mx-auto text-purple-400" />
                    <div>
                      <h3 className="font-semibold text-lg">Start a conversation</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Ask me anything about Indian law, legal procedures, or case strategy.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-left">
                      <button
                        onClick={() => setCurrentMessage('What are the essential elements of a valid contract under Indian law?')}
                        className="p-3 text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        What are the essential elements of a valid contract?
                      </button>
                      <button
                        onClick={() => setCurrentMessage('Explain the difference between civil and criminal contempt of court.')}
                        className="p-3 text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Explain civil vs criminal contempt of court
                      </button>
                      <button
                        onClick={() => setCurrentMessage('What is the procedure for filing a writ petition in High Court?')}
                        className="p-3 text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Procedure for filing a writ petition
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-lg p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            <div className="border-t p-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  placeholder="Ask a legal question..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  className="flex-1 min-h-[60px] max-h-[200px]"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !currentMessage.trim()} className="self-end">
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
