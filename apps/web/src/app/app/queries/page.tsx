'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Plus, MessageSquare, Sparkles, Loader2, Database } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  generated_sql?: string
  created_at: string
}

export default function AIQueriesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [currentConversation, setCurrentConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [datasets, setDatasets] = useState<any[]>([])
  const [isDemoMode, setIsDemoMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check demo mode
    if (typeof window !== 'undefined') {
      const isDemo = localStorage.getItem('is_demo_mode') === 'true'
      setIsDemoMode(isDemo)
      
      if (isDemo) {
        // In demo mode, set a default dataset
        setDatasets([{ id: 'demo', name: 'Demo Sales Data (100K records)' }])
        return
      }
    }
    
    loadConversations()
    loadDatasets()
  }, [])

  useEffect(() => {
    if (currentConversation) {
      loadMessages()
    }
  }, [currentConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadDatasets = async () => {
    try {
      const response = await apiClient.datasets.list(0, 100)
      if (response.success && response.data) {
        const data = response.data as { datasets: any[]; total: number }
        setDatasets(data.datasets || [])
      }
    } catch (error) {
      console.error('Failed to load datasets:', error)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await apiClient.ai.listConversations(0, 100)
      if (response.success && response.data) {
        const convos = Array.isArray(response.data) ? response.data : []
        setConversations(convos)
        
        if (convos.length > 0 && !currentConversation) {
          setCurrentConversation(convos[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadMessages = async () => {
    if (!currentConversation) return

    try {
      const response = await apiClient.ai.getMessages(currentConversation)
      if (response.success && response.data) {
        setMessages(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await apiClient.ai.createConversation('New Conversation')
      if (response.success && response.data) {
        const newConvo = response.data as any
        setConversations([newConvo, ...conversations])
        setCurrentConversation(newConvo.id)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast.error('Failed to create conversation')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      if (isDemoMode) {
        // Use demo AI endpoint
        const response = await apiClient.demo.aiQuery(userMessage)
        
        if (response.success && response.data) {
          const data = response.data as any
          const assistantMsg: Message = {
            id: 'ai-' + Date.now(),
            role: 'assistant',
            content: data.answer || data.response || 'Here is the analysis of your data.',
            generated_sql: data.sql_query || data.query,
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMsg])
        } else {
          throw new Error(response.error || 'Failed to get AI response')
        }
      } else {
        // Regular mode
        if (!currentConversation) {
          await createNewConversation()
        }

        if (!currentConversation) {
          throw new Error('Failed to create conversation')
        }

        const response = await apiClient.ai.sendMessage(currentConversation, userMessage)
        
        if (response.success && response.data) {
          // Reload messages to get both user and assistant messages
          await loadMessages()
        } else {
          throw new Error(response.error || 'Failed to send message')
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      // Remove temp message
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrompts = isDemoMode ? [
    'What was the total revenue in 2025?',
    'Which region generated the highest sales?',
    'Show me the top 10 products by profit',
    'Compare 2025 and 2026 performance',
  ] : [
    'What are the total sales for last month?',
    'Show me the top 10 customers by revenue',
    'What is the average order value?',
    'Which products have the highest conversion rate?',
  ]

  if (datasets.length === 0 && !isDemoMode) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Queries</h1>
          <p className="text-synora-gray-600">Natural language data analysis</p>
        </div>

        <Card glass padding="lg">
          <div className="text-center py-12">
            <Database className="w-16 h-16 mx-auto mb-4 text-synora-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Datasets Yet</h3>
            <p className="text-synora-gray-600 mb-4">
              Upload a dataset to start asking questions with AI
            </p>
            <Button onClick={() => window.location.href = '/app/datasets'}>
              Upload Dataset
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <Card glass className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 mx-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900">AI Copilot Demo</h3>
                <p className="text-sm text-purple-700">
                  Ask questions about the 100K sales dataset. Try: "What was the total revenue in 2025?"
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Conversations Sidebar */}
      {!isDemoMode && (
        <div className="w-64 flex-shrink-0 space-y-2">
          <Button fullWidth onClick={createNewConversation}>
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>

          <Card glass className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setCurrentConversation(conv.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    currentConversation === conv.id
                      ? 'bg-synora-black text-white'
                      : 'hover:bg-synora-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{conv.title || 'New Conversation'}</span>
                  </div>
                </button>
              ))}

              {conversations.length === 0 && (
                <div className="text-center py-8 text-sm text-synora-gray-500">
                  No conversations yet
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${isDemoMode ? 'mt-20' : ''}`}>
        <Card glass className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Brain className="w-16 h-16 mb-4 text-synora-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Ask me anything about your data</h3>
                <p className="text-synora-gray-600 mb-6 max-w-md">
                  I can help you analyze your datasets, generate insights, and answer questions in natural language.
                </p>

                <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(prompt)}
                      className="p-4 bg-synora-gray-50 hover:bg-synora-gray-100 rounded-lg text-left text-sm transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mb-2 text-synora-gray-600" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-synora-black text-white'
                      : 'bg-synora-gray-100 text-synora-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.generated_sql && (
                        <div className="mt-3 p-3 bg-black/10 rounded-lg">
                          <p className="text-xs font-mono">{message.generated_sql}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-synora-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm text-synora-gray-600">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-synora-gray-200 p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask a question about your data..."
                  rows={3}
                  className="w-full px-4 py-3 bg-synora-gray-50 border border-synora-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-synora-black resize-none"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-6 py-3 h-auto"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-synora-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
