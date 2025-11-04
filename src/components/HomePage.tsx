import { useNavigate } from "react-router-dom";

interface HomePageProps {
  isLoggedIn: boolean;
}

export default function HomePage({ isLoggedIn }: HomePageProps) {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "20px" }}>
          Welcome to <span style={{ color: "#4F46E5" }}>Live Mart</span>
        </h1>
        <p style={{ fontSize: "20px", color: "#666", marginBottom: "30px" }}>
          Your one-stop destination for fresh groceries and quality products
        </p>
        <button
          onClick={() => navigate("/customer")}
          style={{
            backgroundColor: "#4F46E5",
            color: "white",
            padding: "15px 40px",
            fontSize: "18px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Start Shopping Now
        </button>
      </div>

      {/* Only show login/signup buttons if NOT logged in */}
      {!isLoggedIn && (
        <div style={{
          backgroundColor: "#4F46E5",
          borderRadius: "20px",
          padding: "50px",
          textAlign: "center",
          color: "white"
        }}>
          <h2 style={{ fontSize: "32px", marginBottom: "15px" }}>Ready to Get Started?</h2>
          <p style={{ fontSize: "18px", marginBottom: "30px" }}>
            Join thousands of happy customers today!
          </p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/signup")}
              style={{
                backgroundColor: "white",
                color: "#4F46E5",
                padding: "12px 30px",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Create Account
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                backgroundColor: "transparent",
                color: "white",
                padding: "12px 30px",
                border: "2px solid white",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Show welcome back message if logged in */}
      {isLoggedIn && (
        <div style={{
          backgroundColor: "#10B981",
          borderRadius: "20px",
          padding: "50px",
          textAlign: "center",
          color: "white"
        }}>
          <h2 style={{ fontSize: "32px", marginBottom: "15px" }}>Welcome Back! 🎉</h2>
          <p style={{ fontSize: "18px", marginBottom: "30px" }}>
            Ready to continue shopping?
          </p>
          <button
            onClick={() => navigate("/customer")}
            style={{
              backgroundColor: "white",
              color: "#10B981",
              padding: "12px 30px",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}