"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  FaFileUpload, 
  FaFile, 
  FaFileAlt, 
  FaFilePdf, 
  FaFileImage, 
  FaTrash, 
  FaDownload, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaInfoCircle
} from "react-icons/fa";

// Import UploadButton
import { UploadButton } from "@/utils/uploadthing"; // Adjust path if needed

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  category: string | null;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  expirationDate: string | null;
  documentIdentifier: string | null;
  issuingAuthority: string | null;
}

interface UploadedFileData {
  documentId: string;
  documentUrl: string;
  fileName: string;
}

const documentTypes = [
  { value: "id", label: "ID Document" },
  { value: "qualification", label: "Qualification Certificate" },
  { value: "insurance", label: "Insurance Certificate" },
  { value: "firstaid", label: "First Aid Certificate" },
  { value: "childrenFirst", label: "Children First Certificate" },
  { value: "gardaVetting", label: "Garda Vetting" },
  { value: "tusla", label: "Tusla Registration" },
  { value: "reference", label: "Reference Letter" },
  { value: "other", label: "Other" }
];

const documentCategories = [
  { value: "verification", label: "Verification" },
  { value: "qualification", label: "Qualification" },
  { value: "certification", label: "Certification" },
  { value: "personal", label: "Personal" }
];

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "",
    category: "verification",
    description: "",
    expirationDate: "",
    documentIdentifier: "",
    issuingAuthority: ""
  });
  const [uploadedFileData, setUploadedFileData] = useState<UploadedFileData | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect if not a childminder
    if (status === "authenticated" && session?.user?.role !== "childminder") {
      router.push("/dashboard");
      return;
    }

    // Load documents
    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status, session, router]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/documents');
      if (!response.ok) throw new Error('Failed to load documents');
      
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setIsUploadModalOpen(true);
    setUploadForm({
      name: "",
      type: "",
      category: "verification",
      description: "",
      expirationDate: "",
      documentIdentifier: "",
      issuingAuthority: ""
    });
    setUploadedFileData(null);
    setError(null);
    setSuccessMessage(null);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFileData) {
      setError('Please upload a file first using the button below.');
      return;
    }
    
    if (!uploadForm.name || !uploadForm.type) {
      setError('Document name and type are required');
      return;
    }
    
    try {
      setIsSubmittingMetadata(true);
      setError(null);
      
      const metadataToSubmit = { ...uploadForm };
      
      const response = await fetch(`/api/user/documents/${uploadedFileData.documentId}`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadataToSubmit)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update document metadata');
      }
      
      setSuccessMessage('Document uploaded and details saved successfully!');
      closeUploadModal();
      fetchDocuments();
      
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while saving document details');
      console.error("Error submitting document metadata:", err);
    } finally {
      setIsSubmittingMetadata(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also remove the file from storage.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/user/documents/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      // Show success message
      setSuccessMessage('Document deleted successfully');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error deleting document:', error);
      setError(error.message || 'Failed to delete document. Please try again.');
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const getFileIcon = (type: string, url: string) => {
    if (url.endsWith('.pdf')) return <FaFilePdf className="h-6 w-6 text-red-500" />;
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <FaFileImage className="h-6 w-6 text-blue-500" />;
    
    // Based on document type
    switch (type) {
      case 'id':
        return <FaFileAlt className="h-6 w-6 text-yellow-500" />;
      case 'qualification':
      case 'certification':
        return <FaFileAlt className="h-6 w-6 text-green-500" />;
      default:
        return <FaFile className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <FaCheck className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <FaTimes className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            <FaClock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  const isExpiringSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate > today && expiryDate <= thirtyDaysFromNow;
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                My Documents
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload and manage your verification documents
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <button
                type="button"
                onClick={openUploadModal}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <FaPlus className="-ml-0.5 mr-1.5 h-4 w-4" />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Notification Messages */}
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaCheck className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Document Verification</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Upload your documents for verification. These may include ID, qualifications, certificates, 
                  and other required documentation. All documents will be reviewed by our team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <FaSpinner className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
              <FaFileUpload className="mb-2 h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't uploaded any documents yet.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={openUploadModal}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <FaPlus className="-ml-0.5 mr-1.5 h-4 w-4" />
                  Upload Document
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <li key={doc.id} className="flex flex-col p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center">
                    <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-gray-100">
                      {getFileIcon(doc.type, doc.url)}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate text-base font-medium text-gray-900">{doc.name}</h3>
                        <div className="ml-2 flex-shrink-0">
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap text-sm text-gray-500">
                        <span className="mr-3">
                          {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                        </span>
                        <span className="mr-3">
                          {formatFileSize(doc.fileSize)}
                        </span>
                        <span>
                          Uploaded on {formatDate(doc.createdAt)}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {doc.description}
                        </p>
                      )}
                      {doc.expirationDate && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <FaClock className="text-gray-500 mr-1" />
                            <span className="text-sm">
                              {isExpired(doc.expirationDate) ? (
                                <span className="text-red-600 font-semibold">Expired: {formatDate(doc.expirationDate)}</span>
                              ) : isExpiringSoon(doc.expirationDate) ? (
                                <span className="text-amber-600 font-semibold">Expires: {formatDate(doc.expirationDate)}</span>
                              ) : (
                                <span className="text-gray-600">Expires: {formatDate(doc.expirationDate)}</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      {doc.documentIdentifier && (
                        <div className="mt-1 text-sm text-gray-600">
                          ID: {doc.documentIdentifier}
                        </div>
                      )}
                      {doc.issuingAuthority && (
                        <div className="mt-1 text-sm text-gray-600">
                          Issued by: {doc.issuingAuthority}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3 sm:mt-0 sm:ml-4">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <FaDownload className="mr-1.5 h-4 w-4 text-gray-500" />
                      View
                    </a>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-red-500"
                    >
                      <FaTrash className="mr-1.5 h-4 w-4 text-gray-500" />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-75 p-4 transition-opacity duration-300 ease-in-out">
          <form onSubmit={handleUploadSubmit} className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-semibold text-gray-900">Upload New Document</h3>
              <button
                type="button"
                onClick={closeUploadModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                disabled={isSubmittingMetadata}
              >
                <span className="sr-only">Close</span>
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Scrollable Form Content */} 
            <div className="flex-grow space-y-5 overflow-y-auto pr-2"> 
              {/* --- UPLOADTHING BUTTON SECTION --- */}
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <label className="mb-2 block text-sm font-semibold text-gray-800">1. Select Document File</label>
                {uploadedFileData ? (
                  <div className="flex items-center justify-between rounded-md border border-green-300 bg-green-100 p-3">
                    <div className="flex min-w-0 items-center">
                      <FaCheck className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                      <p className="truncate text-sm font-medium text-green-800">
                        {uploadedFileData.fileName}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setUploadedFileData(null)} 
                      className="ml-3 flex-shrink-0 rounded bg-white p-1 text-xs font-medium text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-red-800"
                      disabled={isSubmittingMetadata}
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    endpoint="documentUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res.length > 0) {
                        console.log("Upload Res:", res);
                        // Ensure serverData exists before accessing properties
                        if (res[0].serverData?.documentId) {
                          setUploadedFileData({
                            documentId: res[0].serverData.documentId,
                            documentUrl: res[0].serverData.documentUrl,
                            fileName: res[0].name
                          });
                          // Auto-fill name if empty
                          if (!uploadForm.name) {
                             setUploadForm(prev => ({ ...prev, name: res[0].name.split('.').slice(0,-1).join('.') || res[0].name }));
                          }
                          setError(null); // Clear previous errors
                        } else {
                           setError("Upload succeeded but key data was missing from server response.");
                           console.error("Missing serverData in response:", res[0]);
                        }
                      } else {
                        setError("Upload succeeded but no data received from server.");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error(`UPLOAD ERROR! ${error.message}`, error);
                      setError(`File Upload Failed: ${error.message}`);
                      setUploadedFileData(null);
                    }}
                    appearance={{
                      container: "w-full mt-1",
                      allowedContent: "text-gray-500 text-xs mt-1.5"
                    }}
                    content={{
                      button({ ready, isUploading }) {
                        if (isUploading) return <div className="flex items-center justify-center"><FaSpinner className="animate-spin h-4 w-4 mr-2" /> Uploading...</div>;
                        if (ready) return "Choose File";
                        return "Getting ready...";
                      },
                    }}
                  />
                )}
                <p className="mt-1.5 text-xs text-gray-500">Max 8MB. Allowed: PDF, DOCX, PNG, JPG.</p>
              </div>
              
              {/* --- METADATA FORM FIELDS SECTION --- */}
              <div className="space-y-4 border-t pt-4">
                <label className="block text-sm font-semibold text-gray-800">2. Document Details</label>
                {/* Name */}
                <div>
                  <label htmlFor="name" className="mb-1 block text-xs font-medium text-gray-600">Document Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={uploadForm.name}
                    onChange={handleUploadFormChange}
                    required
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                    placeholder="e.g., Garda Vetting Certificate 2024"
                  />
                </div>

                {/* Type */}
                <div>
                  <label htmlFor="type" className="mb-1 block text-xs font-medium text-gray-600">Document Type <span className="text-red-500">*</span></label>
                  <select
                    id="type"
                    name="type"
                    value={uploadForm.type}
                    onChange={handleUploadFormChange}
                    required
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                  >
                    <option value="" disabled>Select type...</option>
                    {documentTypes.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="mb-1 block text-xs font-medium text-gray-600">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={uploadForm.category}
                    onChange={handleUploadFormChange}
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                  >
                    {documentCategories.map(dc => (
                      <option key={dc.value} value={dc.value}>{dc.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="description" className="mb-1 block text-xs font-medium text-gray-600">Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    value={uploadForm.description}
                    onChange={handleUploadFormChange}
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                    placeholder="Add any relevant details about the document"
                  />
                </div>
                
                {/* Expiration Date */}
                <div>
                  <label htmlFor="expirationDate" className="mb-1 block text-xs font-medium text-gray-600">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    id="expirationDate"
                    name="expirationDate"
                    value={uploadForm.expirationDate}
                    onChange={handleUploadFormChange}
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                  />
                </div>

                {/* Document Identifier */}
                <div>
                  <label htmlFor="documentIdentifier" className="mb-1 block text-xs font-medium text-gray-600">Document ID/Number (Optional)</label>
                  <input
                    type="text"
                    id="documentIdentifier"
                    name="documentIdentifier"
                    value={uploadForm.documentIdentifier}
                    onChange={handleUploadFormChange}
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                    placeholder="e.g., Certificate number, Garda Vetting ID"
                  />
                </div>

                {/* Issuing Authority */}
                <div>
                  <label htmlFor="issuingAuthority" className="mb-1 block text-xs font-medium text-gray-600">Issuing Authority (Optional)</label>
                  <input
                    type="text"
                    id="issuingAuthority"
                    name="issuingAuthority"
                    value={uploadForm.issuingAuthority}
                    onChange={handleUploadFormChange}
                    disabled={isSubmittingMetadata}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                    placeholder="e.g., National Vetting Bureau, QQI"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex flex-shrink-0 justify-end space-x-3 border-t pt-5">
              <button
                type="button"
                onClick={closeUploadModal}
                disabled={isSubmittingMetadata}
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!uploadedFileData || isSubmittingMetadata} 
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingMetadata ? (
                  <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaFileUpload className="mr-2 h-4 w-4" /> 
                )}
                {isSubmittingMetadata ? "Saving Details..." : "Save Document Details"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 