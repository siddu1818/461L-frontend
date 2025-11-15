import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'

export default function App() {
  return (
    <div className="container">
      {/* <header className="header">
        <h1>HaaS Proof-of-Concept</h1>
        <p className="subtitle">Static prototype (React + TypeScript)</p>
      </header> */}

      <main className="grid">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} HaaS PoC</span>
      </footer>
    </div>
  )
}
