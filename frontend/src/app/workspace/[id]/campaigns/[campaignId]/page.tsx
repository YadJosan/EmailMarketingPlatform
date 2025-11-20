'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CampaignStats {
  campaign: {
    id: string;
    name: string;
    status: string;
    sentAt: string;
  };
  summary: {
    total: number;
    sent: number;
    delivered: number;
    bounced: number;
    complained: number;
    uniqueOpens: number;
    uniqueClicks: number;
    totalOpens: number;
    totalClicks: number;
    openRate: string;
    clickRate: string;
    clickToOpenRate: string;
  };
}

interface Recipient {
  id: string;
  contact: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  sentAt: string;
  deliveredAt: string;
  openCount: number;
  clickCount: number;
  lastOpenedAt: string;
  lastClickedAt: string;
  error?: string;
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const campaignId = params.campaignId as string;

  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch(
        `http://localhost:3000/api/campaigns/${workspaceId}/${campaignId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!statsRes.ok) {
        throw new Error('Failed to fetch campaign stats');
      }
      
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recipients
      const recipientsRes = await fetch(
        `http://localhost:3000/api/campaigns/${workspaceId}/${campaignId}/recipients`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!recipientsRes.ok) {
        throw new Error('Failed to fetch recipients');
      }
      
      const recipientsData = await recipientsRes.json();
      
      // Ensure recipientsData is an array
      if (Array.isArray(recipientsData)) {
        setRecipients(recipientsData);
      } else {
        console.error('Recipients data is not an array:', recipientsData);
        setRecipients([]);
        setError('Invalid recipients data received');
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load campaign data');
      setRecipients([]); // Ensure recipients is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    if (!confirm(`Retry all ${failedCount} failed emails? They will be re-queued with exponential backoff.`)) return;

    setRetrying(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/campaigns/${workspaceId}/${campaignId}/retry-failed`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!res.ok) {
        throw new Error('Failed to retry emails');
      }
      
      const result = await res.json();
      alert(result.message || 'Emails queued for retry');
      await fetchCampaignData();
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      setError('Failed to retry emails. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  const handleRetryRecipient = async (contactId: string, email: string) => {
    if (!confirm(`Retry email to ${email}?`)) return;

    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/campaigns/${workspaceId}/${campaignId}/recipients/${contactId}/retry`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!res.ok) {
        throw new Error('Failed to retry email');
      }
      
      const result = await res.json();
      alert(result.message || 'Email queued for retry');
      await fetchCampaignData();
    } catch (error) {
      console.error('Error retrying email:', error);
      setError('Failed to retry email. Please try again.');
    }
  };

  const filteredRecipients = Array.isArray(recipients) 
    ? recipients.filter((r) => {
        if (filter === 'all') return true;
        return r.status === filter;
      })
    : [];

  const failedCount = Array.isArray(recipients) 
    ? recipients.filter((r) => r.status === 'failed').length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Campaign</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-red-600 hover:text-red-700 font-medium"
            >
              ← Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Campaign not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-700 mb-4"
          >
            ← Back to Campaigns
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stats.campaign.name}</h1>
              <p className="text-gray-600 mt-2">
                Status: <span className="font-semibold capitalize">{stats.campaign.status}</span>
              </p>
              {stats.campaign.sentAt && (
                <p className="text-gray-600">
                  Sent: {new Date(stats.campaign.sentAt).toLocaleString()}
                </p>
              )}
            </div>
            {failedCount > 0 && (
              <button
                onClick={handleRetryFailed}
                disabled={retrying}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {retrying ? 'Retrying...' : `Retry ${failedCount} Failed Emails`}
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Recipients</p>
            <p className="text-3xl font-bold text-gray-900">{stats.summary.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Open Rate</p>
            <p className="text-3xl font-bold text-green-600">{stats.summary.openRate}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.summary.uniqueOpens} opens
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Click Rate</p>
            <p className="text-3xl font-bold text-blue-600">{stats.summary.clickRate}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.summary.uniqueClicks} clicks
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Bounced</p>
            <p className="text-3xl font-bold text-red-600">{stats.summary.bounced}</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Delivery Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.summary.sent}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.summary.delivered}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Failed</p>
              <p className="text-2xl font-bold text-orange-600">{failedCount}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Bounced</p>
              <p className="text-2xl font-bold text-red-600">{stats.summary.bounced}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Complained</p>
              <p className="text-2xl font-bold text-red-600">{stats.summary.complained}</p>
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recipients</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded ${
                    filter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All ({recipients.length})
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={`px-4 py-2 rounded ${
                    filter === 'failed'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Failed ({failedCount})
                </button>
                <button
                  onClick={() => setFilter('bounced')}
                  className={`px-4 py-2 rounded ${
                    filter === 'bounced'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Bounced ({stats.summary.bounced})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Opens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {recipient.contact.firstName} {recipient.contact.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{recipient.contact.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          recipient.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : recipient.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : recipient.status === 'failed'
                            ? 'bg-orange-100 text-orange-800'
                            : recipient.status === 'bounced'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {recipient.status}
                      </span>
                      {recipient.error && (
                        <p className="text-xs text-red-600 mt-1" title={recipient.error}>
                          {recipient.error.substring(0, 50)}...
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{recipient.openCount}</p>
                        {recipient.lastOpenedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(recipient.lastOpenedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{recipient.clickCount}</p>
                        {recipient.lastClickedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(recipient.lastClickedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {recipient.sentAt
                        ? new Date(recipient.sentAt).toLocaleString()
                        : 'Not sent'}
                    </td>
                    <td className="px-6 py-4">
                      {recipient.status === 'failed' && (
                        <button
                          onClick={() => handleRetryRecipient(recipient.contact.id, recipient.contact.email)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecipients.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No recipients found with status: {filter}
            </div>
          )}
        </div>

        {/* Retry Info */}
        {failedCount > 0 && (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              📧 Retry Information
            </h3>
            <p className="text-orange-800 mb-4">
              {failedCount} email(s) failed to send. The system uses exponential backoff retry:
            </p>
            <ul className="list-disc list-inside text-orange-800 space-y-1 mb-4">
              <li>Attempt 1: Immediate</li>
              <li>Attempt 2: Wait 2 seconds</li>
              <li>Attempt 3: Wait 4 seconds</li>
              <li>Attempt 4: Wait 8 seconds</li>
              <li>Attempt 5: Wait 16 seconds</li>
            </ul>
            <p className="text-sm text-orange-700">
              Failed emails have exhausted all automatic retries. Click "Retry Failed Emails" to
              manually retry them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
