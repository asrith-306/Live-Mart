// src/pages/Queries.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCustomerQueries, Query } from '@/services/queryService';
import QueryForm from '@/components/QueryForm';
import { MessageCircle, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Queries = () => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomerQueries();
      setQueries(data);
    } catch (error) {
      console.error('Error loading queries:', error);
      alert('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryClick = (queryId: string) => {
    navigate(`/query/${queryId}`);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Support Queries</h1>
            <p className="text-gray-600 mt-1">Track and manage your support requests</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Query
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
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

        {/* Queries List */}
        <div className="space-y-4">
          {filteredQueries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Queries Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? "You haven't submitted any support queries yet."
                  : `No queries with status: ${filter.replace('_', ' ')}`}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Submit Your First Query
                </button>
              )}
            </div>
          ) : (
            filteredQueries.map((query) => (
              <div
                key={query.id}
                onClick={() => handleQueryClick(query.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{query.subject}</h3>
                    <p className="text-gray-600 line-clamp-2">{query.message}</p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadge(query.status)}`}>
                      {getStatusIcon(query.status)}
                      {query.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${getPriorityBadge(query.priority)}`}>
                      {query.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-3 border-t border-gray-200">
                  <span className="flex items-center gap-1">
                    📅 Created: {new Date(query.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    🕐 Updated: {new Date(query.updated_at).toLocaleString()}
                  </span>
                  {query.order_number && (
                    <span className="flex items-center gap-1">
                      📦 Order: {query.order_number}
                    </span>
                  )}
                  {query.product_name && (
                    <span className="flex items-center gap-1">
                      🏷️ Product: {query.product_name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Query Form Modal */}
      {showForm && (
        <QueryForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadQueries();
          }}
        />
      )}
    </div>
  );
};

export default Queries;