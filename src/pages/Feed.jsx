import { Link } from "react-router-dom"

const posts = [
  { id: 1, user: "Sam", task: "Gym", caption: "Done for today." },
  { id: 2, user: "Alex", task: "Study", caption: "Finished chapter 2." },
]

export default function Feed() {
  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Today’s Feed</h1>
          <Link to="/home" className="btn btn-outline">Back</Link>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">{post.user}</h2>
                <p className="font-medium">{post.task}</p>
                <p>{post.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}