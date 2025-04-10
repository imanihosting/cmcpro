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
  FaExclamationCircle,
  FaCalendarAlt,
  FaVenusMars
} from "react-icons/fa";

// Import UploadButton
import { UploadButton } from "@/utils/uploadthing"; // Adjust path if needed

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
    bio: "",
    gender: "",
    dateOfBirth: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Redirect if not an admin
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        if (!response.ok) throw new Error('Failed to load profile data');
        
        const userData = await response.json();
        
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          location: userData.location || "",
          bio: userData.bio || "",
          gender: userData.gender || "",
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "",
        });
        
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Fallback to session data if API fails
        if (session?.user) {
          setFormData({
            name: session.user.name || "",
            email: session.user.email || "",
            phoneNumber: "",
            location: "",
            bio: "",
            gender: "",
            dateOfBirth: "",
          });
          setProfileImage(session.user.image || null);
        }
      }
    };

    if (status === "authenticated") {
      loadUserData();
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
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
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();

      // Update session data with new name
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name
        }
      });

      showNotification(true, data.message || "✅ Profile updated successfully! Your changes have been saved.");
      // Scroll to top to ensure notification is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showNotification(false, "Failed to update profile. Please try again.");
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Profile</h1>
        <div className="mt-2 inline-flex items-center rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
          <FaUser className="mr-1 h-4 w-4" />
          Admin Account
        </div>
      </div>

      {/* Show notification messages */}
      {successMessage && (
        <div className="mb-6 flex items-center rounded-md bg-green-50 p-4 text-green-800">
          <FaCheck className="mr-3 h-5 w-5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center rounded-md bg-red-50 p-4 text-red-800">
          <FaExclamationCircle className="mr-3 h-5 w-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Profile Picture Section */}
        <div className="md:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Profile Picture</h2>
            
            {/* Profile picture display/upload */}
            <div className="flex flex-col items-center">
              {/* Current Profile Image Display */}
              <div className="relative mb-4 h-40 w-40 overflow-hidden rounded-full border-4 border-gray-200">
                {profileImage ? (
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
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <FaUser className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* UploadThing Button */}
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res.length > 0) {
                    const newImageUrl = res[0].url;
                    setProfileImage(newImageUrl);
                    update({
                      ...session,
                      user: {
                        ...session?.user,
                        image: newImageUrl
                      }
                    });
                    showNotification(true, "✅ Profile picture updated successfully!");
                  } else {
                    showNotification(false, "Upload completed but no URL received.");
                  }
                }}
                onUploadError={(error: Error) => {
                  console.error(`ERROR! ${error.message}`, error);
                  showNotification(false, `Upload Failed: ${error.message}`);
                }}
                appearance={{
                  button: "ut-button:bg-indigo-600 ut-button:hover:bg-indigo-700 ut-button:ut-uploading:bg-indigo-700/50 ut-button:transition-all ut-button:duration-300",
                  container: "w-full flex justify-center",
                  allowedContent: "text-gray-500 text-xs hidden",
                }}
                content={{
                  button({ ready, isUploading }) {
                    if (isUploading) return <div className="flex items-center"><FaSpinner className="animate-spin h-4 w-4 mr-2" /> Uploading...</div>;
                    if (ready) return <div className="flex items-center"><FaUpload className="h-4 w-4 mr-2" /> Change Picture</div>;
                    return "Getting ready...";
                  },
                }}
              />
              
              <p className="mt-2 text-xs text-gray-500">
                Upload a new profile picture. Max 4MB.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="md:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Profile Details</h2>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                
                {/* Email (read-only) */}
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="block w-full rounded-md border-gray-300 bg-gray-50 pl-10 text-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                {/* Phone Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                
                {/* Location */}
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Your location"
                    />
                  </div>
                </div>
                
                {/* Gender */}
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaVenusMars className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange as any}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                {/* Date of Birth */}
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                {/* Bio */}
                <div className="col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 