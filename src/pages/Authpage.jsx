import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const result = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

      if (result.error) {
        setMessage(result.error.message)
      } else {
        setMessage(
          isLogin
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
              {isLogin ? "Welcome back" : "Create your account"}
            </p>
            <h2 className="brand-heading text-3xl text-base-content">
              {isLogin ? "Sign in" : "Join the board"}
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

            <label className="form-control w-full text-left">
              <div className="label">
                <span className="label-text text-base-content/80">Password</span>
              </div>
              <input
                type="password"
                placeholder="Type your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="input input-bordered w-full bg-base-100"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-2 border-none text-primary-content"
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="btn btn-ghost text-base-content/80"
            >
              Switch to {isLogin ? "Sign Up" : "Login"}
            </button>

            {message ? (
              <div
                className={`alert ${message.toLowerCase().includes("success") || message.toLowerCase().includes("logged")
                  ? "alert-success"
                  : "alert-warning"} text-sm`}
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
