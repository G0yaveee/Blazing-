import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function getAlertClass(message) {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("success") ||
    normalized.includes("updated") ||
    normalized.includes("ready")
  ) {
    return "alert-success"
  }

  return "alert-warning"
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("Checking your reset link...")
  const [loading, setLoading] = useState(false)
  const [readyToReset, setReadyToReset] = useState(false)
  const [linkStatus, setLinkStatus] = useState("checking")

  useEffect(() => {
    let isMounted = true

    const enableReset = () => {
      if (!isMounted) return
      setReadyToReset(true)
      setLinkStatus("ready")
      setMessage("Choose a new password to finish resetting your account.")
    }

    const checkRecoveryState = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const isRecoveryLink =
        hashParams.get("type") === "recovery" || Boolean(hashParams.get("access_token"))

      if (isRecoveryLink) {
        enableReset()
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      if (session) {
        enableReset()
      } else {
        setReadyToReset(false)
        setLinkStatus("invalid")
        setMessage("This password reset link is invalid or expired. Request a new reset email and try again.")
      }
    }

    void checkRecoveryState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        enableReset()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!readyToReset) {
      setLinkStatus("invalid")
      setMessage("This password reset link is invalid or expired. Request a new reset email and try again.")
      return
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage("Password updated successfully. Redirecting to login...")
      setPassword("")
      setConfirmPassword("")

      window.setTimeout(async () => {
        await supabase.auth.signOut()
        navigate("/Authpage", { replace: true })
      }, 1200)
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full place-items-center px-6 py-12">
      <section className="w-full max-w-md">
        <div className="paper-panel rounded-box p-6 md:p-8">
          <div className="mb-6 text-left">
            <p className="mb-2 text-sm uppercase tracking-[0.22em] text-secondary">
              Secure your account
            </p>
            <h2 className="brand-heading text-3xl text-base-content">
              Reset password
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="form-control w-full text-left">
              <div className="label">
                <span className="label-text text-base-content/80">New password</span>
              </div>
              <input
                type="password"
                placeholder="Choose a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={!readyToReset}
                className="input input-bordered w-full bg-base-100"
              />
            </label>

            <label className="form-control w-full text-left">
              <div className="label">
                <span className="label-text text-base-content/80">Confirm password</span>
              </div>
              <input
                type="password"
                placeholder="Retype your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                disabled={!readyToReset}
                className="input input-bordered w-full bg-base-100"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !readyToReset}
              className="btn btn-primary mt-2 border-none text-primary-content"
            >
              {loading
                ? "Saving new password..."
                : linkStatus === "checking"
                  ? "Checking link..."
                  : "Update password"}
            </button>

            <Link to="/Authpage" className="btn btn-ghost text-base-content/80">
              Back to login
            </Link>

            {message ? (
              <div className={`alert ${getAlertClass(message)} text-sm`}>
                <span>{message}</span>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  )
}
