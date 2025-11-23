import { useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function AuthCallback() {
  useEffect(() => {
    async function handleAuth() {
      // This loads the session from the URL hash
      await supabase.auth.getSession();

      // Optional: fetch user details or profile here

      // Redirect after login
      window.location.href = "/";
    }
    handleAuth();
  }, []);

  return (
    <div className="flex justify-center items-center h-screen text-lg">
      Signing you in…
    </div>
  );
}
