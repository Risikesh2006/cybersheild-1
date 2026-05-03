'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import TopicGrid from '../components/TopicGrid'
import api from '../services/api'
import Stepper, { Step } from '@/components/Stepper'
import Particles from '@/components/ui/Particles'
import Folder from '@/components/Folder'

const USER_TYPES = [
  { id: 'student', icon: '🎓', label: 'Student', desc: 'Learning cybersecurity fundamentals.' },
  { id: 'professional', icon: '💼', label: 'Professional', desc: 'Operational scenarios, assumes baseline knowledge.' },
  { id: 'enterprise', icon: '🏢', label: 'Enterprise Team', desc: 'Process, communication, and team response.' },
]

const TOPICS = [
  { id: 'Network Security', name: 'Network Security', description: 'Firewalls, IDS/IPS, traffic analysis, network segmentation.', prerequisite: null },
  { id: 'Endpoint Security', name: 'Endpoint Security', description: 'EDR, host-based detection, device hardening.', prerequisite: null },
  { id: 'Cloud Security', name: 'Cloud Security', description: 'Cloud misconfigs, IAM, storage exposure, cloud-native threats.', prerequisite: 'Network Security' },
  { id: 'Identity & Access Management', name: 'Identity & Access Management', description: 'Auth, MFA, privilege escalation, SSO.', prerequisite: null },
  { id: 'Incident Response', name: 'Incident Response', description: 'NIST/SANS IR lifecycle, triage, containment, recovery.', prerequisite: null },
  { id: 'Threat Intelligence', name: 'Threat Intelligence', description: 'IoC analysis, TTPs, MITRE ATT&CK, intel feeds.', prerequisite: 'Incident Response' },
  { id: 'Malware Analysis', name: 'Malware Analysis', description: 'Static/dynamic analysis, sandboxing, behavioral patterns.', prerequisite: 'Endpoint Security' },
  { id: 'Social Engineering', name: 'Social Engineering', description: 'Phishing, pretexting, vishing, awareness programs.', prerequisite: null },
  { id: 'Secure Coding', name: 'Secure Coding', description: 'OWASP Top 10, code review, SAST/DAST, secure SDLC.', prerequisite: null },
  { id: 'Compliance & GRC', name: 'Compliance & GRC', description: 'Frameworks, risk assessments, audit trails, policy.', prerequisite: 'Incident Response' },
]

export default function Onboarding() {
  const [wizardStep, setWizardStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedTopics, setSelectedTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, refreshProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) setSelectedType(user.user_type)
  }, [user])

  function toggleTopic(id) {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function selectAll() {
    setSelectedTopics(TOPICS.map(t => t.id))
  }

  async function handleBeginTraining() {
    if (selectedTopics.length === 0) return
    setLoading(true)
    setError('')
    try {
      await api.post('/onboarding/topics', { topics: selectedTopics })
      await refreshProfile()
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const estimatedSessions = Math.ceil(selectedTopics.length * 1.5)
  const isNextDisabled =
    (wizardStep === 1 && !selectedType) ||
    (wizardStep === 2 && selectedTopics.length === 0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={150}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
          particleHoverFactor={1.35}
          cameraDistance={16}
          sizeRandomness={0.7}
          className="h-full w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/15 backdrop-blur-[0.4px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.84)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
          <Stepper
          initialStep={1}
          onStepChange={setWizardStep}
          onFinalStepCompleted={handleBeginTraining}
          completeOnFinalStep={false}
          disableStepIndicators
          backButtonText="← Back"
          nextButtonText={wizardStep === 1 ? 'Next →' : 'Continue →'}
          completeButtonText={loading ? 'Setting up…' : 'Begin Training'}
          isNextDisabled={isNextDisabled}
          isCompleteDisabled={loading || selectedTopics.length === 0}
          stepCircleContainerClassName="max-w-[700px]"
          >
            <Step>
              <div>
                <h2 style={{ marginBottom: 8 }}>Confirm Your Role</h2>
                <p className="prose" style={{ marginBottom: 24, fontSize: 13 }}>
                  This determines how scenarios are framed and how feedback is written.
                </p>
                <div className="role-folder-stage" style={{ marginBottom: 8 }}>
                  <Folder
                    className="role-folder-root"
                    color={selectedType ? '#7d57ff' : '#5227FF'}
                    size={1.5}
                    maxItems={3}
                    items={USER_TYPES.map((ut) => (
                      <div
                        key={ut.id}
                        className={`role-folder-role-card ${selectedType === ut.id ? 'is-selected' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedType(ut.id)
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            event.stopPropagation()
                            setSelectedType(ut.id)
                          }
                        }}
                      >
                        <div>
                          <div className="role-folder-role-title">{ut.label}</div>
                        </div>
                      </div>
                    ))}
                  />
                </div>
                {selectedType && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#A3A3A3' }}>
                    Selected role: {USER_TYPES.find((ut) => ut.id === selectedType)?.label}
                  </div>
                )}
              </div>
            </Step>

            <Step>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h2>What do you want to train on?</h2>
                  <button className="btn btn-secondary btn-sm" onClick={selectAll}>Select All</button>
                </div>
                <p className="prose" style={{ marginBottom: 24, fontSize: 13 }}>
                  Select topics, full domains, or the complete syllabus. At least one is required.
                </p>
                <TopicGrid
                  topics={TOPICS}
                  selected={selectedTopics}
                  onToggle={toggleTopic}
                  columns={2}
                />
              </div>
            </Step>

            <Step>
              <div>
                <h2 style={{ marginBottom: 8 }}>Ready to Begin</h2>
                <p className="prose" style={{ marginBottom: 24, fontSize: 13 }}>
                  Review your selections before starting your training programme.
                </p>
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
                    <div>
                      <div className="stat-value">{selectedTopics.length}</div>
                      <div className="stat-label">Topics Selected</div>
                    </div>
                    <div>
                      <div className="stat-value">~{estimatedSessions}</div>
                      <div className="stat-label">Est. Sessions</div>
                    </div>
                    <div>
                      <div className="stat-value">{selectedType}</div>
                      <div className="stat-label">User Type</div>
                    </div>
                  </div>
                  <div className="divider" style={{ marginBottom: 16 }} />
                  <div className="section-label">Topics</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedTopics.map(t => (
                      <span key={t} className="badge badge-accent">{t}</span>
                    ))}
                  </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
              </div>
            </Step>
          </Stepper>
        </div>
      </div>
    </div>
  )
}
