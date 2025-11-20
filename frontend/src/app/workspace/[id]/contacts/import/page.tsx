'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview: Array<{
    email: string;
    firstName: string;
    lastName: string;
    tags: string;
  }>;
}

interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    field: string;
    message: string;
  }>;
  warnings: string[];
  contacts: Array<{
    id: string;
    email: string;
    status: string;
  }>;
}

export default function ImportContactsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setValidation(null);
      setImportResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setValidating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/contacts/${workspaceId}/validate-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setValidation(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('updateExisting', updateExisting.toString());

      const res = await api.post(`/contacts/${workspaceId}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,firstName,lastName,tags,company,phone\njohn@example.com,John,Doe,"customer,vip",Acme Inc,+1234567890\njane@example.com,Jane,Smith,newsletter,Tech Corp,+0987654321';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/workspace/${workspaceId}/contacts`)}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Contacts
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Import Contacts</h1>
          <p className="text-gray-600 mt-2">Upload a CSV file to import contacts in bulk</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Upload Section */}
        {!importResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Upload CSV File</h2>

            <div className="mb-4">
              <button
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📥 Download CSV Template
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum file size: 5MB | Maximum rows: 10,000
                </p>
              </label>
            </div>

            {file && (
              <div className="mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-8 w-8 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">
                      Update existing contacts (merge data instead of skipping)
                    </span>
                  </label>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {validating ? 'Validating...' : 'Validate CSV'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Results */}
        {validation && !importResult && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Step 2: Validation Results</h2>

            {validation.valid ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">CSV is valid and ready to import!</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-red-800 font-medium">CSV has errors that must be fixed</span>
                </div>
              </div>
            )}

            {validation.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                <ul className="space-y-1">
                  {validation.errors.map((error, i) => (
                    <li key={i} className="text-sm text-red-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Warnings:</h3>
                <ul className="space-y-1">
                  {validation.warnings.slice(0, 10).map((warning, i) => (
                    <li key={i} className="text-sm text-yellow-700">
                      • {warning}
                    </li>
                  ))}
                  {validation.warnings.length > 10 && (
                    <li className="text-sm text-yellow-700">
                      ... and {validation.warnings.length - 10} more warnings
                    </li>
                  )}
                </ul>
              </div>
            )}

            {validation.preview.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Preview (first 5 rows):</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Email
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          First Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Last Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          Tags
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {validation.preview.map((row, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.email}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.firstName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.lastName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.tags}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setValidation(null);
                  setFile(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {validation.valid && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Contacts'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Import Complete!</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm text-gray-600">Updated</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="space-y-1">
                    {importResult.errors.map((error, i) => (
                      <li key={i} className="text-sm text-red-700">
                        Row {error.row}: {error.email} - {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {importResult.warnings.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Warnings:</h3>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="space-y-1">
                    {importResult.warnings.slice(0, 20).map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700">
                        • {warning}
                      </li>
                    ))}
                    {importResult.warnings.length > 20 && (
                      <li className="text-sm text-yellow-700">
                        ... and {importResult.warnings.length - 20} more warnings
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/workspace/${workspaceId}/contacts`)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Contacts
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setValidation(null);
                  setImportResult(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• <strong>Required:</strong> email column</li>
            <li>• <strong>Optional:</strong> firstName, lastName, tags, status</li>
            <li>• <strong>Tags:</strong> Comma-separated values (e.g., "customer,vip")</li>
            <li>• <strong>Custom fields:</strong> Any additional columns will be saved as custom fields</li>
            <li>• <strong>Limits:</strong> Max 5MB file size, 10,000 rows</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
