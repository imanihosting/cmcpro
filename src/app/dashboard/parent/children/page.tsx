"use client";

import { useState, useEffect } from "react";
import { 
  FaChild, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaNotesMedical,
  FaBirthdayCake,
  FaInfoCircle,
  FaCalendarAlt,
  FaTimes,
  FaCheckCircle
} from "react-icons/fa";
import LoadingSpinner from '@/components/LoadingSpinner';

interface Child {
  id: string;
  name: string;
  age: number;
  allergies: string | null;
  specialNeeds: string | null;
  bookingCount?: number;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
}

// Child form data interface
interface ChildFormData {
  id?: string;
  name: string;
  age: string; // Using string for form input
  allergies: string;
  specialNeeds: string;
}

// Modal props interface
interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ChildFormData) => Promise<void>;
  child?: Child | null;
  title: string;
}

// Child Modal Component
function ChildModal({ isOpen, onClose, onSave, child, title }: ChildModalProps) {
  const [formData, setFormData] = useState<ChildFormData>({
    name: '',
    age: '',
    allergies: '',
    specialNeeds: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form when modal opens/closes or child changes
  useEffect(() => {
    if (isOpen && child) {
      setFormData({
        id: child.id,
        name: child.name,
        age: child.age.toString(),
        allergies: child.allergies || '',
        specialNeeds: child.specialNeeds || ''
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        age: '',
        allergies: '',
        specialNeeds: ''
      });
    }
    
    // Clear errors when modal opens/closes
    setFormError(null);
  }, [isOpen, child]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!formData.name.trim()) {
      setFormError("Name is required");
      return;
    }
    
    if (!formData.age.trim() || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      setFormError("Please enter a valid age");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving child:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save child');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          disabled={isSubmitting}
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        
        {formError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-sm text-red-700">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Child's Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 p-2 border"
              placeholder="Enter child's name"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 p-2 border"
              placeholder="Enter child's age"
              min="0"
              max="18"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
              Allergies
            </label>
            <textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 p-2 border"
              placeholder="List any allergies (optional)"
              rows={2}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 mb-1">
              Special Needs
            </label>
            <textarea
              id="specialNeeds"
              name="specialNeeds"
              value={formData.specialNeeds}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 p-2 border"
              placeholder="Describe any special needs (optional)"
              rows={2}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="small" /> : formData.id ? 'Save Changes' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Success notification component
interface NotificationProps {
  message: string;
  onClose: () => void;
}

function SuccessNotification({ message, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-green-50 p-4 rounded-lg shadow-md border border-green-200 animate-fade-in-down">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaCheckCircle className="h-5 w-5 text-green-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
            >
              <span className="sr-only">Dismiss</span>
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Child');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [deleteConfirmChild, setDeleteConfirmChild] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch children data
  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/parent/children');
      
      if (!response.ok) {
        throw new Error('Failed to fetch children data');
      }
      
      const data = await response.json();
      setChildren(data.children || []);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  // Open modal for adding a new child
  const handleAddChild = () => {
    setSelectedChild(null);
    setModalTitle('Add Child');
    setIsModalOpen(true);
  };

  // Open modal for editing a child
  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    setModalTitle('Edit Child');
    setIsModalOpen(true);
  };

  // Function to save a child (create or update)
  const handleSaveChild = async (formData: ChildFormData) => {
    try {
      const isEditing = !!formData.id;
      const endpoint = isEditing 
        ? `/api/dashboard/parent/children/${formData.id}` 
        : '/api/dashboard/parent/children';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          allergies: formData.allergies || null,
          specialNeeds: formData.specialNeeds || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} child`);
      }
      
      // Show success message
      setSuccessMessage(isEditing 
        ? `${formData.name}'s profile has been updated successfully` 
        : `${formData.name} has been added successfully`);
      
      // Refresh children list
      await fetchChildren();
    } catch (error) {
      console.error('Error saving child:', error);
      throw error;
    }
  };

  // Function to handle delete child
  const handleDeleteChild = async (child: Child) => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/dashboard/parent/children/${child.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete child');
      }
      
      // Show success message
      setSuccessMessage(`${child.name} has been removed successfully`);
      
      // Refresh children list
      await fetchChildren();
      setDeleteConfirmChild(null);
    } catch (err) {
      console.error('Error deleting child:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete child');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      {/* Success notification */}
      {successMessage && (
        <SuccessNotification 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}
      
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Children</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your children's profiles and preferences</p>
      </header>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add child button */}
      <div className="mb-6">
        <button 
          onClick={handleAddChild}
          className="flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          <FaPlus className="mr-2 h-4 w-4" /> Add Child
        </button>
      </div>

      {/* Children profiles */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children.length > 0 ? (
          <>
            {children.map((child) => (
              <div key={child.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
                {deleteConfirmChild?.id === child.id ? (
                  <div className="p-6 text-center">
                    <FaInfoCircle className="mx-auto h-8 w-8 text-red-400 mb-4" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      Delete {child.name}?
                    </h3>
                    <p className="mb-4 text-sm text-gray-600">
                      Are you sure you want to delete this child? This action cannot be undone.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => setDeleteConfirmChild(null)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteChild(child)}
                        className="rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none"
                        disabled={isDeleting}
                      >
                        {isDeleting ? <LoadingSpinner size="small" /> : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-32 bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                      <FaChild className="h-16 w-16 text-white opacity-75" />
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-semibold text-gray-900">{child.name}</h2>
                      
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FaBirthdayCake className="mr-2 h-4 w-4 text-gray-400" />
                          <span>Age: {child.age}</span>
                        </div>
                        {child.allergies && (
                          <div className="flex items-start">
                            <FaNotesMedical className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium">Allergies:</p>
                              <p>{child.allergies}</p>
                            </div>
                          </div>
                        )}
                        {child.specialNeeds && (
                          <div className="flex items-start">
                            <FaInfoCircle className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium">Special Needs:</p>
                              <p>{child.specialNeeds}</p>
                            </div>
                          </div>
                        )}
                        {child.bookingCount !== undefined && (
                          <div className="flex items-center mt-2">
                            <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
                            <span>Bookings: {child.bookingCount}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditChild(child)}
                          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <FaEdit className="mr-1 inline h-4 w-4" /> Edit
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmChild(child)}
                          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-red-700"
                        >
                          <FaTrash className="mr-1 inline h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="col-span-3 text-center py-8">
            <p className="text-gray-500">You haven't added any children yet.</p>
          </div>
        )}

        {/* Add child card */}
        <div 
          onClick={handleAddChild}
          className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-center hover:border-violet-500 hover:bg-violet-50 transition-colors cursor-pointer"
        >
          <div className="flex h-full flex-col items-center justify-center py-6">
            <FaChild className="mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-sm font-medium text-gray-900">Add a New Child</h3>
            <p className="text-xs text-gray-500">Click to add a new child profile</p>
          </div>
        </div>
      </div>

      {/* Information notice */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaInfoCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Why add children profiles?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Adding complete profiles for your children helps childminders provide personalized care. 
                Important details like allergies and special needs ensure they can meet your child's specific requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Child modal */}
      <ChildModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChild}
        child={selectedChild}
        title={modalTitle}
      />
    </div>
  );
} 