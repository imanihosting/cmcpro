'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Sparkles, MapPin, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface Recommendation {
  id: string;
  childminder: {
    id: string;
    name: string;
    bio: string | null;
    image: string | null;
    location: string | null;
    rate: number | null;
    yearsOfExperience: number | null;
    ageGroupsServed: string[] | null;
    certifications: {
      firstAidCert: boolean | null;
      childrenFirstCert: boolean | null;
      gardaVetted: boolean | null;
      tuslaRegistered: boolean | null;
    };
    specialNeedsExp: boolean | null;
    availability: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    averageRating: number;
    reviewCount: number;
  };
  score: number;
  reasons: string[];
  isCollaborative: boolean;
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFresh, setIsFresh] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/recommendations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        setRecommendations(data.data);
        setIsFresh(data.fresh);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Unable to load recommendations at this time');
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);

  const trackRecommendationClick = async (recommendationId: string) => {
    try {
      await fetch('/api/recommendations/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendationId }),
      });
    } catch (err) {
      console.error('Error tracking recommendation click:', err);
    }
  };

  const handleRecommendationClick = (recommendationId: string, childminderId: string) => {
    trackRecommendationClick(recommendationId);
    router.push(`/dashboard/parent/childminders/${childminderId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
          <Sparkles className="mr-3 text-blue-500" size={24} />
          AI-Powered Recommendations
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
          <Sparkles className="mr-3 text-blue-500" size={24} />
          AI-Powered Recommendations
        </h2>
        <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
          <Sparkles className="mr-3 text-blue-500" size={24} />
          AI-Powered Recommendations
        </h2>
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <Info className="text-gray-400 mb-3" size={28} />
          <p className="text-gray-700 text-center font-medium">
            No recommendations available yet. Add more details to your profile or book with childminders to get personalized recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center text-gray-800">
          <Sparkles className="mr-3 text-blue-500" size={24} />
          AI-Powered Recommendations
        </h2>
        {isFresh && (
          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
            Fresh recommendations
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white"
            onClick={() => handleRecommendationClick(recommendation.id, recommendation.childminder.id)}
          >
            <div className="relative bg-gray-100 h-48">
              {recommendation.childminder.image ? (
                <Image
                  src={recommendation.childminder.image}
                  alt={`${recommendation.childminder.name}'s profile`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-gray-400 text-5xl">👤</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Match: {Math.round(recommendation.score)}%
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-xl text-gray-800 mb-2">{recommendation.childminder.name}</h3>
              
              {recommendation.childminder.location && (
                <div className="flex items-center text-gray-700 text-sm mb-3">
                  <MapPin size={16} className="mr-1.5 flex-shrink-0" />
                  <span>{recommendation.childminder.location}</span>
                </div>
              )}
              
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.round(recommendation.childminder.averageRating) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-300'
                    }
                  />
                ))}
                <span className="ml-2 text-sm text-gray-700 font-medium">
                  ({recommendation.childminder.reviewCount})
                </span>
              </div>
              
              {recommendation.childminder.rate && (
                <div className="mb-3 text-base font-bold text-gray-800">
                  €{recommendation.childminder.rate}/hour
                </div>
              )}
              
              <div className="mt-4 space-y-2 border-t pt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Why recommended:</p>
                {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                  <div key={idx} className="flex items-start text-sm">
                    <CheckCircle size={16} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{reason}</span>
                  </div>
                ))}
                {recommendation.reasons.length > 2 && (
                  <div className="text-sm text-blue-600 font-medium mt-1">
                    +{recommendation.reasons.length - 2} more reasons
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 