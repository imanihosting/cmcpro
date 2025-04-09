import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaCheck, FaMapMarkerAlt, FaEuroSign, FaCalendarAlt, FaThumbsUp } from 'react-icons/fa';
import { Childminder, DAYS_OF_WEEK } from '../types';

interface ChildminderCardProps {
  childminder: Childminder;
  isRecommended?: boolean;
}

export default function ChildminderCard({ childminder, isRecommended = false }: ChildminderCardProps) {
  // Format the childminder's rate for display
  const formatRate = (rate: number | null) => {
    if (rate === null || rate === undefined) return 'Rate not specified';
    
    // Ensure rate is a number before calling toFixed
    const rateNumber = typeof rate === 'number' ? rate : parseFloat(String(rate));
    
    // Check if conversion resulted in a valid number
    if (isNaN(rateNumber)) return 'Rate not specified';
    
    return `€${rateNumber.toFixed(2)}/hr`;
  };

  // Format the childminder's availability for display
  const formatAvailability = () => {
    if (!childminder.availability || childminder.availability.length === 0) {
      return 'Availability not specified';
    }

    const days = new Set(childminder.availability.map(a => a.dayOfWeek));
    
    if (days.size === 7) {
      return 'Available all days';
    }

    const dayLabels = Array.from(days)
      .sort()
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label.substring(0, 3))
      .join(', ');

    return `Available: ${dayLabels}`;
  };

  // Get languages spoken as a string
  const getLanguages = () => {
    if (!childminder.languagesSpoken || childminder.languagesSpoken.length === 0) {
      return 'Not specified';
    }
    return childminder.languagesSpoken.join(', ');
  };

  // Get age groups served as a formatted string
  const getAgeGroups = () => {
    if (!childminder.ageGroupsServed || childminder.ageGroupsServed.length === 0) {
      return 'All ages';
    }

    return childminder.ageGroupsServed
      .map(group => group.charAt(0).toUpperCase() + group.slice(1))
      .join(', ');
  };

  return (
    <div className={`overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md ${isRecommended ? 'border-2 border-violet-400' : ''}`}>
      {isRecommended && (
        <div className="bg-violet-100 px-4 py-2 flex items-center">
          <FaThumbsUp className="mr-2 h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">Recommended Match</span>
        </div>
      )}
      
      <div className="p-4">
        {/* Header with image and basic info */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              {childminder.image ? (
                <Image
                  src={childminder.image}
                  alt={childminder.name || 'Childminder'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-violet-100 text-violet-600">
                  {childminder.name?.charAt(0) || 'C'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {childminder.name || 'Childminder'}
            </h3>
            
            {/* Location */}
            {childminder.location && (
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <FaMapMarkerAlt className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate">{childminder.location}</span>
              </div>
            )}
            
            {/* Rating */}
            <div className="mt-1 flex items-center">
              <div className="flex items-center">
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
              <span className="ml-2 text-sm text-gray-600">
                {childminder.averageRating.toFixed(1)} ({childminder.reviewCount} reviews)
              </span>
            </div>
            
            {/* Rate */}
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <FaEuroSign className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span>{formatRate(childminder.rate)}</span>
            </div>
            
            {/* Availability */}
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <FaCalendarAlt className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span>{formatAvailability()}</span>
            </div>
          </div>
        </div>
        
        {/* Bio section */}
        {childminder.bio && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 line-clamp-3">{childminder.bio}</p>
          </div>
        )}
        
        {/* Additional info section */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Experience:</span>{' '}
            <span className="text-gray-600">
              {childminder.yearsOfExperience ? `${childminder.yearsOfExperience} years` : 'Not specified'}
            </span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Age Groups:</span>{' '}
            <span className="text-gray-600">{getAgeGroups()}</span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Languages:</span>{' '}
            <span className="text-gray-600">{getLanguages()}</span>
          </div>
        </div>
        
        {/* Certifications and features */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {childminder.certifications.firstAidCert && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <FaCheck className="mr-1 h-3 w-3" /> First Aid
              </span>
            )}
            
            {childminder.certifications.childrenFirstCert && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <FaCheck className="mr-1 h-3 w-3" /> Children First
              </span>
            )}
            
            {childminder.certifications.gardaVetted && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <FaCheck className="mr-1 h-3 w-3" /> Garda Vetted
              </span>
            )}
            
            {childminder.certifications.tuslaRegistered && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <FaCheck className="mr-1 h-3 w-3" /> Tusla Registered
              </span>
            )}
            
            {childminder.specialNeedsExp && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Special Needs Exp
              </span>
            )}
            
            {childminder.mealsProvided && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Meals Provided
              </span>
            )}
            
            {childminder.pickupDropoff && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Pickup/Dropoff
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action section */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex justify-between">
          <Link 
            href={`/dashboard/parent/childminder/${childminder.id}`}
            className="text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            View Profile
          </Link>
          
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/parent/messages/new?receiverId=${childminder.id}&receiverName=${encodeURIComponent(childminder.name || 'Childminder')}`}
              className="rounded bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
            >
              Message
            </Link>
            <Link
              href={`/dashboard/parent/bookings/new?childminderId=${childminder.id}`}
              className="rounded bg-violet-600 px-3 py-1 text-sm font-medium text-white hover:bg-violet-700"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 