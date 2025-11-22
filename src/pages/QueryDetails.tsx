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
      open: 'bg-[#EEF5F7] dark:bg-[#1A2332] text-[#4A9FBE] dark:text-[#6BB3CF]',
      in_progress: 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#D4A855] dark:text-[#D4A855]',
      resolved: 'bg-[#D9EDE5] dark:bg-[#1A2332] text-[#3A6B56] dark:text-[#B8E6D5]',
      closed: 'bg-[#EDF2F7] dark:bg-[#1A2332] text-[#6B7A8F] dark:text-[#8A99AA]'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-[#EDF2F7] dark:bg-[#1A2332] text-[#6B7A8F] dark:text-[#8A99AA]',
      medium: 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#8A4A4A] dark:text-[#E8C0C0]',
      high: 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#8A4A4A] dark:text-[#E8C0C0]'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A9FBE] dark:border-[#6BB3CF]"></div>
        <p className="mt-4 text-[#6B7A8F] dark:text-[#8A99AA]">Loading query...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#8A4A4A] dark:text-[#E8C0C0]">Query not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/queries')}
          className="flex items-center gap-2 text-[#4A9FBE] dark:text-[#6BB3CF] hover:text-[#3A7C96] dark:hover:text-[#8AC5DC] mb-4 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Queries
        </button>

        <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6 border border-[#D8DEE6] dark:border-[#3A4555]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-2">{query.subject}</h1>
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
                className="flex items-center gap-2 bg-[#5FA889] dark:bg-[#7DBFA0] text-white px-4 py-2 rounded-lg hover:bg-[#4D8A6F] dark:hover:bg-[#5FA889] transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Resolved
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-[#6B7A8F] dark:text-[#8A99AA] border-t border-[#D8DEE6] dark:border-[#3A4555] pt-4">
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

          <div className="mt-4 p-4 bg-[#EDF2F7] dark:bg-[#1A2332] rounded-lg">
            <p className="font-medium text-[#2C3847] dark:text-[#E5E9EF] mb-2">Original Message:</p>
            <p className="text-[#4A5568] dark:text-[#D1D8E0] whitespace-pre-wrap">{query.message}</p>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6 mb-6 border border-[#D8DEE6] dark:border-[#3A4555]">
        <h2 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-4">Conversation</h2>
        
        {responses.length === 0 ? (
          <div className="text-center py-8 text-[#6B7A8F] dark:text-[#8A99AA]">
            <p>No responses yet. Start the conversation below.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {responses.map((response) => (
              <div
                key={response.id}
                className={`p-4 rounded-lg ${
                  response.user_role === 'customer'
                    ? 'bg-[#EEF5F7] dark:bg-[#1A2332] ml-8'
                    : 'bg-[#D9EDE5] dark:bg-[#1A2332] mr-8'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[#2C3847] dark:text-[#E5E9EF]">
                    {response.user_name}
                    <span className="ml-2 text-xs font-normal text-[#6B7A8F] dark:text-[#8A99AA]">
                      ({response.user_role})
                    </span>
                  </span>
                  <span className="text-xs text-[#6B7A8F] dark:text-[#8A99AA]">
                    {new Date(response.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-[#4A5568] dark:text-[#D1D8E0] whitespace-pre-wrap">{response.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Box */}
      {query.status !== 'closed' && (
        <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6 border border-[#D8DEE6] dark:border-[#3A4555]">
          <h3 className="font-semibold text-[#2C3847] dark:text-[#E5E9EF] mb-3">Add Response</h3>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full px-4 py-3 border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF] resize-none"
            rows={4}
            disabled={sending}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                !newMessage.trim() || sending
                  ? 'bg-[#D8DEE6] dark:bg-[#3A4555] text-[#6B7A8F] dark:text-[#8A99AA] cursor-not-allowed'
                  : 'bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white hover:bg-[#3A7C96] dark:hover:bg-[#8AC5DC]'
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