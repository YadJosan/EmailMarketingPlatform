'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
}

interface Form {
  id: string;
  name: string;
  audienceId: string;
  fields: FormField[];
  doubleOptIn: boolean;
  successMessage: string;
  createdAt: string;
}

interface Audience {
  id: string;
  name: string;
}

export default function FormsPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const [forms, setForms] = useState<Form[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  const [newForm, setNewForm] = useState({
    name: '',
    audienceId: '',
    doubleOptIn: false,
    successMessage: 'Thank you for subscribing!',
    fields: [
      { name: 'email', type: 'email', label: 'Email Address', required: true },
      { name: 'firstName', type: 'text', label: 'First Name', required: false },
    ] as FormField[],
  });

  useEffect(() => {
    fetchForms();
    fetchAudiences();
  }, [workspaceId]);

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/forms/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setForms(data);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudiences = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/audiences/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAudiences(data);
      } else {
        console.error('Audiences data is not an array:', data);
        setAudiences([]);
      }
    } catch (error) {
      console.error('Error fetching audiences:', error);
      setAudiences([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newForm, workspaceId }),
      });
      setShowCreateModal(false);
      fetchForms();
      // Reset form
      setNewForm({
        name: '',
        audienceId: '',
        doubleOptIn: false,
        successMessage: 'Thank you for subscribing!',
        fields: [
          { name: 'email', type: 'email', label: 'Email Address', required: true },
          { name: 'firstName', type: 'text', label: 'First Name', required: false },
        ],
      });
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const addField = () => {
    setNewForm({
      ...newForm,
      fields: [
        ...newForm.fields,
        { name: '', type: 'text', label: '', required: false },
      ],
    });
  };

  const updateField = (index: number, field: Partial<FormField>) => {
    const updatedFields = [...newForm.fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setNewForm({ ...newForm, fields: updatedFields });
  };

  const removeField = (index: number) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.filter((_, i) => i !== index),
    });
  };

  const generateEmbedCode = (form: Form) => {
    return `<!-- Email Marketing Form -->
<div id="email-form-${form.id}"></div>
<script>
(function() {
  const formHtml = \`
    <form id="form-${form.id}" style="max-width: 400px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h3 style="margin-top: 0;">${form.name}</h3>
      ${form.fields
        .map(
          (field) => `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">${field.label}${field.required ? ' *' : ''}</label>
        <input 
          type="${field.type}" 
          name="${field.name}" 
          ${field.required ? 'required' : ''}
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
        />
      </div>`
        )
        .join('')}
      <button type="submit" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
        Subscribe
      </button>
      <div id="form-message-${form.id}" style="margin-top: 15px;"></div>
    </form>
  \`;
  
  document.getElementById('email-form-${form.id}').innerHTML = formHtml;
  
  document.getElementById('form-${form.id}').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const response = await fetch('${window.location.origin}/api/forms/${form.id}/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      document.getElementById('form-message-${form.id}').innerHTML = 
        '<p style="color: green; margin: 0;">' + result.message + '</p>';
      e.target.reset();
    } catch (error) {
      document.getElementById('form-message-${form.id}').innerHTML = 
        '<p style="color: red; margin: 0;">Error submitting form. Please try again.</p>';
    }
  });
})();
</script>`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Create Form
          </button>
        </div>

        {loading ? (
          <p>Loading forms...</p>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No forms yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Create your first form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div key={form.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-2">{form.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {form.fields.length} fields • {form.doubleOptIn ? 'Double opt-in' : 'Single opt-in'}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedForm(form);
                      setShowEmbedModal(true);
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Get Embed Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold">Create Form</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Form Name *</label>
                    <input
                      type="text"
                      required
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Newsletter Signup"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience *</label>
                    <select
                      required
                      value={newForm.audienceId}
                      onChange={(e) => setNewForm({ ...newForm, audienceId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select audience</option>
                      {Array.isArray(audiences) && audiences.map((audience) => (
                        <option key={audience.id} value={audience.id}>
                          {audience.name}
                        </option>
                      ))}
                    </select>
                    {audiences.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        No audiences found. Create an audience first.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">Form Fields</label>
                      <button
                        type="button"
                        onClick={addField}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        + Add Field
                      </button>
                    </div>

                    <div className="space-y-4">
                      {newForm.fields.map((field, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Field Name</label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="company"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(index, { type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="number">Number</option>
                                <option value="url">URL</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Company Name"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(index, { required: e.target.checked })}
                                  className="mr-2"
                                />
                                <span className="text-sm">Required</span>
                              </label>
                              {index > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeField(index)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newForm.doubleOptIn}
                        onChange={(e) => setNewForm({ ...newForm, doubleOptIn: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Enable double opt-in</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Subscribers will receive a confirmation email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Success Message</label>
                    <textarea
                      value={newForm.successMessage}
                      onChange={(e) => setNewForm({ ...newForm, successMessage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Create Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Embed Code Modal */}
        {showEmbedModal && selectedForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold">Embed Code</h2>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Copy and paste this code into your website where you want the form to appear:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {generateEmbedCode(selectedForm)}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateEmbedCode(selectedForm));
                    alert('Embed code copied to clipboard!');
                  }}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
