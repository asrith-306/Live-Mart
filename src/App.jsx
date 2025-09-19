import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("Products") // 👈 replace with your table name
        .select("id, name")

      if (error) {
        console.error("Error fetching data:", error.message)
      } else {
        setUsers(data)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>👥 User List</h1>
      <ul>
        {users.length > 0 ? (
          users.map((user) => (
            <li key={user.id}>
              {user.id} — {user.name}
            </li>
          ))
        ) : (
          <p>No data found</p>
        )}
      </ul>
    </div>
  )
}

export default App
