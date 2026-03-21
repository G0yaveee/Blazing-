import { useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

function getAlertClass(message) {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("success") ||
    normalized.includes("logged") ||
    normalized.includes("check your email") ||
    normalized.includes("password updated")
  ) {
    return "alert-success"
  }

  return "alert-warning"
}

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState("login")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const isForgotView = view === "forgot"
  const isLoginView = view === "login"

  const resetLink = useMemo(() => {
    if (typeof window === "undefined") return undefined

    const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim()
    const baseUrl = window.location.hostname === "localhost"
      ? window.location.origin
      : configuredAppUrl || "https://blazing-green.vercel.app"

    return `${baseUrl.replace(/\/$/, "")}/reset-password`
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (isForgotView) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetLink,
        })

        if (error) {
          setMessage(error.message)
        } else {
          setMessage("Check your email for the password reset link.")
        }

        return
      }

      const result = isLoginView
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

      if (result.error) {
        setMessage(result.error.message)
      } else {
        setMessage(
          isLoginView
            ? "Logged in successfully."
            : "Account created successfully."
        )
      }
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
              {isForgotView
                  ? "Recover your access"
                  : isLoginView
                    ? "Welcome back"
                    : "Create your account"}
            </p>
            <h2 className="brand-heading text-3xl text-base-content">
              {isForgotView
                  ? "Forgot password?"
                  : isLoginView
                    ? "Sign in"
                    : "Join the board"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="form-control w-full text-left">
              <div className="label">
                <span className="label-text text-base-content/80">Email</span>
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="input input-bordered w-full bg-base-100"
              />
            </label>

            {!isForgotView ? (
              <label className="form-control w-full text-left">
                <div className="label">
                  <span className="label-text text-base-content/80">
                    Password
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Type your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="input input-bordered w-full bg-base-100 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="btn btn-ghost btn-sm absolute top-1/2 right-2 -translate-y-1/2 px-2 text-base-content/70 hover:text-base-content"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18M10.58 10.58a2 2 0 102.83 2.83M9.88 5.09A10.94 10.94 0 0112 4.91c5.05 0 8.27 3.11 9.5 6.09a1.9 1.9 0 010 1.46 11.8 11.8 0 01-4.24 5.1M6.23 6.23A11.77 11.77 0 002.5 11a1.9 1.9 0 000 1.46c1.23 2.98 4.45 6.09 9.5 6.09 1.55 0 2.94-.29 4.18-.77"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-2 border-none text-primary-content"
            >
              {loading
                ? "Please wait..."
                : isForgotView
                    ? "Send reset link"
                    : isLoginView
                      ? "Login"
                      : "Create account"}
            </button>

            {isLoginView ? (
              <button
                type="button"
                onClick={() => {
                  setView("forgot")
                  setMessage("")
                  setPassword("")
                }}
                className="btn btn-ghost text-base-content/80"
              >
                Forgot password?
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setView(isLoginView ? "signup" : "login")
                setMessage("")
                setPassword("")
              }}
              className="btn btn-ghost text-base-content/80"
            >
              Switch to {isLoginView ? "Sign Up" : "Login"}
            </button>

            {!isLoginView && isForgotView ? (
              <button
                type="button"
                onClick={() => {
                  setView("login")
                  setMessage("")
                  setPassword("")
                }}
                className="btn btn-ghost text-base-content/80"
              >
                Back to login
              </button>
            ) : null}

            {message ? (
              <div
                className={`alert ${getAlertClass(message)} text-sm`}
              >
                <span>{message}</span>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  )
}
