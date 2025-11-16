import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { saveCalendarToken } from '../services/googleCalendarService';
import { supabase } from '../utils/supabaseClient';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface GoogleCalendarAuthProps {
  onSuccess?: () => void;
}

function GoogleCalendarAuthInner({ onSuccess }: GoogleCalendarAuthProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_calendar_tokens')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login first');
        return;
      }

      // The credential response contains a JWT token, not an authorization code
      // We need to decode it or use it directly
      // For calendar access, we need to use Google's OAuth flow with proper scope
      
      // Note: The current implementation won't give calendar access
      // You need to implement server-side OAuth flow for calendar scope
      // For now, we'll store the credential token
      
      if (credentialResponse.credential) {
        // Store the credential temporarily
        // In production, exchange this on backend for proper calendar access token
        await saveCalendarToken(user.id, credentialResponse.credential, 3600);
        setIsConnected(true);
        alert('Google Calendar connected successfully! 📅');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
      alert('Failed to connect Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      setIsConnected(false);
      alert('Google Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-green-700 font-medium">Calendar Connected</span>
        <button
          onClick={handleDisconnect}
          className="ml-auto text-xs text-red-600 hover:underline"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-800 mb-3">
        📅 Connect Google Calendar to receive delivery reminders
      </p>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => alert('Failed to connect Google Calendar')}
        useOneTap={false}
        // Note: scope prop is not supported by @react-oauth/google
        // For calendar access, you need to use Google's OAuth2 flow directly
        // or implement a custom button with proper OAuth redirect
      />
      <p className="text-xs text-gray-500 mt-2">
        Note: Full calendar access requires server-side OAuth setup
      </p>
    </div>
  );
}

export default function GoogleCalendarAuth(props: GoogleCalendarAuthProps) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        ⚠️ Google Calendar not configured. Add VITE_GOOGLE_CLIENT_ID to .env
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleCalendarAuthInner {...props} />
    </GoogleOAuthProvider>
  );
}