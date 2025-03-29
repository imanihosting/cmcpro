import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FaFile,
  FaFileDownload,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaUser,
  FaClock,
  FaCalendarAlt,
  FaFileAlt,
  FaInfoCircle,
} from 'react-icons/fa';

// Types
type Document = {
  id: string;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  reviewDate: Date | null;
  fileSize: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type DocumentDetailResponse = Document & {
  downloadUrl: string | null;
  fileExists: boolean;
  updatedAt: Date;
};

type DocumentDetailModalProps = {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
};

export default function DocumentDetailModal({
  document,
  isOpen,
  onClose,
  onStatusChange,
}: DocumentDetailModalProps) {
  // State
  const [documentDetails, setDocumentDetails] = useState<DocumentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Fetch document details when opened
  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!document || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/api/admin/documents/${document.id}`);
        
        // Format dates
        const formattedDocument = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          reviewDate: response.data.reviewDate ? new Date(response.data.reviewDate) : null,
        };
        
        setDocumentDetails(formattedDocument);
      } catch (err: any) {
        console.error('Error fetching document details:', err);
        setError(err.response?.data?.error || 'Failed to fetch document details');
        toast.error('Failed to load document details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentDetails();
  }, [document, isOpen]);
  
  // Function to format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Function to update document status
  const handleStatusUpdate = async (newStatus: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setIsUpdating(true);
    
    try {
      const response = await axios.patch('/api/admin/documents/status', {
        documentId: document.id,
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
      });
      
      toast.success(`Document status updated to ${newStatus.toLowerCase()}`);
      
      // Update the local state
      if (documentDetails) {
        setDocumentDetails({
          ...documentDetails,
          status: newStatus,
          reviewDate: new Date(),
        });
      }
      
      // Notify parent component about the status change
      onStatusChange();
      
      // Clear admin notes
      setAdminNotes('');
    } catch (err: any) {
      console.error('Error updating document status:', err);
      toast.error(err.response?.data?.error || 'Failed to update document status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Function to handle document download
  const handleDownload = async () => {
    if (!documentDetails?.downloadUrl) {
      toast.error('Download URL not available');
      return;
    }
    
    // Open the download URL in a new tab
    window.open(documentDetails.downloadUrl, '_blank');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* This element centers the modal contents */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
          {/* Modal header */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-8">
              <FaSpinner className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="m-6 rounded-md bg-red-50 p-4 text-red-700">
              <div className="flex">
                <FaInfoCircle className="mr-3 h-5 w-5 text-red-400" />
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Document details */}
          {!loading && !error && documentDetails && (
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left column: Document info */}
                <div className="space-y-6">
                  {/* Document name and type */}
                  <div>
                    <div className="mb-4 flex items-center">
                      <FaFileAlt className="mr-2 h-6 w-6 text-indigo-600" />
                      <h4 className="text-xl font-semibold text-gray-900">{documentDetails.name}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium text-gray-900">{documentDetails.type}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-900">{documentDetails.category || 'Uncategorized'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Size</p>
                        <p className="text-sm font-medium text-gray-900">{formatFileSize(documentDetails.fileSize)}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            documentDetails.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : documentDetails.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {documentDetails.status === 'APPROVED'
                            ? 'Approved'
                            : documentDetails.status === 'REJECTED'
                            ? 'Rejected'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* User info */}
                  <div>
                    <div className="mb-2 flex items-center">
                      <FaUser className="mr-2 text-gray-500" />
                      <h5 className="text-sm font-medium text-gray-700">Uploaded By</h5>
                    </div>
                    
                    {documentDetails.user ? (
                      <div className="ml-6">
                        <p className="text-sm font-medium text-gray-900">{documentDetails.user.name}</p>
                        <p className="text-sm text-gray-600">{documentDetails.user.email}</p>
                        <p className="text-xs text-gray-500">Role: {documentDetails.user.role}</p>
                      </div>
                    ) : (
                      <p className="ml-6 text-sm text-gray-500">Unknown user</p>
                    )}
                  </div>
                  
                  {/* Timestamps */}
                  <div>
                    <div className="mb-2 flex items-center">
                      <FaClock className="mr-2 text-gray-500" />
                      <h5 className="text-sm font-medium text-gray-700">Timestamps</h5>
                    </div>
                    
                    <div className="ml-6 grid grid-cols-1 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Uploaded</p>
                        <p className="text-sm text-gray-900">
                          {format(documentDetails.createdAt, 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm text-gray-900">
                          {format(documentDetails.updatedAt, 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      
                      {documentDetails.reviewDate && (
                        <div>
                          <p className="text-xs text-gray-500">Reviewed</p>
                          <p className="text-sm text-gray-900">
                            {format(documentDetails.reviewDate, 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Reviewer info, if available */}
                  {documentDetails.reviewer && (
                    <div>
                      <div className="mb-2 flex items-center">
                        <FaUser className="mr-2 text-gray-500" />
                        <h5 className="text-sm font-medium text-gray-700">Reviewed By</h5>
                      </div>
                      
                      <div className="ml-6">
                        <p className="text-sm font-medium text-gray-900">{documentDetails.reviewer.name}</p>
                        <p className="text-sm text-gray-600">{documentDetails.reviewer.email}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right column: Description, download, and actions */}
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h5 className="mb-2 text-sm font-medium text-gray-700">Description</h5>
                    <div className="rounded-md border border-gray-200 p-3">
                      <p className="whitespace-pre-wrap text-sm text-gray-700">
                        {documentDetails.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Download */}
                  <div>
                    <button
                      onClick={handleDownload}
                      className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70"
                      disabled={!documentDetails.fileExists || !documentDetails.downloadUrl}
                    >
                      <FaFileDownload className="mr-2" />
                      {documentDetails.fileExists ? 'Download Document' : 'File Not Available'}
                    </button>
                    
                    {!documentDetails.fileExists && (
                      <p className="mt-1 text-xs text-red-500">
                        The file associated with this document could not be found on the server.
                      </p>
                    )}
                  </div>
                  
                  {/* Admin Notes */}
                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">
                      Admin Notes
                    </label>
                    <textarea
                      id="adminNotes"
                      name="adminNotes"
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Add notes about this document (will be stored with the document)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>
                  
                  {/* Status change actions */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="mb-3 text-sm font-medium text-gray-700">Update Status</h5>
                    
                    <div className="flex space-x-2">
                      {documentDetails.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleStatusUpdate('APPROVED')}
                          className="flex flex-1 items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <FaSpinner className="mr-2 animate-spin" /> : <FaCheck className="mr-2" />}
                          Approve
                        </button>
                      )}
                      
                      {documentDetails.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleStatusUpdate('REJECTED')}
                          className="flex flex-1 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                          disabled={isUpdating}
                        >
                          {isUpdating ? <FaSpinner className="mr-2 animate-spin" /> : <FaTimes className="mr-2" />}
                          Reject
                        </button>
                      )}
                      
                      {documentDetails.status !== 'PENDING' && (
                        <button
                          onClick={() => handleStatusUpdate('PENDING')}
                          className="flex flex-1 items-center justify-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                          disabled={isUpdating}
                        >
                          Reset to Pending
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 