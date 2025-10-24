import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import Signup from "./Signup.js"
import Login from "./login.js"

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
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link to="/signup">
                    <button style={{ padding: "10px 20px", fontSize: "16px" }}>
                      📝 Go to Signup
                    </button>
                  </Link>
                  <Link to="/login">
                    <button style={{ padding: "10px 20px", fontSize: "16px" }}>
                      🔐 Go to Login
                    </button>
                  </Link>
                </div>
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

          {/* ✅ Login Page */}
          <Route
            path="/login"
            element={
              <div>
                <h1>🔐 Login</h1>
                <Login />
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
