import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';




const AuthPage: React.FC = () => {
  const navigate = useNavigate()

  const [loginUserId, setLoginUserId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupUserId, setSignupUserId] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // If already logged in, go straight to dashboard (helps with "state persists" later)
  useEffect(() => {
    const existing = localStorage.getItem('userId')
    if (existing) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSignup = async () => {
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: signupUserId.trim(),
          password: signupPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        return
      }

      setMessage('Sign up successful. You can now log in.')
      setSignupUserId('')
      setSignupPassword('')
    } catch (err) {
      setError('Network error during sign up')
    }
  }

  const handleLogin = async () => {
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loginUserId.trim(),
          password: loginPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Persist simple auth state
      localStorage.setItem('userId', data.userId)
      navigate('/dashboard')
    } catch (err) {
      setError('Network error during login')
    }
  }

  return (
    <div style={{display: 'grid', gap: 20}}>
      <section className="card">
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <h1>Hardware-as-a-Service (HaaS) Platform</h1>
          <p style={{color: 'var(--muted)', fontSize: '1.1em'}}>
            Access shared hardware resources for your projects
          </p>
          <div style={{padding: '12px', backgroundColor: 'var(--accent-bg)', borderRadius: '4px', marginTop: '12px'}}>
            <p style={{margin: 0, fontSize: '0.9em'}}>
              🔧 <strong>Available Resources:</strong> Arduino Kits (HWSet1) • Raspberry Pi Kits (HWSet2)<br/>
              👥 <strong>Collaboration:</strong> Create projects and invite team members<br/>
              📊 <strong>Management:</strong> Real-time hardware checkout and check-in
            </p>
          </div>
        </div>

        <h2>Sign In</h2>
        {error && <div style={{color: 'salmon', marginBottom: '12px'}}>{error}</div>}
        {message && <div style={{color: 'green', marginBottom: '12px'}}>{message}</div>}

        <div className="row">
          <input
            placeholder="User ID"
            value={loginUserId}
            onChange={(e) => setLoginUserId(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Sign In</button>
        </div>
      </section>

      <section className="card">
        <h2>New User? Sign Up</h2>
        <div className="row">
          <input
            placeholder="Choose User ID"
            value={signupUserId}
            onChange={(e) => setSignupUserId(e.target.value)}
          />
          <input
            placeholder="Choose Password"
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
          />
          <button onClick={handleSignup}>Sign Up</button>
        </div>
      </section>
    </div>
  )
}

export default AuthPage
