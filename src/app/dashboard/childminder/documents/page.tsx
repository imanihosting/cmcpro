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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "",
    category: "verification",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      description: ""
    });
    setSelectedFile(null);
    setError(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill name if it's empty
      if (!uploadForm.name) {
        const fileName = e.target.files[0].name.split('.')[0];
        setUploadForm(prev => ({
          ...prev,
          name: fileName
        }));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!uploadForm.name || !uploadForm.type) {
      setError('Name and document type are required');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadForm.name);
      formData.append('type', uploadForm.type);
      formData.append('category', uploadForm.category);
      if (uploadForm.description) {
        formData.append('description', uploadForm.description);
      }
      
      const response = await fetch('/api/user/documents', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const result = await response.json();
      
      // Close modal and refresh documents
      setIsUploadModalOpen(false);
      fetchDocuments();
      
      // Show success message
      setSuccessMessage('Document uploaded successfully and is pending review');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setError(error.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/user/documents?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      // Show success message
      setSuccessMessage('Document deleted successfully');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeUploadModal}></div>
          <div className="relative mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl sm:p-8">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={closeUploadModal}
              >
                <span className="sr-only">Close</span>
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Upload Document</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Please complete the form below to upload your document for verification.
                </p>
                <form className="mt-4" onSubmit={handleUploadSubmit}>
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-6 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                    />
                    <div 
                      className="flex flex-col items-center justify-center" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaFileUpload className="h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        {selectedFile ? (
                          <>
                            <span className="font-semibold text-indigo-600">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={uploadForm.name}
                      onChange={handleUploadFormChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., First Aid Certificate"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Document Type *
                    </label>
                    <select
                      name="type"
                      id="type"
                      value={uploadForm.type}
                      onChange={handleUploadFormChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select document type</option>
                      {documentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      name="category"
                      id="category"
                      value={uploadForm.category}
                      onChange={handleUploadFormChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                      {documentCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      value={uploadForm.description}
                      onChange={handleUploadFormChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Add any additional details about this document"
                    ></textarea>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={closeUploadModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FaFileUpload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 