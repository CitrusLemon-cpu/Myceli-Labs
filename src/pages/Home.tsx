import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      <h2>Welcome</h2>
      <p>Signed in as {user?.email}</p>
      <p>Inbox, Ideas, and Projects coming soon.</p>
    </div>
  )
}
