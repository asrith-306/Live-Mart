import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import Signup from "./Signup.js"

function App() {
  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <Routes>
          {/* Welcome Page */}
          <Route
            path="/"
            element={
              <div>
                <h1>👋 Welcome to Live Mart</h1>
                <hr style={{ margin: "20px 0" }} />
                <Link to="/signup">
                  <button style={{ padding: "10px 20px", fontSize: "16px" }}>
                    📝 Go to Signup
                  </button>
                </Link>
              </div>
            }
          />

          {/* Signup Page */}
          <Route
            path="/signup"
            element={
              <div>
                <h1>📝 Signup</h1>
                <Signup />
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
