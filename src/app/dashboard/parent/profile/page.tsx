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
  FaCheck,
  FaExclamationCircle
} from "react-icons/fa";

import { 
  inputWithIconClass, 
  textareaClass, 
  disabledClass,
  combineInputClasses
} from '@/components/ui/InputStyles';

export default function ParentProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: {
      streetAddress: "",
      city: "",
      county: "",
      eircode: ""
    }
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect if not a parent
    if (status === "authenticated" && session?.user?.role !== "parent") {
      router.push("/dashboard");
      return;
    }

    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) throw new Error('Failed to load profile data');
        
        const userData = await response.json();
        
        // Process address from various formats
        let streetAddress = "", city = "", county = "", eircode = "";
        
        // Parse address if it's in structured format
        if (userData.address) {
          // Direct assignment if values are simple strings
          if (typeof userData.address.streetAddress === 'string' && !userData.address.streetAddress.startsWith('{')) {
            streetAddress = userData.address.streetAddress;
          } else {
            // Try to parse if it looks like a JSON string
            try {
              if (typeof userData.address.streetAddress === 'string') {
                const parsed = JSON.parse(userData.address.streetAddress.replace(/^{"|"}$/g, '').replace(/\\"/g, '"'));
                streetAddress = parsed.streetAddress || '';
              }
            } catch (e) {
              streetAddress = userData.address.streetAddress || '';
            }
          }

          // City handling
          if (typeof userData.address.city === 'string' && !userData.address.city.startsWith('"')) {
            city = userData.address.city;
          } else {
            try {
              if (typeof userData.address.city === 'string') {
                const matches = userData.address.city.match(/"city":"([^"]+)"/);
                city = matches && matches[1] ? matches[1] : '';
              }
            } catch (e) {
              city = userData.address.city || '';
            }
          }

          // County is usually a simple string
          county = userData.address.county || '';

          // Eircode handling
          if (typeof userData.address.eircode === 'string' && !userData.address.eircode.startsWith('"')) {
            eircode = userData.address.eircode;
          } else {
            try {
              if (typeof userData.address.eircode === 'string') {
                const matches = userData.address.eircode.match(/"eircode":"([^"]+)"/);
                eircode = matches && matches[1] ? matches[1] : '';
              }
            } catch (e) {
              eircode = userData.address.eircode || '';
            }
          }
        } 
        // Fallback to location string if needed
        else if (userData.location) {
          try {
            // Try to parse JSON string
            if (userData.location.startsWith('{') && userData.location.endsWith('}')) {
              const parsedLocation = JSON.parse(userData.location);
              streetAddress = parsedLocation.streetAddress || '';
              city = parsedLocation.city || '';
              county = parsedLocation.county || '';
              eircode = parsedLocation.eircode || '';
            } else {
              // Simple comma-separated format
              const parts = userData.location.split(',');
              streetAddress = parts[0] ? parts[0].trim() : '';
              city = parts[1] ? parts[1].trim() : '';
              county = parts[2] ? parts[2].trim() : '';
              eircode = parts[3] ? parts[3].trim() : '';
            }
          } catch (e) {
            // If parsing fails, use whole string as streetAddress
            streetAddress = userData.location;
          }
        }
        
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          address: {
            streetAddress,
            city,
            county,
            eircode
          }
        });
        
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Fallback to session data
        if (session?.user) {
          setFormData({
            name: session.user.name || "",
            email: session.user.email || "",
            phoneNumber: "",
            address: {
              streetAddress: "",
              city: "",
              county: "",
              eircode: ""
            }
          });
          setProfileImage(session.user.image || null);
        }
      }
    };

    if (status === "authenticated") {
      loadUserData();
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects like address.streetAddress
      const [parent, child] = name.split('.');
      setFormData(prevData => ({
        ...prevData,
        [parent]: {
          ...(prevData as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
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
      // Make sure address values are clean
      const cleanedAddress = {
        streetAddress: formData.address.streetAddress,
        city: formData.address.city,
        county: formData.address.county,
        eircode: formData.address.eircode
      };
      
      // Construct data selectively, excluding profileImage
      const dataToSubmit = {
        name: formData.name,
        email: formData.email, // Email is typically needed for identification or ignored by API
        phoneNumber: formData.phoneNumber,
        address: cleanedAddress
        // DO NOT include profileImage here
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
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
      // Scroll to top to ensure notification is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showNotification(false, "Failed to update profile. Please try again.");
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
    <div className="container mx-auto px-4 py-8 relative">
      {/* Success Notification - Updated for better mobile visibility */}
      {successMessage && (
        <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-md transform px-4 transition-all duration-300 ease-in-out">
          <div className="mt-16 rounded-lg bg-green-100 p-4 shadow-lg animate-fade-in-down">
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
          <div className="mt-16 rounded-lg bg-red-100 p-4 shadow-lg animate-fade-in-down">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationCircle className="h-6 w-6 text-red-500" aria-hidden="true" />
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your personal information and profile picture</p>
        <div className="mt-4 h-1 w-20 bg-violet-600 rounded"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Profile Picture Section */}
        <div className="rounded-lg bg-white p-6 shadow-md border border-gray-200 md:col-span-1">
          <h2 className="mb-4 text-xl font-bold text-gray-900 border-b pb-2">Profile Picture</h2>
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div 
              className="relative h-40 w-40 overflow-hidden rounded-full bg-gray-100 cursor-pointer"
              onClick={handleProfilePictureClick}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className="h-full w-full object-cover"
                />
              ) : profileImage ? (
                <Image 
                  src={profileImage} 
                  alt="Profile" 
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  priority
                  unoptimized={!profileImage.startsWith('/')}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-600">
                  <FaUser className="h-16 w-16" />
                </div>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <FaUpload className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            
            {imagePreview && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadLoading}
                  className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {uploadLoading ? (
                    <>
                      <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 h-4 w-4" />
                      Save Photo
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={cancelImageUpload}
                  className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <FaTimes className="mr-2 h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
            
            <p className="text-sm text-gray-500 text-center">
              Click the image above to select a new profile picture
            </p>
            <p className="text-xs text-gray-500 text-center">
              Recommended: Square image, at least 400x400 pixels
            </p>
          </div>
        </div>
        
        {/* Profile Information */}
        <div className="rounded-lg bg-white p-6 shadow-md border border-gray-200 md:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-gray-900 border-b pb-2">Personal Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaUser className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputWithIconClass}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaEnvelope className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className={combineInputClasses(inputWithIconClass, disabledClass)}
                  placeholder="Your email address"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Email address cannot be changed for security reasons
              </p>
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FaPhone className="h-4 w-4" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={handleChange}
                  className={inputWithIconClass}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            
            <div>
              <h3 className="block text-sm font-medium text-gray-700 mb-2">
                Location Info
              </h3>
              
              {/* Street Address */}
              <div className="mb-3">
                <label htmlFor="address.streetAddress" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <FaMapMarkerAlt className="h-4 w-4" />
                  </div>
                  <input
                    id="address.streetAddress"
                    name="address.streetAddress"
                    type="text"
                    value={formData.address.streetAddress}
                    onChange={handleChange}
                    className={inputWithIconClass}
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
              
              {/* City */}
              <div className="mb-3">
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                  City/Town
                </label>
                <input
                  id="address.city"
                  name="address.city"
                  type="text"
                  value={formData.address.city}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="Dublin"
                />
              </div>
              
              {/* County */}
              <div className="mb-3">
                <label htmlFor="address.county" className="block text-sm font-medium text-gray-700">
                  County
                </label>
                <select
                  id="address.county"
                  name="address.county"
                  value={formData.address.county}
                  onChange={handleChange}
                  className={textareaClass}
                >
                  <option value="">Select a county</option>
                  <option value="Antrim">Antrim</option>
                  <option value="Armagh">Armagh</option>
                  <option value="Carlow">Carlow</option>
                  <option value="Cavan">Cavan</option>
                  <option value="Clare">Clare</option>
                  <option value="Cork">Cork</option>
                  <option value="Derry">Derry</option>
                  <option value="Donegal">Donegal</option>
                  <option value="Down">Down</option>
                  <option value="Dublin">Dublin</option>
                  <option value="Fermanagh">Fermanagh</option>
                  <option value="Galway">Galway</option>
                  <option value="Kerry">Kerry</option>
                  <option value="Kildare">Kildare</option>
                  <option value="Kilkenny">Kilkenny</option>
                  <option value="Laois">Laois</option>
                  <option value="Leitrim">Leitrim</option>
                  <option value="Limerick">Limerick</option>
                  <option value="Longford">Longford</option>
                  <option value="Louth">Louth</option>
                  <option value="Mayo">Mayo</option>
                  <option value="Meath">Meath</option>
                  <option value="Monaghan">Monaghan</option>
                  <option value="Offaly">Offaly</option>
                  <option value="Roscommon">Roscommon</option>
                  <option value="Sligo">Sligo</option>
                  <option value="Tipperary">Tipperary</option>
                  <option value="Tyrone">Tyrone</option>
                  <option value="Waterford">Waterford</option>
                  <option value="Westmeath">Westmeath</option>
                  <option value="Wexford">Wexford</option>
                  <option value="Wicklow">Wicklow</option>
                </select>
              </div>
              
              {/* Eircode */}
              <div className="mb-3">
                <label htmlFor="address.eircode" className="block text-sm font-medium text-gray-700">
                  Eircode
                </label>
                <input
                  id="address.eircode"
                  name="address.eircode"
                  type="text"
                  value={formData.address.eircode}
                  onChange={handleChange}
                  className={textareaClass}
                  placeholder="e.g. D01 F5P2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This helps find childminders in your area through precise location matching
                </p>
              </div>
            </div>
            
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md bg-violet-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-all duration-200 sm:w-auto disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                {isLoading ? "Saving your changes..." : "Click to save your profile information"}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 