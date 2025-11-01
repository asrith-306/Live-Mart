import { Link, useNavigate } from "react-router-dom";

interface NavigationProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navigation({ isLoggedIn, onLogout }: NavigationProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <nav style={{
      backgroundColor: "#4F46E5",
      color: "white",
      padding: "15px 30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <Link to="/" style={{ color: "white", fontSize: "24px", fontWeight: "bold", textDecoration: "none" }}>
        🛒 Live Mart
      </Link>
      
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link>
        <Link to="/dashboard" style={{ color: "white", textDecoration: "none" }}>Products</Link>
        
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#EF4444",
              color: "white",
              padding: "8px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
            <Link
              to="/signup"
              style={{
                backgroundColor: "#FCD34D",
                color: "#1F2937",
                padding: "8px 20px",
                borderRadius: "5px",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}