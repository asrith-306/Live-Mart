import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface FeedbackFormProps {
  productId: string;
  userId: string; // logged-in user ID or demo ID
}

export default function FeedbackForm({ productId, userId }: FeedbackFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // 🧠 Load existing feedbacks for this product
  async function loadFeedback() {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && data) setFeedbacks(data);
    else console.error("Error loading feedback:", error);
  }

  useEffect(() => {
    loadFeedback();
  }, [productId]);

  // ⚡ Real-time updates for new feedbacks
  useEffect(() => {
    const channel = supabase
      .channel("feedback-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        (payload) => {
          if (payload.new.product_id === productId) {
            // Add new feedback instantly
            setFeedbacks((prev) => [payload.new, ...prev]);
            alert("🆕 New feedback added!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  // 📝 Handle feedback submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      alert("⚠️ Please write a comment before submitting.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("feedback").insert([
      {
        product_id: productId,
        customer_id: userId,
        rating,
        comment,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("❌ Error adding feedback: " + error.message);
      console.error(error);
    } else {
      alert("✅ Thanks for your feedback!");
      setComment("");
      setRating(5);
      loadFeedback(); // refresh list
    }
  }

  return (
    <div className="p-4 border rounded-xl shadow-sm mt-4 bg-white">
      {/* 🧾 Feedback form */}
      <form onSubmit={handleSubmit}>
        <label className="font-semibold">Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="ml-2 border rounded p-1"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <textarea
          className="block w-full border mt-3 p-2 rounded"
          value={comment}
          placeholder="Write your review..."
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          type="submit"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      {/* 💬 Display existing feedbacks */}
      <div className="mt-5">
        <h4 className="font-semibold mb-2 text-lg">Customer Reviews</h4>
        {feedbacks.length > 0 ? (
          <ul className="space-y-2">
            {feedbacks.map((f) => (
              <li
                key={f.id}
                className="border-b pb-2 text-sm text-gray-700 flex flex-col"
              >
                <span>
                  ⭐ <b>{f.rating}</b>/5 — {f.comment}
                </span>
                <span className="text-xs text-gray-500">
                  {f.customer_id ? f.customer_id.slice(0, 8) : "Anonymous"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
