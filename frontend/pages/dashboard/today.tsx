import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// 1. Initialize Supabase Client
// Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in your .env.local file
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Define the Task interface for TypeScript
interface Task {
  id: string
  type: string
  application_id: string
  due_at: string
  status: string
}

export default function DashboardToday() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // 2. Fetch Tasks Function
  const fetchTasks = async () => {
    setLoading(true)
    
    // Get today's date range (00:00 to 23:59)
    const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('tasks')
      .select('id, type, application_id, due_at, status')
      .neq('status', 'completed') // Exclude completed tasks
      .gte('due_at', `${todayStr}T00:00:00`)
      .lt('due_at', `${todayStr}T23:59:59`)

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks(data || [])
    }
    
    setLoading(false)
  }

  // 3. Mark Complete Function
  const markComplete = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)

    if (error) {
      alert('Error updating task')
      console.error(error)
    } else {
      // Refresh the list to remove the completed task
      fetchTasks()
    }
  }

  // Initial Fetch
  useEffect(() => {
    fetchTasks()
  }, [])

  if (loading) return <div style={{ padding: '20px' }}>Loading tasks...</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '20px' }}>Tasks Due Today</h1>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>Type</th>
            <th style={{ padding: '10px' }}>Application ID</th>
            <th style={{ padding: '10px' }}>Due At</th>
            <th style={{ padding: '10px' }}>Status</th>
            <th style={{ padding: '10px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No tasks due today!
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', textTransform: 'capitalize' }}>{task.type}</td>
                <td style={{ padding: '10px', fontFamily: 'monospace' }}>{task.application_id}</td>
                <td style={{ padding: '10px' }}>
                  {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    background: '#fff3cd', 
                    fontSize: '0.9em' 
                  }}>
                    {task.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button 
                    onClick={() => markComplete(task.id)}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    Mark Complete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}