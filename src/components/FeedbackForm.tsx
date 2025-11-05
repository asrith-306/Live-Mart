import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

interface FeedbackFormProps {
  productId: string;
  userId: string;
}

export default function FeedbackForm({ productId, userId }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>("");

  // 🧠 Fetch logged-in user's email from Supabase Auth
  useEffect(() => {
    async function fetchUserName() {
      try {
        // Get user data from Supabase Auth (not from custom users table)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error.message);
          setUserName("Anonymous");
        } else if (user?.email) {
          // Use email or extract name from email
          const emailName = user.email.split('@')[0];
          setUserName(emailName || user.email);
        } else if (user?.user_metadata?.name) {
          // If user has a name in metadata
          setUserName(user.user_metadata.name);
        } else {
          setUserName("Anonymous");
        }
      } catch (err) {
        console.error("Error:", err);
        setUserName("Anonymous");
      }
    }

    fetchUserName();
  }, [userId]);

  // 🔍 Fetch all feedback for the product
  useEffect(() => {
    async function fetchFeedback() {
      const { data, error } = await supabase
        .from("feedback")
        .select("rating, comment, user_name")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching feedback:", error.message);
      else setFeedbacks(data || []);
    }

    if (productId) fetchFeedback();
  }, [productId]);

  // 💾 Submit new feedback
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!comment.trim()) {
      alert("Please write something before submitting!");
      return;
    }

    const { error } = await supabase.from("feedback").insert([
      {
        product_id: productId,
        customer_id: userId,
        rating,
        comment,
        user_name: userName || "Anonymous",
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
      alert("❌ Failed to submit feedback: " + error.message);
    } else {
      alert("✅ Feedback submitted successfully!");
      setComment("");
      setRating(5);

      // Refresh feedback list
      const { data } = await supabase
        .from("feedback")
        .select("rating, comment, user_name")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      setFeedbacks(data || []);
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Feedback Form */}
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Rating:
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{
              marginLeft: "10px",
              padding: "4px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            height: "80px",
            margin: "10px 0",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Submit Feedback
        </button>
      </form>

      {/* Feedback List */}
      <h4 style={{ marginTop: "1.5rem", fontWeight: "bold" }}>
        Customer Reviews
      </h4>

      {feedbacks.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {feedbacks.map((f, i) => {
            const displayName = f.user_name || "Anonymous";
            return (
              <li
                key={i}
                style={{
                  borderBottom: "1px solid #ddd",
                  padding: "8px 0",
                  fontSize: "15px",
                }}
              >
                ⭐ {f.rating}/5 — {f.comment || "No comment"} — {displayName}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No feedback yet.</p>
      )}
    </div>
  );
}