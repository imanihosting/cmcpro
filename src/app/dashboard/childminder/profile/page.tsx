"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaImage,
  FaSave,
  FaSpinner,
  FaUpload,
  FaTimes,
  FaBaby,
  FaGraduationCap,
  FaHandHoldingHeart,
  FaMoneyBillWave,
  FaCertificate,
  FaLanguage,
  FaInfo,
  FaCheck
} from "react-icons/fa";

import { 
  inputWithIconClass, 
  textareaClass, 
  disabledClass,
  combineInputClasses,
  selectWithIconClass
} from '@/components/ui/InputStyles';

export default function ChildminderProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic profile information
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
    bio: "",
    
    // Professional profile fields
    qualifications: "",
    specialties: "",
    rate: "",
    yearsOfExperience: 0,
    maxChildrenCapacity: 0,
    languagesSpoken: [], // Will store as JSON array
    ageGroupsServed: [], // Will store as JSON array
    careTypes: [], // Will store as JSON array
    
    // Certifications and credentials
    childrenFirstCert: false,
    firstAidCert: false,
    firstAidCertExpiry: "",
    gardaVetted: false,
    tuslaRegistered: false,
    tuslaRegistrationNumber: "",
    educationLevel: "",
    otherQualifications: "",
    
    // Additional services
    mealsProvided: false,
    pickupDropoff: false,
    specialNeedsExp: false,
    specialNeedsDetails: ""
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) throw new Error('Failed to load profile data');
        
        const userData = await response.json();
        
        // Handle potential data conversions as needed
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          location: userData.location || "",
          bio: userData.bio || "",
          
          // Professional profile fields
          qualifications: userData.qualifications || "",
          specialties: userData.specialties || "",
          rate: userData.rate ? userData.rate.toString() : "",
          yearsOfExperience: userData.yearsOfExperience || 0,
          maxChildrenCapacity: userData.maxChildrenCapacity || 0,
          languagesSpoken: userData.languagesSpoken || [],
          ageGroupsServed: userData.ageGroupsServed || [],
          careTypes: userData.careTypes || [],
          
          // Certifications and credentials
          childrenFirstCert: userData.childrenFirstCert || false,
          firstAidCert: userData.firstAidCert || false,
          firstAidCertExpiry: userData.firstAidCertExpiry ? new Date(userData.firstAidCertExpiry).toISOString().split('T')[0] : "",
          gardaVetted: userData.gardaVetted || false,
          tuslaRegistered: userData.tuslaRegistered || false,
          tuslaRegistrationNumber: userData.tuslaRegistrationNumber || "",
          educationLevel: userData.educationLevel || "",
          otherQualifications: userData.otherQualifications || "",
          
          // Additional services
          mealsProvided: userData.mealsProvided || false,
          pickupDropoff: userData.pickupDropoff || false,
          specialNeedsExp: userData.specialNeedsExp || false,
          specialNeedsDetails: userData.specialNeedsDetails || ""
        });
        
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Fallback to session data
        if (session?.user) {
          setFormData(prevData => ({
            ...prevData,
            name: session.user.name || "",
            email: session.user.email || ""
          }));
          setProfileImage(session.user.image || null);
        }
      }
    };

    if (status === "authenticated") {
      loadUserData();
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prevData => ({
        ...prevData,
        [name]: checked
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  // Function to handle multi-select options (like languages, age groups, care types)
  const handleMultiSelectChange = (name: string, value: string, isChecked: boolean) => {
    setFormData(prevData => {
      const currentArray = Array.isArray(prevData[name as keyof typeof prevData]) 
        ? [...prevData[name as keyof typeof prevData] as string[]] 
        : [];
      
      if (isChecked) {
        return { ...prevData, [name]: [...currentArray, value] };
      } else {
        return { ...prevData, [name]: currentArray.filter(item => item !== value) };
      }
    });
  };

  // Function to clear notifications after a delay
  const showNotification = (isSuccess: boolean, message: string) => {
    if (isSuccess) {
      setSuccessMessage(message);
      setErrorMessage(null);
    } else {
      setErrorMessage(message);
      setSuccessMessage(null);
    }
    
    // Auto-clear notification after 5 seconds
    setTimeout(() => {
      if (isSuccess) {
        setSuccessMessage(null);
      } else {
        setErrorMessage(null);
      }
    }, 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const dataToSubmit = {
        ...formData,
        rate: formData.rate ? parseFloat(formData.rate) : null,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience.toString(), 10) : null,
        maxChildrenCapacity: formData.maxChildrenCapacity ? parseInt(formData.maxChildrenCapacity.toString(), 10) : null,
        firstAidCertExpiry: formData.firstAidCertExpiry ? new Date(formData.firstAidCertExpiry).toISOString() : null
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Update session data with new name
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name
        }
      });

      showNotification(true, "✅ Profile updated successfully! Your changes have been saved.");
      
      // Scroll behavior smooth for better UX
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    } catch (error) {
      showNotification(false, error instanceof Error ? error.message : "Failed to update profile. Please try again.");
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!imagePreview) return;
    
    setUploadLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Convert base64 to blob
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('profileImage', blob);
      
      const uploadResponse = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload profile image');
      }
      
      const data = await uploadResponse.json();
      
      // Update the profile image state
      setProfileImage(data.imageUrl);
      
      // Update session with new image
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.imageUrl
        }
      });
      
      showNotification(true, '✅ Profile picture updated successfully! Your photo has been saved.');
      setImagePreview(null);
      // Scroll to top to ensure notification is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showNotification(false, 'Failed to upload profile picture. Please try again.');
      console.error('Error uploading profile picture:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  const cancelImageUpload = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Success Notification - Updated for better mobile visibility */}
      {successMessage && (
        <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-md transform px-4 transition-all duration-300 ease-in-out">
          <div className="mt-16 rounded-lg bg-green-100 p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaCheck className="h-6 w-6 text-green-500" aria-hidden="true" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-base font-medium text-green-800">{successMessage}</p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex rounded-md bg-green-100 p-1.5 text-green-500 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification - Updated to match success notification style */}
      {errorMessage && (
        <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-md transform px-4 transition-all duration-300 ease-in-out">
          <div className="mt-16 rounded-lg bg-red-100 p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaTimes className="h-6 w-6 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-base font-medium text-red-800">{errorMessage}</p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="inline-flex rounded-md bg-red-100 p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-8 text-3xl font-bold text-gray-800">Professional Profile</h1>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Profile Picture Section */}
        <div className="md:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex flex-col items-center">
              <div 
                onClick={handleProfilePictureClick}
                className="relative mb-4 h-40 w-40 cursor-pointer overflow-hidden rounded-full border-4 border-gray-200 hover:opacity-90"
              >
                {imagePreview ? (
                  <Image 
                    src={imagePreview} 
                    alt="Profile Preview" 
                    fill 
                    className="object-cover" 
                  />
                ) : profileImage ? (
                  <Image 
                    src={profileImage} 
                    alt="Profile" 
                    fill 
                    className="object-cover" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <FaUser className="h-20 w-20 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 transition hover:opacity-100">
                  <FaImage className="h-10 w-10 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              {imagePreview && (
                <div className="flex w-full space-x-2">
                  <button
                    onClick={handleUploadImage}
                    disabled={uploadLoading}
                    className="flex-1 rounded-md bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:bg-violet-400"
                  >
                    {uploadLoading ? (
                      <span className="flex items-center justify-center">
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <FaUpload className="mr-2 h-4 w-4" />
                        Upload
                      </span>
                    )}
                  </button>
                  <button
                    onClick={cancelImageUpload}
                    className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              Upload a professional photo for your profile. Parents will see this image when searching for childminders.
            </p>
          </div>
        </div>
        
        {/* Profile Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Basic Information Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputWithIconClass}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      className={combineInputClasses(inputWithIconClass, disabledClass)}
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={inputWithIconClass}
                      placeholder="e.g. +353 1 234 5678"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={inputWithIconClass}
                      placeholder="e.g. Dublin 4, Ireland"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className={textareaClass}
                    placeholder="Tell parents about yourself, your experience, and your childcare approach..."
                  />
                </div>
              </div>
            </div>
            
            {/* Professional Details Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Professional Details</h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="qualifications" className="mb-1 block text-sm font-medium text-gray-700">
                    Qualifications
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaGraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="qualifications"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleChange}
                      className={inputWithIconClass}
                      placeholder="e.g. Early Childhood Education"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="educationLevel" className="mb-1 block text-sm font-medium text-gray-700">
                    Education Level
                  </label>
                  <select
                    id="educationLevel"
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className={selectWithIconClass}
                  >
                    <option value="">Select Education Level</option>
                    <option value="Secondary School">Secondary School</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor's">Bachelor's Degree</option>
                    <option value="Master's">Master's Degree</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="yearsOfExperience" className="mb-1 block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaGraduationCap className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      min="0"
                      className={inputWithIconClass}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="maxChildrenCapacity" className="mb-1 block text-sm font-medium text-gray-700">
                    Maximum Children Capacity
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaBaby className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="maxChildrenCapacity"
                      name="maxChildrenCapacity"
                      value={formData.maxChildrenCapacity}
                      onChange={handleChange}
                      min="1"
                      max="10"
                      className={inputWithIconClass}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="rate" className="mb-1 block text-sm font-medium text-gray-700">
                    Hourly Rate (€)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="rate"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={inputWithIconClass}
                      placeholder="e.g. 15.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="specialties" className="mb-1 block text-sm font-medium text-gray-700">
                    Specialties
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaHandHoldingHeart className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="specialties"
                      name="specialties"
                      value={formData.specialties}
                      onChange={handleChange}
                      className={inputWithIconClass}
                      placeholder="e.g. Montessori, Arts, Music"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center rounded-md bg-violet-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:bg-violet-300"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 