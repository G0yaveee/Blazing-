import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { supabase } from "./lib/supabase"
import AuthPage from "./pages/Authpage"
import Home from "./pages/Home"
import Board from "./pages/Board"
import Feed from "./pages/Feed"

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div data-theme="paperblaze" className="paper-shell text-base-content">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={session ? "/home" : "/Authpage"} replace />}
          />
          <Route
            path="/Authpage"
            element={session ? <Navigate to="/home" replace /> : <AuthPage />}
          />
          <Route
            path="/home"
            element={
              session ? (
                <Home user={session.user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/Authpage" replace />
              )
            }
          />
          <Route
            path="/board/:id"
            element={
              session ? (
                <Board user={session.user} />
              ) : (
                <Navigate to="/Authpage" replace />
              )
            }
          />
          <Route
            path="/boards/:id"
            element={
              session ? (
                <Board user={session.user} />
              ) : (
                <Navigate to="/Authpage" replace />
              )
            }
          />
          <Route
            path="/feed"
            element={session ? <Feed /> : <Navigate to="/Authpage" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={session ? "/home" : "/Authpage"} replace />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
