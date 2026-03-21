import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

const themeRegistry = {
  emerald: {
    theme: "emeraldsky",
    pin: "#e7a8cb",
    chipBg: "rgba(255, 230, 243, 0.92)",
    chipText: "#d98eb9",
    line: "rgba(225, 177, 202, 0.45)",
    cardBackground:
      "radial-gradient(circle at 14% 16%, rgba(255, 204, 231, 0.95), transparent 18%), radial-gradient(circle at 84% 16%, rgba(181, 225, 255, 0.92), transparent 20%), radial-gradient(circle at 52% 8%, rgba(255, 244, 191, 0.55), transparent 18%), linear-gradient(135deg, #fff8fc 0%, #ffe9f5 28%, #ecf7ff 58%, #f8edff 100%)",
    shadow: "rgba(160, 197, 237, 0.26)",
  },
  falgras: {
    theme: "falgras",
    pin: "#5f98b3",
    chipBg: "rgba(215, 234, 241, 0.92)",
    chipText: "#5f98b3",
    line: "rgba(119, 169, 194, 0.35)",
    cardBackground:
      "radial-gradient(circle at 18% 14%, rgba(113, 167, 195, 0.16), transparent 18%), radial-gradient(circle at 84% 18%, rgba(185, 162, 122, 0.08), transparent 18%), linear-gradient(160deg, #112d3a 0%, #163847 46%, #1d4a5e 100%)",
    shadow: "rgba(18, 39, 51, 0.28)",
  },
  hex: {
    theme: "hex",
    pin: "#b62b3a",
    chipBg: "rgba(241, 236, 226, 0.94)",
    chipText: "#72805a",
    line: "rgba(207, 213, 163, 0.3)",
    cardBackground:
      "radial-gradient(circle at 18% 14%, rgba(182, 43, 58, 0.14), transparent 18%), radial-gradient(circle at 84% 20%, rgba(207, 213, 163, 0.28), transparent 18%), radial-gradient(circle at 24% 82%, rgba(170, 182, 140, 0.14), transparent 22%), radial-gradient(circle at 58% 12%, rgba(244, 239, 230, 0.08), transparent 18%), linear-gradient(160deg, #4a3632 0%, #5a4640 54%, #6a574f 100%)",
    shadow: "rgba(34, 24, 24, 0.24)",
  },
  mars: {
    theme: "mars",
    pin: "#c32040",
    chipBg: "rgba(248, 225, 235, 0.92)",
    chipText: "#cb4567",
    line: "rgba(255, 120, 183, 0.28)",
    cardBackground:
      "radial-gradient(circle at 18% 14%, rgba(255, 128, 183, 0.12), transparent 16%), radial-gradient(circle at 84% 18%, rgba(196, 92, 255, 0.12), transparent 18%), linear-gradient(155deg, #1d0d29 0%, #2a103d 48%, #37164f 100%)",
    shadow: "rgba(39, 15, 49, 0.32)",
  },
  default: {
    theme: "paperblaze",
    pin: "#8f5f3d",
    chipBg: "rgba(247, 232, 207, 0.92)",
    chipText: "#8f5f3d",
    line: "rgba(143, 95, 61, 0.2)",
    cardBackground:
      "linear-gradient(180deg, rgba(255,252,245,0.98), rgba(248,241,226,0.98))",
    shadow: "rgba(92, 70, 53, 0.16)",
  },
}

function getThemeMeta(themeName) {
  const normalized = String(themeName || "").trim().toLowerCase()
  return themeRegistry[normalized] || themeRegistry.default
}

function getOwnerLabel(board) {
  return board.owner?.display_name || board.owner?.username || "Unknown owner"
}

