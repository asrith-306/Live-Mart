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
      open: 'bg-[#EEF5F7] dark:bg-[#1A2332] text-[#4A9FBE] dark:text-[#6BB3CF]',
      in_progress: 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#D4A855] dark:text-[#D4A855]',
      resolved: 'bg-[#D9EDE5] dark:bg-[#1A2332] text-[#3A6B56] dark:text-[#B8E6D5]',
      closed: 'bg-[#EDF2F7] dark:bg-[#1A2332] text-[#6B7A8F] dark:text-[#8A99AA]'
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
      low: 'bg-[#EDF2F7] dark:bg-[#1A2332] text-[#6B7A8F] dark:text-[#8A99AA]',
      medium: 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#8A4A4A] dark:text-[#E8C0C0]',
      high: 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#8A4A4A] dark:text-[#E8C0C0]'
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
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A9FBE] dark:border-[#6BB3CF]"></div>
        <p className="mt-4 text-[#6B7A8F] dark:text-[#8A99AA]">Loading queries...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3847] dark:text-[#E5E9EF]">My Support Queries</h1>
            <p className="text-[#6B7A8F] dark:text-[#8A99AA] mt-1">Track and manage your support requests</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white px-6 py-3 rounded-lg hover:bg-[#3A7C96] dark:hover:bg-[#8AC5DC] transition-colors shadow-md font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Query
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-[#FAFBFC] dark:bg-[#242D3C] p-1 rounded-lg shadow-sm">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                filter === status
                  ? 'bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white shadow-sm'
                  : 'text-[#6B7A8F] dark:text-[#8A99AA] hover:text-[#2C3847] dark:hover:text-[#E5E9EF]'
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
            <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-12 text-center">
              <MessageCircle className="w-16 h-16 text-[#D8DEE6] dark:text-[#3A4555] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#2C3847] dark:text-[#E5E9EF] mb-2">No Queries Found</h3>
              <p className="text-[#6B7A8F] dark:text-[#8A99AA] mb-6">
                {filter === 'all' 
                  ? "You haven't submitted any support queries yet."
                  : `No queries with status: ${filter.replace('_', ' ')}`}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white px-6 py-2 rounded-lg hover:bg-[#3A7C96] dark:hover:bg-[#8AC5DC] transition-colors font-semibold"
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
                className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] border border-[#D8DEE6] dark:border-[#3A4555]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-2">{query.subject}</h3>
                    <p className="text-[#4A5568] dark:text-[#D1D8E0] line-clamp-2">{query.message}</p>
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

                <div className="flex flex-wrap gap-4 text-sm text-[#6B7A8F] dark:text-[#8A99AA] pt-3 border-t border-[#D8DEE6] dark:border-[#3A4555]">
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