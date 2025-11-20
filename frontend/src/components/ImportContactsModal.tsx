'use client';

import { useState } from 'react';
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
}

interface Props {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportContactsModal({ workspaceId, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'validate' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setValidation(null);
    setImportResult(null);
    setError('');
    onClose();
  };

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
      setStep('validate');
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
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template =
      'email,firstName,lastName,tags,company,phone\njohn@example.com,John,Doe,"customer,vip",Acme Inc,+1234567890\njane@example.com,Jane,Smith,newsletter,Tech Corp,+0987654321';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
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

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={downloadTemplate}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  📥 Download CSV Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload-modal"
                />
                <label htmlFor="csv-upload-modal" className="cursor-pointer">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-700 font-medium mt-2">
                    {file ? file.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max 5MB | Max 10,000 rows</p>
                </label>
              </div>

              {file && (
                <div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
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
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => setFile(null)} className="text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  </div>

                  <label className="flex items-center gap-2 mb-4">
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
              )}
            </div>
          )}

          {/* Step 2: Validation Results */}
          {step === 'validate' && validation && (
            <div>
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
                    <span className="text-green-800 font-medium">Ready to import!</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <span className="text-red-800 font-medium">CSV has errors</span>
                </div>
              )}

              {validation.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                  <ul className="space-y-1 text-sm text-red-700 max-h-32 overflow-y-auto">
                    {validation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Warnings:</h3>
                  <ul className="space-y-1 text-sm text-yellow-700 max-h-32 overflow-y-auto">
                    {validation.warnings.slice(0, 5).map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                    {validation.warnings.length > 5 && (
                      <li>... and {validation.warnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {validation.preview.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Preview:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Tags
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {validation.preview.map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-900">{row.email}</td>
                            <td className="px-3 py-2 text-gray-900">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="px-3 py-2 text-gray-900">{row.tags}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Import Results */}
          {step === 'result' && importResult && (
            <div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-xl font-bold text-gray-900">{importResult.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-xl font-bold text-green-600">{importResult.imported}</div>
                  <div className="text-xs text-gray-600">Imported</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-xl font-bold text-blue-600">{importResult.updated}</div>
                  <div className="text-xs text-gray-600">Updated</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-xl font-bold text-yellow-600">{importResult.skipped}</div>
                  <div className="text-xs text-gray-600">Skipped</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                  <div className="max-h-32 overflow-y-auto text-sm text-red-700">
                    {importResult.errors.map((error, i) => (
                      <div key={i}>
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          {step === 'upload' && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleValidate}
                disabled={!file || validating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {validating ? 'Validating...' : 'Validate CSV'}
              </button>
            </>
          )}

          {step === 'validate' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              {validation?.valid && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Contacts'}
                </button>
              )}
            </>
          )}

          {step === 'result' && (
            <>
              <button
                onClick={() => {
                  onSuccess();
                  handleClose();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
