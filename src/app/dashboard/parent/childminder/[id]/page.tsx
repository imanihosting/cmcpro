"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaCalendarAlt, 
  FaClock, 
  FaCheck, 
  FaHeart, 
  FaRegHeart,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa';

// Days of week for availability display
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// Childminder type definition
interface Childminder {
  id: string;
  name: string;
  bio: string | null;
  image: string | null;
  location: string | null;
  address?: {
    streetAddress: string;
    city: string;
    county: string;
    eircode: string | null;
    formatted: string;
  } | null;
  contact: {
    email: string;
    phoneNumber: string | null;
  };
  rate: number | null;
  yearsOfExperience: number | null;
  ageGroupsServed: string[] | null;
  languagesSpoken: string[] | null;
  careTypes: string[] | null;
  qualifications: string | null;
  otherQualifications: string | null;
  educationLevel: string | null;
  specialties: string | null;
  maxChildrenCapacity: number | null;
  memberSince: string;
  certifications: {
    firstAidCert: boolean | null;
    childrenFirstCert: boolean | null;
    gardaVetted: boolean | null;
    tuslaRegistered: boolean | null;
  };
  specialNeedsExp: boolean | null;
  mealsProvided: boolean | null;
  pickupDropoff: boolean | null;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }> | null;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
  averageRating: number;
  reviewCount: number;
  isFavorite: boolean;
  profileImage?: string;
}

// Review component
const Review = ({ review }: { review: Childminder['reviews'][0] }) => (
  <div className="mb-4 border-b border-gray-200 pb-4 last:border-0">
    <div className="mb-2 flex items-center">
      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
        {review.reviewer.image ? (
          <Image 
            src={review.reviewer.image} 
            alt={review.reviewer.name || 'Reviewer'} 
            width={32} 
            height={32} 
            className="h-full w-full object-cover"
            unoptimized={!!review.reviewer.image && !review.reviewer.image.startsWith('/')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              
              // Show first letter fallback
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = "flex h-full w-full items-center justify-center text-gray-500";
                fallback.innerText = review.reviewer.name?.charAt(0) || 'U';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            {review.reviewer.name?.charAt(0) || 'U'}
          </div>
        )}
      </div>
      <div className="ml-2">
        <p className="text-sm font-medium text-gray-900">{review.reviewer.name || 'Anonymous Parent'}</p>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <FaStar 
              key={i} 
              className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
            />
          ))}
          <span className="ml-1 text-xs text-gray-500">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
    {review.comment && (
      <p className="text-sm text-gray-600">{review.comment}</p>
    )}
  </div>
);

// Mock data for development or if API fails
const mockChildminder: Childminder = {
  id: "mock-id",
  name: "Sarah Johnson",
  bio: "Experienced childminder with 7 years of experience caring for children of all ages. I provide a safe, nurturing environment where children can learn and grow.",
  image: "https://randomuser.me/api/portraits/women/68.jpg",
  location: "Dublin, Ireland",
  address: {
    streetAddress: "123 Main St",
    city: "Dublin",
    county: "Dublin",
    eircode: "D01 ABCD",
    formatted: "Dublin, Dublin"
  },
  contact: {
    email: "sarah.johnson@example.com",
    phoneNumber: "+353 1 234 5678"
  },
  rate: 18.50,
  yearsOfExperience: 7,
  ageGroupsServed: ["Infant", "Toddler", "Preschool", "School-age"],
  languagesSpoken: ["English", "French"],
  careTypes: ["Full-time", "Part-time", "Before/After School", "Weekend"],
  qualifications: "Degree in Early Childhood Education",
  otherQualifications: "Montessori Teaching Certificate",
  educationLevel: "Bachelor's Degree",
  specialties: "Special needs care, STEM activities, Arts and crafts",
  maxChildrenCapacity: 4,
  memberSince: "2020-01-15T00:00:00.000Z",
  certifications: {
    firstAidCert: true,
    childrenFirstCert: true,
    gardaVetted: true,
    tuslaRegistered: true
  },
  specialNeedsExp: true,
  mealsProvided: true,
  pickupDropoff: true,
  availability: [
    { dayOfWeek: 1, startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: 2, startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: 3, startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: 4, startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: 5, startTime: "08:00", endTime: "17:00" }
  ],
  reviews: [
    {
      id: "review-1",
      rating: 5,
      comment: "Sarah is amazing with our daughter. Highly recommended!",
      createdAt: "2023-05-10T10:30:00.000Z",
      reviewer: {
        id: "parent-1",
        name: "Emma Wilson",
        image: "https://randomuser.me/api/portraits/women/45.jpg"
      }
    },
    {
      id: "review-2",
      rating: 4,
      comment: "Very reliable and my son loves going there.",
      createdAt: "2023-04-15T14:20:00.000Z",
      reviewer: {
        id: "parent-2",
        name: "Michael Brown",
        image: null
      }
    }
  ],
  averageRating: 4.5,
  reviewCount: 2,
  isFavorite: false
};

