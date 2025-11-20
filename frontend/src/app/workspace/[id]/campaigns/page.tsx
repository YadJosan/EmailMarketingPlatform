'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  content?: any;
  status: string;
  audienceId?: string;
  segmentId?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export default function CampaignsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    previewText: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    content: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, [workspaceId]);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get(`/campaigns/${workspaceId}`);
      setCampaigns(res.data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/campaigns', {
        workspaceId,
        ...newCampaign,
        content: `<html><body><h1>Hello {{first_name}}!</h1><p>${newCampaign.content}</p></body></html>`,
      });

      setSuccess('Campaign created successfully!');
      setShowCreateModal(false);
      setNewCampaign({
        name: '',
        subject: '',
        previewText: '',
        fromName: '',
        fromEmail: '',
        replyTo: '',
        content: '',
      });
      fetchCampaigns();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/workspace/${workspaceId}`)}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Workspace
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Create Campaign
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No campaigns yet</h3>
              <p className="mt-2 text-gray-500">Get started by creating your first campaign.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{campaign.subject}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.get(`/campaigns/${workspaceId}/${campaign.id}`);
                            setSelectedCampaign(res.data);
                            const countRes = await api.get(
                              `/campaigns/${workspaceId}/${campaign.id}/recipients/count`
                            );
                            setRecipientCount(countRes.data);
                            setShowViewModal(true);
                          } catch (err) {
                            console.error('Failed to fetch campaign:', err);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Campaign</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Summer Sale 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Line *</label>
                  <input
                    type="text"
                    required
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Hi {{first_name}}, check out our deals!"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use merge tags: {`{{first_name}}, {{last_name}}, {{email}}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Preview Text</label>
                  <input
                    type="text"
                    value={newCampaign.previewText}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, previewText: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Save up to 50% on selected items"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Name *</label>
                    <input
                      type="text"
                      required
                      value={newCampaign.fromName}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, fromName: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Marketing Team"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Email *</label>
                    <input
                      type="email"
                      required
                      value={newCampaign.fromEmail}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, fromEmail: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="marketing@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reply-To Email *</label>
                  <input
                    type="email"
                    required
                    value={newCampaign.replyTo}
                    onChange={(e) => setNewCampaign({ ...newCampaign, replyTo: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="support@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Content *</label>
                  <textarea
                    required
                    rows={6}
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Your email content here. Use {{first_name}} for personalization."
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCampaign.name}</h2>
                <span
                  className={`inline-flex mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedCampaign.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : selectedCampaign.status === 'sent'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedCampaign.status}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCampaign(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Campaign Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Subject Line</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedCampaign.subject}</dd>
                  </div>

                  {selectedCampaign.previewText && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Preview Text</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedCampaign.previewText}
                      </dd>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">From Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedCampaign.fromName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">From Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedCampaign.fromEmail}</dd>
                    </div>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reply-To</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedCampaign.replyTo}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Recipients</dt>
                    <dd className="mt-1 text-sm text-gray-900">{recipientCount} contacts</dd>
                  </div>

                  {selectedCampaign.scheduledAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Scheduled For</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(selectedCampaign.scheduledAt).toLocaleString()}
                      </dd>
                    </div>
                  )}

                  {selectedCampaign.sentAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sent At</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(selectedCampaign.sentAt).toLocaleString()}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(selectedCampaign.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Email Content */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Email Content</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof selectedCampaign.content === 'string'
                          ? selectedCampaign.content
                          : JSON.stringify(selectedCampaign.content),
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Merge tags like {`{{first_name}}`} will be replaced with actual contact data.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCampaign(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedCampaign.status === 'draft' && (
                <>
                  <button
                    onClick={async () => {
                      if (!confirm(`Send this campaign to ${recipientCount} recipients?`)) return;
                      try {
                        await api.post(`/campaigns/${workspaceId}/${selectedCampaign.id}/send`);
                        setSuccess('Campaign sent successfully!');
                        setShowViewModal(false);
                        fetchCampaigns();
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to send campaign');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Send Now
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowScheduleModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this campaign?')) return;
                      try {
                        await api.delete(`/campaigns/${workspaceId}/${selectedCampaign.id}`);
                        setSuccess('Campaign deleted successfully!');
                        setShowViewModal(false);
                        fetchCampaigns();
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to delete campaign');
                      }
                    }}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Schedule Campaign</h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduledDate('');
                  setScheduledTime('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Schedule "{selectedCampaign.name}" to be sent to {recipientCount} recipients at a
                specific date and time.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduledDate('');
                  setScheduledTime('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!scheduledDate || !scheduledTime) {
                    setError('Please select both date and time');
                    return;
                  }

                  try {
                    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
                    await api.post(`/campaigns/${workspaceId}/${selectedCampaign.id}/schedule`, {
                      scheduledAt,
                    });
                    setSuccess(
                      `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`
                    );
                    setShowScheduleModal(false);
                    setScheduledDate('');
                    setScheduledTime('');
                    fetchCampaigns();
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to schedule campaign');
                  }
                }}
                disabled={!scheduledDate || !scheduledTime}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Schedule Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
