// src/pages/QueryDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchQueryById, 
  fetchQueryResponses, 
  addQueryResponse,
  updateQueryStatus,
  Query, 
  QueryResponse 
} from '@/services/queryService';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

const QueryDetails = () => {
  const { queryId } = useParams<{ queryId: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState<Query | null>(null);
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (queryId) {
      loadQueryDetails();
    }
  }, [queryId]);

  const loadQueryDetails = async () => {
    try {
      setLoading(true);
      if (!queryId) return;
      
      const [queryData, responsesData] = await Promise.all([
        fetchQueryById(queryId),
        fetchQueryResponses(queryId)
      ]);
      
      setQuery(queryData);
      setResponses(responsesData);
    } catch (error) {
      console.error('Error loading query details:', error);
      alert('Failed to load query details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !queryId) return;

    try {
      setSending(true);
      await addQueryResponse(queryId, newMessage.trim());
      setNewMessage('');
      await loadQueryDetails();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsResolved = async () => {
    if (!queryId || !window.confirm('Mark this query as resolved?')) return;

    try {
      await updateQueryStatus(queryId, 'resolved');
      await loadQueryDetails();
      alert('Query marked as resolved!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading query...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Query not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/queries')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Queries
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{query.subject}</h1>
              <div className="flex gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(query.status)}`}>
                  {query.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(query.priority)}`}>
                  {query.priority.toUpperCase()} Priority
                </span>
              </div>
            </div>
            {query.status !== 'resolved' && query.status !== 'closed' && (
              <button
                onClick={handleMarkAsResolved}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Resolved
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
            <div>
              <span className="font-medium">Created:</span> {new Date(query.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(query.updated_at).toLocaleString()}
            </div>
            {query.order_number && (
              <div>
                <span className="font-medium">Order:</span> {query.order_number}
              </div>
            )}
            {query.product_name && (
              <div>
                <span className="font-medium">Product:</span> {query.product_name}
              </div>
            )}
            {query.retailer_name && (
              <div>
                <span className="font-medium">Retailer:</span> {query.retailer_name}
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 mb-2">Original Message:</p>
            <p className="text-gray-700 whitespace-pre-wrap">{query.message}</p>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Conversation</h2>
        
        {responses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No responses yet. Start the conversation below.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {responses.map((response) => (
              <div
                key={response.id}
                className={`p-4 rounded-lg ${
                  response.user_role === 'customer'
                    ? 'bg-blue-50 ml-8'
                    : 'bg-green-50 mr-8'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900">
                    {response.user_name}
                    <span className="ml-2 text-xs font-normal text-gray-600">
                      ({response.user_role})
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(response.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Box */}
      {query.status !== 'closed' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Add Response</h3>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={sending}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                !newMessage.trim() || sending
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryDetails;