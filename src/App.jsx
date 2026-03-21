import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { supabase } from "./lib/supabase"
import AuthPage from "./pages/Authpage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import Home from "./pages/Home"
import Board from "./pages/Board"
import Feed from "./pages/Feed"

function hasRecoveryParams() {
  if (typeof window === "undefined") return false

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  return hashParams.get("type") === "recovery"
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(() => hasRecoveryParams())
  const user = session?.user ?? null

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryFlow(true)
      } else if (event === "SIGNED_OUT") {
        setIsRecoveryFlow(false)
      }

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

  const protectedElement = (renderElement) => {
    if (isRecoveryFlow) {
      return <Navigate to="/reset-password" replace />
    }

    if (!user) {
      return <Navigate to="/Authpage" replace />
    }

    return renderElement()
  }

  if (loading) {
    return <p>Loading...</p>
  }

  const authPageElement = user && !isRecoveryFlow ? <Navigate to="/home" replace /> : <AuthPage />

  return (
    <div data-theme="paperblaze" className="paper-shell text-base-content">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={isRecoveryFlow ? "/reset-password" : user ? "/home" : "/Authpage"}
                replace
              />
            }
          />
          <Route path="/Authpage" element={authPageElement} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/home"
            element={protectedElement(() => (
              <Home user={user} onLogout={handleLogout} />
            ))}
          />
          <Route
            path="/board/:id"
            element={protectedElement(() => <Board user={user} />)}
          />
          <Route
            path="/boards/:id"
            element={protectedElement(() => <Board user={user} />)}
          />
          <Route
            path="/feed"
            element={protectedElement(() => <Feed />)}
          />
          <Route
            path="*"
            element={
              <Navigate
                to={isRecoveryFlow ? "/reset-password" : user ? "/home" : "/Authpage"}
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
