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

// Import UploadButton
import { UploadButton } from "@/utils/uploadthing"; // Adjust path if needed

export default function ChildminderProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Basic profile information
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: {
      streetAddress: "",
      city: "",
      county: "",
      eircode: ""
    },
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
    childrenFirstCertified: false,
    firstAidCertified: false,
    firstAidCertExpiry: "",
    gardaVetted: false,
    tuslaRegistered: false,
    tuslaRegistrationNumber: "",
    educationLevel: "",
    otherQualifications: "",
    eccLevel5: false,
    
    // Additional services
    mealsProvided: false,
    pickupDropoff: false,
    specialNeedsExp: false,
    specialNeedsDetails: ""
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

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
        
        // Handle potential data conversions as needed
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          // Use cleaned address values
          address: {
            streetAddress,
            city,
            county,
            eircode
          },
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
          childrenFirstCertified: userData.childrenFirstCertified || false,
          firstAidCertified: userData.firstAidCertified || false,
          firstAidCertExpiry: userData.firstAidCertExpiry ? new Date(userData.firstAidCertExpiry).toISOString().split('T')[0] : "",
          gardaVetted: userData.gardaVetted || false,
          tuslaRegistered: userData.tuslaRegistered || false,
          tuslaRegistrationNumber: userData.tuslaRegistrationNumber || "",
          educationLevel: userData.educationLevel || "",
          otherQualifications: userData.otherQualifications || "",
          eccLevel5: userData.eccLevel5 || false,
          
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
            email: session.user.email || "",
            phoneNumber: session.user.phoneNumber || "",
            address: {
              streetAddress: session.user.address ? session.user.address.streetAddress || "" : "",
              city: session.user.address ? session.user.address.city || "" : "",
              county: session.user.address ? session.user.address.county || "" : "",
              eircode: session.user.address ? session.user.address.eircode || "" : ""
            },
            bio: session.user.bio || ""
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
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const fieldName = name as keyof typeof formData;
    
    if (type === 'checkbox') {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: checked,
      }));
    } else if (fieldName === 'address') {
        // Special handling for nested address object (if needed, though direct update might suffice)
        // This part might need adjustment based on how address fields are named/structured
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [fieldName]: value,
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
      // Make sure address values are plain strings, not JSON fragments
      const cleanedAddress = {
        streetAddress: formData.address.streetAddress,
        city: formData.address.city,
        county: formData.address.county,
        eircode: formData.address.eircode
      };
      
      // Construct data selectively, excluding profileImage and non-existent fields
      const dataToSubmit = {
        name: formData.name,
        email: formData.email, // Include email (API likely ignores or uses for identification)
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        // Childminder specific fields that EXIST in formData:
        ageGroupsServed: formData.ageGroupsServed,
        careTypes: formData.careTypes,
        childrenFirstCertified: formData.childrenFirstCertified,
        firstAidCertified: formData.firstAidCertified,
        gardaVetted: formData.gardaVetted,
        languagesSpoken: formData.languagesSpoken,
        mealsProvided: formData.mealsProvided,
        otherQualifications: formData.otherQualifications,
        pickupDropoff: formData.pickupDropoff,
        specialNeedsExp: formData.specialNeedsExp,
        specialNeedsDetails: formData.specialNeedsDetails,
        specialties: formData.specialties,
        tuslaRegistered: formData.tuslaRegistered,
        tuslaRegistrationNumber: formData.tuslaRegistrationNumber,
        eccLevel5: formData.eccLevel5,
        // Address object (cleaned)
        address: cleanedAddress,
        // Type conversions for fields that EXIST in formData:
        rate: formData.rate ? parseFloat(formData.rate) : null,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience.toString(), 10) : null,
        maxChildrenCapacity: formData.maxChildrenCapacity ? parseInt(formData.maxChildrenCapacity.toString(), 10) : null,
        firstAidCertExpiry: formData.firstAidCertExpiry ? new Date(formData.firstAidCertExpiry).toISOString() : null,
        // DO NOT include profileImage, location, availability, rateDetails
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
              {/* Current Profile Image Display */}
              <div className="relative mb-4 h-40 w-40 overflow-hidden rounded-full border-4 border-gray-200">
                {profileImage ? (
                  <Image 
                    src={profileImage} 
                    alt="Profile" 
                    fill 
                    className="object-cover" 
                    unoptimized={!profileImage.startsWith('/')} // Assuming UploadThing URLs are absolute
                    priority
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
                  button: "ut-button:bg-violet-600 ut-button:hover:bg-violet-700 ut-button:ut-uploading:bg-violet-700/50 ut-button:transition-all ut-button:duration-300 w-full",
                  container: "w-full flex justify-center mt-2",
                  allowedContent: "text-gray-500 text-xs hidden",
                }}
                content={{
                  button({ ready, isUploading }) {
                    if (isUploading) return <div className="flex items-center justify-center"><FaSpinner className="animate-spin h-4 w-4 mr-2" /> Uploading...</div>;
                    if (ready) return <div className="flex items-center justify-center"><FaUpload className="h-4 w-4 mr-2" /> Change Picture</div>;
                    return "Getting ready...";
                  },
                }}
              />
            </div>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              Upload a professional photo. Max 4MB.
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
                  <h3 className="mb-2 block text-sm font-medium text-gray-700">
                    Address
                  </h3>
                  
                  {/* Street Address */}
                  <div className="mb-3">
                    <label htmlFor="address.streetAddress" className="mb-1 block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="address.streetAddress"
                        name="address.streetAddress"
                        value={formData.address.streetAddress}
                        onChange={handleChange}
                        className={inputWithIconClass}
                        placeholder="123 Main Street"
                      />
                    </div>
                  </div>
                  
                  {/* City/Town */}
                  <div className="mb-3">
                    <label htmlFor="address.city" className="mb-1 block text-sm font-medium text-gray-700">
                      City/Town
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={textareaClass}
                      placeholder="Dublin"
                    />
                  </div>
                  
                  {/* County */}
                  <div className="mb-3">
                    <label htmlFor="address.county" className="mb-1 block text-sm font-medium text-gray-700">
                      County
                    </label>
                    <select
                      id="address.county"
                      name="address.county"
                      value={formData.address.county}
                      onChange={handleChange}
                      className={selectWithIconClass}
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
                  <div>
                    <label htmlFor="address.eircode" className="mb-1 block text-sm font-medium text-gray-700">
                      Eircode
                    </label>
                    <input
                      type="text"
                      id="address.eircode"
                      name="address.eircode"
                      value={formData.address.eircode}
                      onChange={handleChange}
                      className={textareaClass}
                      placeholder="e.g. D01 F5P2"
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

            {/* Certifications and Credentials Card */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Certifications and Credentials</h2>
              
              <div className="space-y-4">
                {/* First Aid Cert */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="firstAidCertified"
                    name="firstAidCertified"
                    checked={formData.firstAidCertified}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="firstAidCertified" className="ml-3 block text-sm text-gray-700">
                    First Aid Certified
                  </label>
                </div>
                
                {/* First Aid Expiry */}
                {formData.firstAidCertified && (
                  <div className="ml-7">
                    <label htmlFor="firstAidCertExpiry" className="mb-1 block text-xs font-medium text-gray-600">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="firstAidCertExpiry"
                      name="firstAidCertExpiry"
                      value={formData.firstAidCertExpiry}
                      onChange={handleChange}
                      className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    />
                  </div>
                )}

                {/* Children First Cert */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="childrenFirstCertified"
                    name="childrenFirstCertified"
                    checked={formData.childrenFirstCertified}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="childrenFirstCertified" className="ml-3 block text-sm text-gray-700">
                    Children First Trained
                  </label>
                </div>

                {/* Garda Vetted */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gardaVetted"
                    name="gardaVetted"
                    checked={formData.gardaVetted}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="gardaVetted" className="ml-3 block text-sm text-gray-700">
                    Garda Vetted
                  </label>
                </div>
                
                {/* ECC Level 5 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="eccLevel5"
                    name="eccLevel5"
                    checked={formData.eccLevel5}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="eccLevel5" className="ml-3 block text-sm text-gray-700">
                    ECCE Level 5+ Qualification
                  </label>
                </div>

                {/* Tusla Registered */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tuslaRegistered"
                    name="tuslaRegistered"
                    checked={formData.tuslaRegistered}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="tuslaRegistered" className="ml-3 block text-sm text-gray-700">
                    Tusla Registered
                  </label>
                </div>

                {/* Tusla Registration Number */}
                <div>
                  <label htmlFor="tuslaRegistrationNumber" className="mb-1 block text-sm font-medium text-gray-700">
                    Tusla Registration Number
                  </label>
                  <input
                    type="text"
                    id="tuslaRegistrationNumber"
                    name="tuslaRegistrationNumber"
                    value={formData.tuslaRegistrationNumber}
                    onChange={handleChange}
                    className={inputWithIconClass}
                    placeholder="e.g. 12345678"
                  />
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