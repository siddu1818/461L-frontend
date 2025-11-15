import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://127.0.0.1:5000'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  // Create project form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')

  // Get project by id state
  const [lookupId, setLookupId] = useState('')
  const [projects, setProjects] = useState<Array<any>>([])
  const [publicProjects, setPublicProjects] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [publicLoading, setPublicLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showPublicProjects, setShowPublicProjects] = useState(false)

  const handleCreate = async () => {
    setError(null)
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('Please log in first')
      return
    }
    
    const idToUse = projectId || `proj-${Date.now()}`
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: idToUse, 
          name, 
          description, 
          createdBy: userId,
          isPublic: false,  // Default to private projects
          // request backend to create default hardware sets for this project
          default_hwset1_total: 15,
          default_hwset2_total: 10
        }),
      })

      // handle network-level failures
      if (!res) {
        throw new Error('No response from server')
      }

      // attempt to parse response JSON (may fail if server error returns non-json)
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        // show server-provided error where available
        const serverMsg = body && (body.error || body.message)
        setError(serverMsg ? String(serverMsg) : `Failed to create project (status ${res.status})`)
        return
      }

      // backend includes created resources in response.resources
      if (body.resources && Array.isArray(body.resources)) {
        console.log(`Created project ${idToUse} with resources:`, body.resources)
      }

      // navigate to the project page and pass the metadata
      navigate(`/project/${idToUse}`, { state: { name, description } })
    } catch (err: any) {
      // network errors (e.g. "Failed to fetch") will be shown to the user
      setError(String(err.message || err))
    } finally {
      setCreating(false)
    }
  }

  const handleLookup = async () => {
    setError(null)
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('Please log in first')
      return
    }
    
    if (!lookupId) {
      setError('Please enter a project ID')
      return
    }
    try {
      // First, attempt to join the project (works for public projects; will be rejected for private)
      const joinRes = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(lookupId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (joinRes.status === 404) {
        setError('Project not found')
        return
      }
      if (joinRes.status === 403) {
        const body = await joinRes.json().catch(() => ({}))
        setError(body.error || 'Access denied - cannot join this project')
        return
      }

      if (!joinRes.ok) {
        const body = await joinRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to join project')
      }

      // After joining (or if already a member), fetch project details to get name/description
      const detailsRes = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(lookupId)}?userId=${encodeURIComponent(userId)}`)
      if (!detailsRes.ok) {
        const body = await detailsRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load project after joining')
      }
      const data = await detailsRes.json()
      navigate(`/project/${lookupId}`, { state: { name: data.name, description: data.description, isPublic: data.isPublic } })
    } catch (err: any) {
      console.error(err)
      setError(String(err.message || err))
    }
  }

  useEffect(() => {
    let cancelled = false
    const userId = localStorage.getItem('userId')
    if (!userId) return // Don't fetch projects if not logged in
    
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/api/projects?userId=${encodeURIComponent(userId)}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch projects')
        return res.json()
      })
      .then(data => {
        if (!cancelled) setProjects(data)
      })
      .catch(err => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const fetchPublicProjects = async () => {
    setPublicLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/projects/public`)
      if (res.ok) {
        const data = await res.json()
        setPublicProjects(data)
      }
    } catch (err) {
      console.error('Failed to fetch public projects:', err)
    } finally {
      setPublicLoading(false)
    }
  }

  const handleJoinPublicProject = async (projectId: string) => {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      if (res.ok) {
        // Refresh user projects to show the newly joined project
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to join project:', err)
    }
  }

  return (
    <>
      <section className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2>HaaS Project Dashboard</h2>
            <p style={{color: 'var(--muted)', margin: '4px 0'}}>
              Welcome, {localStorage.getItem('userId')}! Manage your hardware projects below.
            </p>
          </div>
          <button onClick={() => {
            localStorage.removeItem('userId')
            navigate('/')
          }}>Log out</button>
        </div>
        
        <div style={{marginTop: '16px', padding: '12px', backgroundColor: 'var(--accent-bg)', borderRadius: '4px'}}>
          <h4 style={{margin: '0 0 8px 0'}}>Hardware-as-a-Service (HaaS) System</h4>
          <p style={{margin: 0, fontSize: '0.9em', color: 'var(--muted)'}}>
            Create projects to access shared hardware resources including Arduino kits (HWSet1) and Raspberry Pi kits (HWSet2). 
            Collaborate with team members and manage hardware checkout/checkin operations.
          </p>
        </div>

        <div style={{display: 'grid', gap: 12}}>
          <div className="card">
            <h3>Create Project</h3>
            <div className="row">
              <input placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} />
              <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <input placeholder="Project ID" value={projectId} onChange={e => setProjectId(e.target.value)} />
              <button onClick={handleCreate}>Create Project</button>
            </div>
          </div>

          <div className="card">
            <h3>Join Existing Project</h3>
            <div className="row">
              <input placeholder="Project ID" value={lookupId} onChange={e => setLookupId(e.target.value)} />
              <button onClick={handleLookup}>Join Project</button>
            </div>
          </div>
        </div>

        <div style={{marginTop: 16}}>
          <h3>Your Projects</h3>
          <p style={{fontSize: '0.9em', color: 'var(--muted)', marginBottom: '12px'}}>
            Projects you created or were invited to join
          </p>
          {loading && <div>Loading projects...</div>}
          {error && <div style={{color: 'salmon'}}>Error: {error}</div>}
          {!loading && !error && (
            <div style={{display: 'grid', gap: '8px'}}>
              {projects.map((p: any) => (
                <div 
                  key={p.projectId} 
                  className="card" 
                  style={{cursor: 'pointer', padding: '12px'}} 
                  onClick={() => navigate(`/project/${p.projectId}`)}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h4 style={{margin: '0 0 4px 0'}}>{p.name}</h4>
                      <p style={{margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--muted)'}}>
                        ID: {p.projectId} {p.description ? `• ${p.description}` : ''}
                      </p>
                      <div style={{fontSize: '0.8em', color: 'var(--muted)'}}>
                        {p.createdBy && `Created by: ${p.createdBy}`} • 
                        {p.isPublic ? ' Public Project' : ' Private Project'}
                      </div>
                    </div>
                    <div style={{fontSize: '1.2em'}}>→</div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div style={{textAlign: 'center', padding: '20px', color: 'var(--muted)'}}>
                  No projects yet. Create a new project or browse public projects below.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{marginTop: 20}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
            <h3>Browse Public Projects</h3>
            <button 
              onClick={() => {
                setShowPublicProjects(!showPublicProjects)
                if (!showPublicProjects && publicProjects.length === 0) {
                  fetchPublicProjects()
                }
              }}
              style={{fontSize: '0.9em'}}
            >
              {showPublicProjects ? 'Hide' : 'Show'} Public Projects
            </button>
          </div>
          
          {showPublicProjects && (
            <>
              <p style={{fontSize: '0.9em', color: 'var(--muted)', marginBottom: '12px'}}>
                Public projects you can join to access their hardware resources
              </p>
              {publicLoading && <div>Loading public projects...</div>}
              {!publicLoading && (
                <div style={{display: 'grid', gap: '8px'}}>
                  {publicProjects.filter(p => !projects.some(up => up.projectId === p.projectId)).map((p: any) => (
                    <div 
                      key={p.projectId} 
                      className="card" 
                      style={{padding: '12px', border: '1px dashed var(--accent)'}}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <h4 style={{margin: '0 0 4px 0'}}>{p.name}</h4>
                          <p style={{margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--muted)'}}>
                            ID: {p.projectId} {p.description ? `• ${p.description}` : ''}
                          </p>
                          <div style={{fontSize: '0.8em', color: 'var(--muted)'}}>
                            Created by: {p.createdBy} • Public Project
                          </div>
                        </div>
                        <button 
                          onClick={() => handleJoinPublicProject(p.projectId)}
                          style={{fontSize: '0.9em'}}
                        >
                          Join Project
                        </button>
                      </div>
                    </div>
                  ))}
                  {publicProjects.filter(p => !projects.some(up => up.projectId === p.projectId)).length === 0 && (
                    <div style={{textAlign: 'center', padding: '20px', color: 'var(--muted)'}}>
                      No public projects available to join.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Hardware sets are shown on the project page. */}
    </>
  )
}

export default DashboardPage
