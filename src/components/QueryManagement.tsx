// src/components/QueryManagement.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { 
  fetchRetailerQueries, 
  fetchQueryResponses,
  addQueryResponse,
  updateQueryStatus,
  Query,
  QueryResponse,
  QueryStatus
} from '@/services/queryService';
import { MessageCircle, Clock, CheckCircle, Send, X, RefreshCw } from 'lucide-react';

const QueryManagement = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [responses, setResponses] = useState<QueryResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const data = await fetchRetailerQueries();
      setQueries(data);
      
      // Update selected query if it's still in the list
      if (selectedQuery) {
        const updatedQuery = data.find(q => q.id === selectedQuery.id);
        if (updatedQuery) {
          setSelectedQuery(updatedQuery);
        }
      }
    } catch (error) {
      console.error('Error loading queries:', error);
      alert('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const loadQueryResponses = async (queryId: string) => {
    try {
      const data = await fetchQueryResponses(queryId);
      setResponses(data);
    } catch (error) {
      console.error('Error loading responses:', error);
      alert('Failed to load responses');
    }
  };

  const handleSelectQuery = async (query: Query) => {
    setSelectedQuery(query);
    await loadQueryResponses(query.id);
  };

  const handleSendResponse = async () => {
    if (!newMessage.trim() || !selectedQuery) return;

    try {
      setSending(true);
      await addQueryResponse(selectedQuery.id, newMessage.trim());
      setNewMessage('');
      
      // Reload responses and queries
      await Promise.all([
        loadQueryResponses(selectedQuery.id),
        loadQueries()
      ]);
    } catch (error: any) {
      console.error('Error sending response:', error);
      const errorMessage = error?.message || 'Failed to send response';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (queryId: string, status: QueryStatus) => {
    try {
      await updateQueryStatus(queryId, status);
      
      // Reload queries to get updated status
      await loadQueries();
      
      // Update selected query
      if (selectedQuery?.id === queryId) {
        const updatedQuery = queries.find(q => q.id === queryId);
        if (updatedQuery) {
          setSelectedQuery({ ...updatedQuery, status });
        }
      }
      
      alert('Status updated successfully!');
    } catch (error: any) {
      console.error('Error updating status:', error);
      const errorMessage = error?.message || 'Failed to update status';
      alert(`Error: ${errorMessage}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.open;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  const filteredQueries = queries.filter(query => {
    if (filter === 'all') return true;
    return query.status === filter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading queries...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customer Queries</h1>
          <button
            onClick={loadQueries}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm">
          {['all', 'open', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              <span className="ml-2 text-sm">
                ({status === 'all' ? queries.length : queries.filter(q => q.status === status).length})
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queries List */}
          <div className="space-y-3">
            {filteredQueries.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No queries found</p>
              </div>
            ) : (
              filteredQueries.map((query) => (
                <div
                  key={query.id}
                  onClick={() => handleSelectQuery(query)}
                  className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedQuery?.id === query.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{query.subject}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(query.status)}`}>
                        {query.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(query.priority)}`}>
                        {query.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{query.message}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>👤 {query.customer_name}</span>
                    <span>📅 {new Date(query.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Query Details & Responses */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {!selectedQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-16 h-16 mb-3" />
                <p>Select a query to view details</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Query Header */}
                <div className="pb-4 border-b border-gray-200 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedQuery.subject}</h2>
                    <button
                      onClick={() => setSelectedQuery(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(selectedQuery.status)}`}>
                      {selectedQuery.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(selectedQuery.priority)}`}>
                      {selectedQuery.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Customer:</strong> {selectedQuery.customer_name}</p>
                    <p><strong>Created:</strong> {new Date(selectedQuery.created_at).toLocaleString()}</p>
                    {selectedQuery.order_number && (
                      <p><strong>Order:</strong> {selectedQuery.order_number}</p>
                    )}
                    {selectedQuery.product_name && (
                      <p><strong>Product:</strong> {selectedQuery.product_name}</p>
                    )}
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQuery.message}</p>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selectedQuery.status !== 'in_progress' && selectedQuery.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedQuery.id, 'in_progress')}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        Mark In Progress
                      </button>
                    )}
                    {selectedQuery.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedQuery.id, 'resolved')}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {/* Responses */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {responses.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No responses yet</p>
                  ) : (
                    responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-3 rounded-lg ${
                          response.user_role === 'retailer'
                            ? 'bg-green-50 ml-4'
                            : 'bg-blue-50 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {response.user_name}
                            <span className="ml-1 text-xs font-normal text-gray-600">
                              ({response.user_role})
                            </span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                {selectedQuery.status !== 'closed' && (
                  <div className="border-t border-gray-200 pt-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendResponse}
                      disabled={!newMessage.trim() || sending}
                      className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-colors ${
                        !newMessage.trim() || sending
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryManagement;