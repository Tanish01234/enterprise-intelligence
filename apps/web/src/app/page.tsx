'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Brain, Database, LineChart, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analytics',
    description: 'Natural language queries transform complex data analysis into simple conversations with our advanced AI engine.',
  },
  {
    icon: Database,
    title: 'Enterprise Data Management',
    description: 'Centralize all your data sources with intelligent schema mapping and automated data pipeline orchestration.',
  },
  {
    icon: LineChart,
    title: 'Real-Time Intelligence',
    description: 'Lightning-fast DuckDB engine delivers instant insights across billions of rows with sub-second query performance.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, SOC 2 compliance, and granular access controls protect your most sensitive data.',
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Production-ready infrastructure with automatic scaling, monitoring, and 99.99% uptime SLA guarantee.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Multi-tenant workspaces with role-based permissions enable seamless collaboration across your organization.',
  },
]

const stats = [
  { value: '10B+', label: 'Rows Analyzed' },
  { value: '<50ms', label: 'Query Speed' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: ':)', label: 'Enterprise Clients' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-synora-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-synora-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-2xl font-bold tracking-tight">Synora</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-synora-gray-700 hover:text-synora-black transition-colors font-medium">
                Features
              </Link>
              <Link href="#solutions" className="text-synora-gray-700 hover:text-synora-black transition-colors font-medium">
                Solutions
              </Link>
              <Link href="#enterprise" className="text-synora-gray-700 hover:text-synora-black transition-colors font-medium">
                Enterprise
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-synora-gray-100 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Built for Hackorbit GDG x Dezai</span>
            </motion.div>
            
            <h1 className="heading-1 mb-6">
              Enterprise Intelligence
              <br />
              <span className="text-synora-gray-600">Reimagined</span>
            </h1>
            
            <p className="body-large max-w-2xl mx-auto mb-10">
              Transform your data into actionable intelligence with AI-powered analytics.
              Query in natural language, visualize in real-time, decide with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary" size="lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <Card key={index} glass padding="lg" className="text-center">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-synora-gray-600">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-synora-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 mb-4">
              Built for Enterprise Scale
            </h2>
            <p className="body-large max-w-2xl mx-auto">
              Everything you need to manage, analyze, and understand your enterprise data
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <div className="w-12 h-12 bg-synora-black rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-synora-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="body-regular">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card glass padding="lg" className="text-center">
              <h2 className="heading-3 mb-4">
                Ready to Transform Your Data?
              </h2>
              <p className="body-large mb-8">
                Join leading enterprises using Synora for data-driven decisions
              </p>
              <Link href="/auth/signup">
                <Button size="lg">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-synora-gray-200 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-lg font-bold">Synora</span>
            </div>
            <p className="text-sm text-synora-gray-600">
              © 2026 Synora. Enterprise Intelligence Reimagined.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
