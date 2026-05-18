'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Send, AlertCircle, Loader2, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface CaseAIAssistantProps {
  caseId: string
}

export function CaseAIAssistant({ caseId }: CaseAIAssistantProps) {
  const { user } = useAuth()
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [draftType, setDraftType] = useState('')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null)
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

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!currentMessage.trim() || sending) return

    setError(null)
    setSending(true)

    const userMessage = currentMessage.trim()
    setCurrentMessage('')

    // Add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      // Get API key from localStorage (temporary workaround)
      const apiKey = localStorage.getItem('gemini_api_key')

      const response = await fetch('/api/ai/case-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          caseId,
          sessionId,
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
      const assistantMsg: Message = {
        id: `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])

      // Update session ID if new
      if (!sessionId) {
        setSessionId(data.sessionId)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSending(false)
    }
  }

  async function handleGenerateDraft() {
    if (!draftType) return

    setGeneratingDraft(true)
    setError(null)

    try {
      // Get API key from localStorage (temporary workaround)
      const apiKey = localStorage.getItem('gemini_api_key')

      const response = await fetch('/api/ai/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          draftType,
          additionalInstructions: additionalInstructions || undefined,
          userEmail: user?.email,
          apiKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate draft')
      }

      const data = await response.json()
      setGeneratedDraft(data.draft)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setGeneratingDraft(false)
    }
  }

  function handleCopyDraft() {
    if (generatedDraft) {
      navigator.clipboard.writeText(generatedDraft)
      alert('Draft copied to clipboard!')
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
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add your Gemini API key in Settings to use the AI Assistant for this case.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Draft Generator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Drafting
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate legal documents using case information
              </p>
            </div>
            <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
              <DialogTrigger>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Draft
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generate Legal Draft</DialogTitle>
                  <DialogDescription>
                    Select document type and provide any specific instructions
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={draftType} onValueChange={(value) => {
                      if (value) setDraftType(value)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petition">Petition</SelectItem>
                        <SelectItem value="application">Application</SelectItem>
                        <SelectItem value="reply">Reply/Response</SelectItem>
                        <SelectItem value="arguments">Written Arguments</SelectItem>
                        <SelectItem value="affidavit">Affidavit</SelectItem>
                        <SelectItem value="notice">Legal Notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Instructions (Optional)</Label>
                    <Textarea
                      placeholder="E.g., Focus on constitutional arguments, include precedents from Supreme Court, emphasize urgency..."
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!generatedDraft ? (
                    <Button
                      onClick={handleGenerateDraft}
                      disabled={!draftType || generatingDraft}
                      className="w-full"
                    >
                      {generatingDraft ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Draft...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Draft
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{generatedDraft}</pre>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCopyDraft} variant="outline">
                          Copy to Clipboard
                        </Button>
                        <Button
                          onClick={() => {
                            setGeneratedDraft(null)
                            setDraftType('')
                            setAdditionalInstructions('')
                          }}
                        >
                          Generate Another
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Uses complete case data (parties, hearings, documents)</p>
            <p>• Generates petitions, applications, replies, and more</p>
            <p>• Follows Indian legal formatting conventions</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Case-Specific Chat
              </h3>
              <p className="text-sm text-muted-foreground">
                Ask questions about this case, get strategy advice, or discuss legal arguments
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Case Context Loaded
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-4 max-w-md">
                <Sparkles className="h-12 w-12 mx-auto text-purple-400" />
                <div>
                  <h4 className="font-semibold">AI has full case context</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ask about hearings, parties, strategy, or legal arguments for this specific case.
                  </p>
                </div>
                <div className="grid gap-2 text-left">
                  <button
                    onClick={() => setCurrentMessage('What are the key strengths and weaknesses of our position in this case?')}
                    className="p-3 text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    Analyze strengths and weaknesses
                  </button>
                  <button
                    onClick={() => setCurrentMessage('Based on the hearing history, what should be our strategy for the next hearing?')}
                    className="p-3 text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    Suggest next hearing strategy
                  </button>
                  <button
                    onClick={() => setCurrentMessage('What additional evidence or documents should we prepare?')}
                    className="p-3 text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    Recommend additional evidence
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
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
              placeholder="Ask about this case..."
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
        </div>
      </Card>
    </div>
  )
}
