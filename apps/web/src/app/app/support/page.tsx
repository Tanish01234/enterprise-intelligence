'use client'

import { Mail, MessageSquare, Book, HelpCircle, Send, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SupportPage() {
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Compose email using mailto
    const mailtoLink = `mailto:main.synora@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + '\n\nFrom: ' + email)}`
    window.location.href = mailtoLink
    
    toast.success('Opening your email client...')
  }

  const supportCategories = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      action: 'View Docs',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      action: 'Start Chat',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: HelpCircle,
      title: 'FAQs',
      description: 'Find answers to commonly asked questions',
      action: 'Browse FAQs',
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  const faqItems = [
    {
      question: 'How do I upload a dataset?',
      answer: 'Navigate to the Datasets page and click "Upload Dataset". Select your CSV, XLS, or XLSX file and wait for processing to complete.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'Synora supports CSV, XLS, and XLSX files up to 100MB in size.',
    },
    {
      question: 'How do I invite team members?',
      answer: 'Go to the Team page and click "Invite Member". Enter their email address and select their role.',
    },
    {
      question: 'Can I export my reports?',
      answer: 'Yes! You can export reports as PDF, CSV, or Excel from the Reports page.',
    },
    {
      question: 'How does AI querying work?',
      answer: 'Our AI assistant converts your natural language questions into SQL queries and executes them on your datasets.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes. All data is encrypted at rest and in transit. We use Supabase for secure storage and authentication.',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3">How can we help?</h1>
        <p className="text-synora-gray-600 text-lg">
          Get support from our team or browse resources
        </p>
      </div>

      {/* Contact Card */}
      <Card glass padding="lg" className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-synora-black rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Contact Support</h2>
          <p className="text-synora-gray-600">
            Need help? Contact our support team for technical assistance, billing support, workspace issues, and feature requests.
          </p>
        </div>

        {/* Email Display */}
        <div className="bg-synora-gray-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Mail className="w-5 h-5 text-synora-gray-600" />
            <a
              href="mailto:main.synora@gmail.com"
              className="text-xl font-semibold text-synora-black hover:underline"
            >
              main.synora@gmail.com
            </a>
          </div>
        </div>

        {/* Quick Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            glass
          />

          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="How can we help?"
            required
            glass
          />

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={6}
              required
              className="w-full px-4 py-3 bg-white/50 border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black resize-none"
            />
          </div>

          <Button type="submit" fullWidth size="lg">
            <Send className="w-5 h-5" />
            Send Message
          </Button>
        </form>
      </Card>

      {/* Support Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportCategories.map((category, index) => {
          const Icon = category.icon
          return (
            <Card key={index} glass hover className="cursor-pointer">
              <div className="text-center p-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${category.color} rounded-full mb-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">{category.title}</h3>
                <p className="text-sm text-synora-gray-600 mb-4">
                  {category.description}
                </p>
                <Button variant="secondary" size="sm" fullWidth>
                  {category.action}
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* FAQs */}
      <Card glass padding="lg">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((faq, index) => (
            <details
              key={index}
              className="group bg-synora-gray-50 rounded-lg p-4 cursor-pointer"
            >
              <summary className="flex items-center justify-between font-semibold text-synora-gray-900 list-none">
                <span>{faq.question}</span>
                <HelpCircle className="w-5 h-5 text-synora-gray-600 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-synora-gray-600 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Card>

      {/* Additional Resources */}
      <Card glass padding="lg">
        <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg hover:bg-synora-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Book className="w-5 h-5 text-synora-gray-600" />
              <div>
                <h3 className="font-semibold">User Guide</h3>
                <p className="text-sm text-synora-gray-600">Complete documentation</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-synora-gray-400" />
          </a>

          <a
            href="#"
            className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg hover:bg-synora-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-synora-gray-600" />
              <div>
                <h3 className="font-semibold">API Documentation</h3>
                <p className="text-sm text-synora-gray-600">For developers</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-synora-gray-400" />
          </a>

          <a
            href="#"
            className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg hover:bg-synora-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-synora-gray-600" />
              <div>
                <h3 className="font-semibold">Video Tutorials</h3>
                <p className="text-sm text-synora-gray-600">Step-by-step guides</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-synora-gray-400" />
          </a>

          <a
            href="#"
            className="flex items-center justify-between p-4 bg-synora-gray-50 rounded-lg hover:bg-synora-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Book className="w-5 h-5 text-synora-gray-600" />
              <div>
                <h3 className="font-semibold">Community Forum</h3>
                <p className="text-sm text-synora-gray-600">Connect with users</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-synora-gray-400" />
          </a>
        </div>
      </Card>

      {/* Response Time */}
      <Card glass padding="lg" className="bg-gradient-to-r from-synora-black to-synora-gray-800 text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">We typically respond within 24 hours</h3>
          <p className="text-synora-gray-300">
            Our support team is available Monday-Friday, 9AM-5PM EST
          </p>
        </div>
      </Card>
    </div>
  )
}