export default function Home({ user, onLogout }) {
  const [boards, setBoards] = useState([])
  const [boardInsights, setBoardInsights] = useState({})
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadBoards() {
      setLoading(true)
      setError("")

      const [boardsResult, profileResult] = await Promise.all([
        supabase
          .from("boards")
          .select(`
            id,
            owner_id,
            title,
            theme_name,
            accent_color,
            created_at,
            owner:profiles!boards_owner_id_fkey (
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", user.id)
          .maybeSingle(),
      ])

      if (!isMounted) return

      if (boardsResult.error) {
        setError(boardsResult.error.message)
        setBoards([])
      } else {
        setBoards(boardsResult.data ?? [])

        const boardIds = (boardsResult.data ?? []).map((board) => board.id)

        if (boardIds.length > 0) {
          const [tasksResult, postsResult] = await Promise.all([
            supabase
              .from("tasks")
              .select("id, board_id, type")
              .in("board_id", boardIds),
            supabase
              .from("posts")
              .select("id, board_id, created_at, image_url")
              .in("board_id", boardIds)
              .order("created_at", { ascending: false }),
          ])

          const postIds = postsResult.data?.map((post) => post.id) ?? []
          const commentsResult = postIds.length
            ? await supabase
              .from("comments")
              .select("post_id")
              .in("post_id", postIds)
            : { data: [], error: null }

          if (!tasksResult.error && !postsResult.error && !commentsResult.error) {
            const commentsByPost = (commentsResult.data ?? []).reduce((acc, comment) => {
              acc[comment.post_id] = (acc[comment.post_id] ?? 0) + 1
              return acc
            }, {})

            const nextInsights = boardIds.reduce((acc, boardId) => {
              const boardTasks = (tasksResult.data ?? []).filter((task) => task.board_id === boardId)
              const boardPosts = (postsResult.data ?? []).filter((post) => post.board_id === boardId)
              const postsAwaitingReview = boardPosts.filter((post) => !commentsByPost[post.id]).length

              acc[boardId] = {
                openRoutines: boardTasks.length,
                dailyCount: boardTasks.filter((task) => task.type === "daily").length,
                latestPostAt: boardPosts[0]?.created_at ?? null,
                latestProofType: boardPosts[0]?.image_url ? "Image proof" : boardPosts[0] ? "Text proof" : "No proof",
                needsReview: postsAwaitingReview,
                streakHint:
                  boardPosts.length > 0
                    ? `${boardPosts.length} total check-in${boardPosts.length === 1 ? "" : "s"}`
                    : "No check-ins yet",
              }

              return acc
            }, {})

            setBoardInsights(nextInsights)
          } else {
            setBoardInsights({})
          }
        } else {
          setBoardInsights({})
        }
      }

      if (!profileResult.error) {
        setUsername(
          profileResult.data?.username ||
            profileResult.data?.display_name ||
            user.email
        )
      }

      setLoading(false)
    }

    loadBoards()

    return () => {
      isMounted = false
    }
  }, [])

  function formatLastPost(value) {
    if (!value) return "No posts yet"

    const diffHours = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return "Posted just now"
    if (diffHours < 24) return `Posted ${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `Posted ${diffDays}d ago`
  }

  return (
    <main className="cork-shell min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-3 px-4 py-4 md:px-5 md:py-5">
        <nav className="paper-panel navbar rounded-[1.75rem] px-5 py-3">
          <div className="navbar-start min-w-0">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-primary/70">
                Blazing Realms
              </p>
              <h1 className="brand-heading truncate text-2xl text-base-content md:text-3xl">
                Boardwall
              </h1>
            </div>
          </div>

          <div className="navbar-center hidden gap-2 lg:flex">
            {boards.map((board) => {
              const themeMeta = getThemeMeta(board.theme_name)
              return (
                <span
                  key={board.id}
                  className="badge border-none px-3 py-3 text-[11px] uppercase tracking-[0.22em]"
                  style={{
                    background: themeMeta.chipBg,
                    color: themeMeta.chipText,
                  }}
                >
                  {board.theme_name || "paper"}
                </span>
              )
            })}
          </div>

          <div className="navbar-end gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs uppercase tracking-[0.2em] text-base-content/55">
                Logged in
              </p>
              <p className="max-w-[240px] truncate text-sm text-base-content/80">
                {username || user.email}
              </p>
            </div>
            <button type="button" onClick={onLogout} className="btn btn-primary btn-sm md:btn-md">
              Log out
            </button>
          </div>
        </nav>

        {loading ? (
          <div className="paper-panel rounded-box p-8 text-left">
            <span className="loading loading-dots loading-md text-primary" />
            <p className="mt-4 text-base-content/75">Loading boards...</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="alert alert-error shadow-sm">
            <span>Could not load boards: {error}</span>
          </div>
        ) : null}

        {!loading && !error && boards.length === 0 ? (
          <div className="paper-panel rounded-box p-8 text-left">
            <h2 className="brand-heading text-2xl text-base-content">
              No boards yet
            </h2>
            <p className="mt-3 text-base-content/75">
              Add rows to your `boards` table and they will appear here.
            </p>
          </div>
        ) : null}

        {!loading && !error && boards.length > 0 ? (
          <section className="cork-board flex-1 rounded-[2rem] p-3 md:p-3">
            <div className="mx-auto grid max-w-[1260px] content-start gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                {boards.map((board) => {
                const ownerLabel = getOwnerLabel(board)
                const themeMeta = getThemeMeta(board.theme_name)
                const themeLabel = String(board.theme_name || "paper").toUpperCase()
                const insight = boardInsights[board.id]

                return (
                  <Link
                    key={board.id}
                    to={`/boards/${board.id}`}
                    className="group block h-full"
                  >
                    <article
                      data-theme={themeMeta.theme}
                      className="relative min-h-[420px] h-full overflow-hidden rounded-[1rem] border text-base-content transition-transform duration-200 group-hover:-translate-y-1"
                      style={{
                        borderColor: themeMeta.line,
                        background: themeMeta.cardBackground,
                        boxShadow: `0 16px 30px ${themeMeta.shadow}`,
                      }}
                    >
                      <div
                        className="flex items-center border-b px-4 py-3"
                        style={{ borderColor: themeMeta.line }}
                      >
                        <span
                          className="inline-flex rounded-full px-4 py-2 text-xs tracking-[0.24em]"
                          style={{
                            background: themeMeta.chipBg,
                            color: themeMeta.chipText,
                          }}
                        >
                          {themeLabel}
                        </span>
                      </div>

                      <div className="flex min-h-[calc(100%-58px)] flex-col px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="brand-heading text-[2rem] md:text-[2.1rem]">
                              {board.title}
                            </h2>
                            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-base-content/62">
                              {ownerLabel}
                            </p>
                          </div>
                          <span className={`badge ${insight?.needsReview ? "badge-warning" : "badge-outline"} border-none px-3 py-3`}>
                            {insight?.needsReview ? `${insight.needsReview} need review` : "Clear"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-[0.9rem] bg-base-100/72 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                              Open routines
                            </p>
                            <p className="mt-2 text-xl font-semibold text-base-content">
                              {insight?.openRoutines ?? 0}
                            </p>
                          </div>
                          <div className="rounded-[0.9rem] bg-base-100/72 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                              Last post
                            </p>
                            <p className="mt-2 text-sm font-semibold text-base-content">
                              {formatLastPost(insight?.latestPostAt)}
                            </p>
                          </div>
                          <div className="rounded-[0.9rem] bg-base-100/60 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                              Daily focus
                            </p>
                            <p className="mt-2 text-sm font-semibold text-base-content">
                              {insight?.dailyCount ?? 0} daily routine{insight?.dailyCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="rounded-[0.9rem] bg-base-100/60 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-base-content/55">
                              Latest proof
                            </p>
                            <p className="mt-2 text-sm font-semibold text-base-content">
                              {insight?.latestProofType ?? "No proof"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto pt-4">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-base-content">
                            Open board
                            <span aria-hidden="true">→</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
                })}
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}