// Helper function to ensure image URL is valid and properly formatted
const getValidImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return url;
};

export default function ChildminderProfilePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [childminder, setChildminder] = useState<Childminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Fetch childminder data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/dashboard/parent/childminder/${params.id}`)}`);
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "parent") {
      router.push("/dashboard");
      return;
    }

    const fetchChildminder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/childminders/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch childminder details: ${response.status}`);
        }
        
        const apiData = await response.json();
        console.log('Childminder API data received:', apiData); // Log the data for debugging
        
        if (!apiData || !apiData.id) {
          throw new Error('Invalid childminder data received');
        }
        
        // Map API data to our Childminder interface
        const mappedData: Childminder = {
          id: apiData.id,
          name: apiData.name || 'Unnamed Childminder',
          bio: apiData.bio,
          image: apiData.image || apiData.profileImage,
          location: apiData.location,
          address: apiData.address || null,
          contact: {
            email: apiData.contact?.email || apiData.email,
            phoneNumber: apiData.contact?.phoneNumber || apiData.phoneNumber
          },
          rate: apiData.rate ? Number(apiData.rate) : null,
          yearsOfExperience: apiData.yearsOfExperience,
          ageGroupsServed: Array.isArray(apiData.ageGroupsServed) ? apiData.ageGroupsServed : [],
          languagesSpoken: Array.isArray(apiData.languagesSpoken) ? apiData.languagesSpoken : [],
          careTypes: Array.isArray(apiData.careTypes) ? apiData.careTypes : [],
          qualifications: apiData.qualifications,
          otherQualifications: apiData.otherQualifications,
          educationLevel: apiData.educationLevel,
          specialties: apiData.specialties,
          maxChildrenCapacity: apiData.maxChildrenCapacity,
          memberSince: apiData.memberSince || apiData.createdAt,
          certifications: {
            firstAidCert: Boolean(apiData.certifications?.firstAidCert || apiData.firstAidCert),
            childrenFirstCert: Boolean(apiData.certifications?.childrenFirstCert || apiData.childrenFirstCert),
            gardaVetted: Boolean(apiData.certifications?.gardaVetted || apiData.gardaVetted),
            tuslaRegistered: Boolean(apiData.certifications?.tuslaRegistered || apiData.tuslaRegistered)
          },
          specialNeedsExp: Boolean(apiData.specialNeedsExp),
          mealsProvided: Boolean(apiData.mealsProvided),
          pickupDropoff: Boolean(apiData.pickupDropoff),
          availability: Array.isArray(apiData.availability) 
            ? apiData.availability 
            : (Array.isArray(apiData.RecurringAvailability) ? apiData.RecurringAvailability : []),
          reviews: Array.isArray(apiData.reviews) 
            ? apiData.reviews.map((r: any) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                reviewer: {
                  id: r.reviewer?.id || r.User_Review_reviewerIdToUser?.id || 'unknown',
                  name: r.reviewer?.name || r.User_Review_reviewerIdToUser?.name,
                  image: r.reviewer?.image || r.User_Review_reviewerIdToUser?.image
                }
              }))
            : [],
          averageRating: apiData.averageRating || 0,
          reviewCount: apiData.reviewCount || 0,
          isFavorite: Boolean(apiData.isFavorite)
        };
        
        console.log('Mapped childminder data:', mappedData);
        setChildminder(mappedData);
        setIsFavorite(Boolean(apiData.isFavorite));
      } catch (err) {
        console.error('Error fetching childminder:', err);
        setError('Could not load childminder information. Please try again.');
        
        // For development: use mock data if API fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock childminder data for development');
          setChildminder(mockChildminder);
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated" && params.id) {
      fetchChildminder();
    }
  }, [params.id, session, status, router]);

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!childminder || isTogglingFavorite) return;
    
    setIsTogglingFavorite(true);
    
    try {
      const response = await fetch(`/api/childminders/${childminder.id}/favorite`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }
      
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error updating favorite status:', err);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Format availability for display
  const formatAvailability = () => {
    if (!childminder?.availability || childminder.availability.length === 0) {
      return <p className="text-gray-500">No availability information provided</p>;
    }

    // Group by day of week
    const groupedByDay = childminder.availability.reduce((acc, slot) => {
      const day = DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || 'Unknown';
      if (!acc[day]) acc[day] = [];
      
      // Format time from 24h to 12h
      const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
      };
      
      acc[day].push({
        start: formatTime(slot.startTime),
        end: formatTime(slot.endTime)
      });
      
      return acc;
    }, {} as Record<string, { start: string; end: string }[]>);

    return (
      <div className="mt-2 space-y-2">
        {Object.entries(groupedByDay).map(([day, slots]) => (
          <div key={day} className="text-sm">
            <span className="font-medium">{day}:</span>
            <div className="ml-2 space-y-1">
              {slots.map((slot, i) => (
                <div key={i}>
                  {slot.start} - {slot.end}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error || !childminder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-sm text-red-700">
            {error || "Could not load childminder profile. Please try again later."}
          </p>
          <button
            onClick={() => router.push('/dashboard/parent/find-childminders')}
            className="mt-4 inline-flex items-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Find Childminders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and page title */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 flex h-10 w-10 items-center justify-center rounded-full text-violet-600 hover:bg-violet-50"
          aria-label="Go back"
        >
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Childminder Profile</h1>
      </div>

      {/* Profile header with basic info */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow">
        {/* Banner image */}
        <div className="relative h-40 w-full bg-violet-100 sm:h-60">
          {childminder.image ? (
            <Image
              src={childminder.image}
              alt={`${childminder.name}'s profile picture`}
              fill
              className="object-cover"
              priority
              unoptimized={!childminder.image.startsWith('/')}
              onError={(e) => {
                // Simply hide the image on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-violet-100">
              <span className="text-2xl font-bold text-violet-300">{childminder.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-white">{childminder.name}</h2>
              <button
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
                className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isTogglingFavorite ? (
                  <FaSpinner className="h-5 w-5 animate-spin" />
                ) : isFavorite ? (
                  <FaHeart className="h-5 w-5 text-red-500" />
                ) : (
                  <FaRegHeart className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-4">
            {/* Profile image */}
            <div className="flex-shrink-0">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-violet-100">
                {childminder.image ? (
                  <Image
                    src={childminder.image}
                    alt={`${childminder.name}'s profile`}
                    fill
                    className="object-cover"
                    unoptimized={!childminder.image.startsWith('/')}
                    onError={(e) => {
                      // Hide the image and show the fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      
                      // Make fallback visible
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = "flex h-full w-full items-center justify-center bg-violet-100 text-violet-600 text-lg font-bold";
                        fallback.innerText = childminder.name.charAt(0);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-600 text-lg font-bold">
                    {childminder.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Basic info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {(childminder.address?.formatted || childminder.location) && (
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1 h-4 w-4 text-gray-400" />
                    <span>{childminder.address?.formatted || childminder.location}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <div className="mr-1 flex">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(childminder.averageRating)
                            ? 'text-yellow-400'
                            : i < childminder.averageRating
                            ? 'text-yellow-300'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{childminder.averageRating.toFixed(1)} ({childminder.reviewCount} reviews)</span>
                </div>
                
                {childminder.rate !== null && (
                  <div>
                    <span className="font-medium">Rate:</span> €{Number(childminder.rate).toFixed(2)}/hr
                  </div>
                )}
                
                {childminder.yearsOfExperience !== null && (
                  <div>
                    <span className="font-medium">Experience:</span> {childminder.yearsOfExperience} {childminder.yearsOfExperience === 1 ? 'year' : 'years'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {childminder.bio && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">About</h3>
              <p className="mt-2 text-gray-600">{childminder.bio}</p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-6 flex space-x-4">
            <Link
              href={`/dashboard/parent/bookings/new?childminderId=${childminder.id}`}
              className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <FaCalendarAlt className="mr-2 h-4 w-4" />
              Book Now
            </Link>
            <Link
              href={`/dashboard/parent/messages/new?receiverId=${childminder.id}&receiverName=${encodeURIComponent(childminder.name)}`}
              className="inline-flex items-center rounded-md bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FaEnvelope className="mr-2 h-4 w-4" />
              Message
            </Link>
          </div>
        </div>
      </div>
      
      {/* Details section */}
      <div className="mb-8 grid gap-8 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-8">
          {/* Certifications section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Certifications & Features</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.certifications.firstAidCert ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.certifications.firstAidCert && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.certifications.firstAidCert ? 'text-gray-900' : 'text-gray-500'}>First Aid Certified</span>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.certifications.childrenFirstCert ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.certifications.childrenFirstCert && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.certifications.childrenFirstCert ? 'text-gray-900' : 'text-gray-500'}>Children First Certified</span>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.certifications.gardaVetted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.certifications.gardaVetted && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.certifications.gardaVetted ? 'text-gray-900' : 'text-gray-500'}>Garda Vetted</span>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.certifications.tuslaRegistered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.certifications.tuslaRegistered && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.certifications.tuslaRegistered ? 'text-gray-900' : 'text-gray-500'}>Tusla Registered</span>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.specialNeedsExp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.specialNeedsExp && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.specialNeedsExp ? 'text-gray-900' : 'text-gray-500'}>Special Needs Experience</span>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.mealsProvided ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.mealsProvided && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.mealsProvided ? 'text-gray-900' : 'text-gray-500'}>Meals Provided</span>
              </div>
              
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 rounded-full ${childminder.pickupDropoff ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {childminder.pickupDropoff && <FaCheck className="h-3 w-3" />}
                </div>
                <span className={childminder.pickupDropoff ? 'text-gray-900' : 'text-gray-500'}>Pickup & Dropoff Available</span>
              </div>
            </div>
          </div>
          
          {/* Contact information */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FaEnvelope className="mr-2 h-5 w-5 text-gray-400" />
                <span>{childminder.contact.email}</span>
              </div>
              
              {childminder.contact.phoneNumber && (
                <div className="flex items-center">
                  <FaPhone className="mr-2 h-5 w-5 text-gray-400" />
                  <span>{childminder.contact.phoneNumber}</span>
                </div>
              )}
              
              {childminder.address && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Address:</h4>
                  <div className="pl-2 space-y-1 text-gray-700">
                    <p>{childminder.address.streetAddress}</p>
                    <p>{childminder.address.city}</p>
                    <p>{childminder.address.county}</p>
                    {childminder.address.eircode && (
                      <p>Eircode: {childminder.address.eircode}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Children and age groups */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Age Groups & Capacity</h3>
            
            {childminder.ageGroupsServed && childminder.ageGroupsServed.length > 0 ? (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700">Age Groups Served:</h4>
                <div className="flex flex-wrap gap-2">
                  {childminder.ageGroupsServed.map((group, index) => (
                    <span key={index} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-4 text-gray-500">No age groups specified</p>
            )}
            
            {childminder.maxChildrenCapacity !== null && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">Maximum Children Capacity:</h4>
                <span className="text-gray-900">{childminder.maxChildrenCapacity} {childminder.maxChildrenCapacity === 1 ? 'child' : 'children'}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-8">
          {/* Availability section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-900">
              <FaCalendarAlt className="mr-2 h-5 w-5 text-gray-400" />
              Availability
            </h3>
            {formatAvailability()}
          </div>
          
          {/* Qualifications section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Qualifications & Skills</h3>
            
            {/* Education */}
            {childminder.educationLevel && (
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-medium text-gray-700">Education Level:</h4>
                <p className="text-gray-900">{childminder.educationLevel}</p>
              </div>
            )}
            
            {/* Qualifications */}
            {childminder.qualifications && (
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-medium text-gray-700">Qualifications:</h4>
                <p className="text-gray-900">{childminder.qualifications}</p>
              </div>
            )}
            
            {/* Other qualifications */}
            {childminder.otherQualifications && (
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-medium text-gray-700">Other Qualifications:</h4>
                <p className="text-gray-900">{childminder.otherQualifications}</p>
              </div>
            )}
            
            {/* Specialties */}
            {childminder.specialties && (
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-medium text-gray-700">Specialties:</h4>
                <p className="text-gray-900">{childminder.specialties}</p>
              </div>
            )}
            
            {/* Languages */}
            {childminder.languagesSpoken && childminder.languagesSpoken.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-medium text-gray-700">Languages Spoken:</h4>
                <p className="text-gray-900">{childminder.languagesSpoken.join(', ')}</p>
              </div>
            )}
            
            {/* Care types */}
            {childminder.careTypes && childminder.careTypes.length > 0 && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-700">Care Types:</h4>
                <div className="flex flex-wrap gap-2">
                  {childminder.careTypes.map((type, index) => (
                    <span key={index} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Reviews section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Reviews ({childminder.reviewCount})
            </h3>
            
            {childminder.reviews.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {childminder.reviews.map(review => (
                  <Review key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with member since info */}
      <div className="text-center text-sm text-gray-500">
        Member since {new Date(childminder.memberSince).toLocaleDateString()}
      </div>
    </div>
  );
} 