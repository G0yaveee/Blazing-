import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import Board from "./pages/Board"
import Feed from "./pages/Feed"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/board/:id" element={<Board />} />
      </Routes>
    </BrowserRouter>
  )
}