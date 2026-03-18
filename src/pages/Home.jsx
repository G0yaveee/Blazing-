import { Link } from "react-router-dom"

const boards = [
  { id: 1, name: "Emerald", color: "border-pink-400", postsToday: 2 },
  { id: 2, name: "Fal", color: "border-green-400", postsToday: 1 },
  { id: 3, name: "Hex", color: "border-red-400", postsToday: 3 },
  { id: 4, name: "Mars", color: "border-purple-400", postsToday: 0 },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Boards</h1>
          <Link to="/feed" className="btn btn-primary">Today’s Feed</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              to={`/board/${board.id}`}
              className={`card bg-base-100 shadow-md border-t-4 ${board.color}`}
            >
              <div className="card-body">
                <h2 className="card-title">{board.name}</h2>
                <p>{board.postsToday} posts today</p>
                <progress className="progress progress-primary w-full" value="60" max="100"></progress>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}