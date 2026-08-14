'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Brain, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  generated_sql?: string
}

const suggestedQueries = [
  'Show me revenue trends for Q2 2024',
  'Which products have the highest margins?',
  'Compare sales performance across regions',
  'Analyze customer retention rates',
]

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeConversation()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeConversation = async () => {
    try {
      const response = await apiClient.ai.createConversation('AI Copilot Session')
      
      if (response.success && response.data) {
        const conversation = response.data as { id: string }
        setConversationId(conversation.id)
        
        // Get initial message
        const messagesResponse = await apiClient.ai.getMessages(conversation.id)
        if (messagesResponse.success && messagesResponse.data) {
          const messages = messagesResponse.data as any[]
          setMessages(messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.created_at)
          })))
        }
      } else {
        setError('Failed to initialize AI conversation. Using demo mode.')
        // Add demo welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hi! I\'m your AI Copilot. Ask me anything about your data, and I\'ll provide instant insights.',
          timestamp: new Date(),
        }])
      }
    } catch (err) {
      console.error('Failed to initialize conversation:', err)
      setError('Failed to connect to AI service. Using demo mode.')
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m your AI Copilot. Ask me anything about your data, and I\'ll provide instant insights.',
        timestamp: new Date(),
      }])
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      if (conversationId) {
        // Real API call
        const response = await apiClient.ai.sendMessage(conversationId, input)
        
        if (response.success && response.data) {
          const msgData = response.data as any
          const aiMessage: Message = {
            id: msgData.id,
            role: 'assistant',
            content: msgData.content,
            timestamp: new Date(msgData.created_at),
            generated_sql: msgData.generated_sql,
          }
          setMessages((prev) => [...prev, aiMessage])
        } else {
          throw new Error(response.error || 'Failed to get AI response')
        }
      } else {
        // Fallback to demo mode
        await new Promise(resolve => setTimeout(resolve, 1500))
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Based on your query "${input}", here are the key insights:\n\n• Revenue increased by 23% in Q2 2024\n• Top performing region: North America ($2.4M)\n• Customer retention improved by 15%\n\nWould you like me to generate a detailed report?\n\n*Note: This is demo mode. Connect to the backend for real AI insights powered by Gemini.*`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to get AI response. Please try again.')
      
      // Remove user message on error
      setMessages((prev) => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)]">
      <div>
        <h1 className="heading-3 mb-2 flex items-center gap-2">
          <Brain className="w-8 h-8" />
          AI Copilot
        </h1>
        <p className="body-regular">Natural language interface for instant data insights</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      <Card glass padding="none" className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-synora-black text-synora-white'
                      : 'bg-synora-gray-100 text-synora-black'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-semibold">AI Copilot</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.generated_sql && (
                    <div className="mt-3 p-3 bg-synora-black/10 rounded-lg">
                      <div className="text-xs font-semibold mb-1">Generated SQL:</div>
                      <code className="text-xs">{message.generated_sql}</code>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="px-4 py-3 bg-synora-gray-100 rounded-2xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing data...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="p-6 border-t border-synora-gray-200">
            <div className="text-sm text-synora-gray-600 mb-3">Try asking:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setInput(query)}
                  className="text-left px-4 py-2 bg-synora-gray-100 hover:bg-synora-gray-200 rounded-lg transition-colors text-sm"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-synora-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask anything about your data..."
              className="flex-1 px-4 py-2.5 bg-synora-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black transition-all"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
