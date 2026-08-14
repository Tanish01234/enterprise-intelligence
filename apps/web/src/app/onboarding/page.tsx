'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Briefcase, Users, Database, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, title: 'Personal Info', icon: Users },
  { id: 2, title: 'Company Info', icon: Building2 },
  { id: 3, title: 'Create Organization', icon: Briefcase },
  { id: 4, title: 'Upload Data', icon: Database },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    companyName: '',
    industry: '',
    companySize: '',
    organizationName: '',
  })

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      await completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      // Step 1: Update profile
      const profileResponse = await apiClient.profiles.completeOnboarding({
        full_name: formData.fullName,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        industry: formData.industry,
        company_size: formData.companySize,
      })

      if (!profileResponse.success) {
        throw new Error(profileResponse.error || 'Failed to update profile')
      }

      // Step 2: Create organization
      const orgResponse = await apiClient.organizations.create(
        formData.organizationName || formData.companyName
      )

      if (!orgResponse.success) {
        throw new Error(orgResponse.error || 'Failed to create organization')
      }

      toast.success('Welcome to Synora!')
      router.push('/app/dashboard?onboarding=complete')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error(error instanceof Error ? error.message : 'Onboarding failed')
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0
      case 2:
        return formData.companyName.trim().length > 0
      case 3:
        return formData.organizationName.trim().length > 0 || formData.companyName.trim().length > 0
      case 4:
        return true // Optional step
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-synora-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.id
                        ? 'bg-synora-black text-white'
                        : currentStep === step.id
                        ? 'bg-synora-black text-white'
                        : 'bg-synora-gray-300 text-synora-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-sm font-medium mt-2">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 transition-all ${
                      currentStep > step.id ? 'bg-synora-black' : 'bg-synora-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card glass className="p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                  <p className="text-synora-gray-600">Let's get to know you better</p>
                </div>

                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                  glass
                />

                <Input
                  label="Job Title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="Data Analyst"
                  glass
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Company Information</h2>
                  <p className="text-synora-gray-600">Tell us about your company</p>
                </div>

                <Input
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                  glass
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-4 py-2 bg-white/50 border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black"
                    >
                      <option value="">Select Industry</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Company Size</label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                      className="w-full px-4 py-2 bg-white/50 border border-synora-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-synora-black"
                    >
                      <option value="">Select Size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Create Your Organization</h2>
                  <p className="text-synora-gray-600">Set up your workspace</p>
                </div>

                <Input
                  label="Organization Name"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder={formData.companyName || 'My Organization'}
                  glass
                  helperText="You can use your company name or create a different workspace name"
                />

                <div className="bg-synora-gray-100 rounded-lg p-4">
                  <p className="text-sm text-synora-gray-700">
                    <strong>What's an organization?</strong><br />
                    An organization is your team's workspace where you can collaborate, share datasets, and manage permissions.
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">All Set!</h2>
                  <p className="text-synora-gray-600">You're ready to start using Synora</p>
                </div>

                <div className="bg-synora-gray-100 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">What's Next?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-synora-black mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Upload your first dataset from CSV or Excel files</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-synora-black mt-0.5 flex-shrink-0" />
                      <span className="text-sm">View automated analytics and insights on your dashboard</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-synora-black mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Ask questions using our AI-powered query assistant</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-synora-gray-200">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              loading={loading}
            >
              {currentStep === 4 ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-synora-gray-600 mt-4">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  )
}
