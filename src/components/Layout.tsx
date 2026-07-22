import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">PL</span>
          <div>
            <strong>Premier League Predictor</strong>
            <p>2026/27 season</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end>
            Predict
          </NavLink>
          <NavLink to="/league">League table</NavLink>
          <NavLink to="/my-scores">My scores</NavLink>
        </nav>

        <div className="user-panel">
          {profile ? (
            <>
              <span className="username">@{profile.username}</span>
              <button type="button" className="ghost-button" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}
