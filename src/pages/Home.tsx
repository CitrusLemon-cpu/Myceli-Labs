import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      <h2>Welcome</h2>
      <p>Signed in as {user?.email}</p>
      <p style={{ marginTop: 16 }}>
        <Link to="/inbox" style={{ color: 'var(--accent)' }}>Go to Inbox →</Link>
      </p>
    </div>
  )
}
