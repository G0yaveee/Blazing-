import { useParams, Link } from "react-router-dom"

export default function Board() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Board {id}</h1>
          <Link to="/home" className="btn btn-outline">Back</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Daily</h2>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-base-200">Gym</div>
                <div className="p-3 rounded-lg bg-base-200">Read 10 pages</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Monthly</h2>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-base-200">Finish project</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Yearly</h2>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-base-200">Learn React well</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}