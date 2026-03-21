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
    <main className="mx-auto grid min-h-screen w-full max-w-6xl place-items-center px-6 py-12">
      <section className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5 text-left">
          <div className="badge badge-lg badge-outline border-primary/30 bg-base-100 px-4 py-4 uppercase tracking-[0.25em] text-primary">
            Shared Journal
          </div>
          <div className="space-y-3">
            <h1 className="brand-heading text-5xl leading-tight text-base-content md:text-6xl">
              Blazing Realms
            </h1>
            <p className="max-w-xl text-lg leading-8 text-base-content/75">
              A cozy accountability space with paper textures, shared boards,
              and personal themes for every realm.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-base-content/70 md:grid-cols-3">
            <div className="paper-panel rounded-box p-4">
              Warm beige base theme
            </div>
            <div className="paper-panel rounded-box p-4">
              Shared boards for all members
            </div>
            <div className="paper-panel rounded-box p-4">
              Journal-style check-ins
            </div>
          </div>
        </div>

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
