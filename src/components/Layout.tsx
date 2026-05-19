import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="app-layout">
      <nav>
        <Link to="/" className="nav-brand">Myceli Labs</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/inbox">Inbox</Link>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
