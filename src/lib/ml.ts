// Machine Learning Utility Functions for Childminder Recommendations

export type ChildminderProfile = {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  rate?: number | null;
  yearsOfExperience?: number | null;
  ageGroupsServed?: string[] | null;
  languagesSpoken?: string[] | null;
  specialNeedsExp?: boolean | null;
  firstAidCert?: boolean | null;
  gardaVetted?: boolean | null;
  tuslaRegistered?: boolean | null;
  reviewRatings?: number[] | null;
  bookingHistory?: BookingHistory[] | null;
};

export type BookingHistory = {
  childminderId: string;
  startTime: Date;
  endTime: Date;
  status: string;
};

export type ParentProfile = {
  id: string;
  location?: string | null;
  children?: { age: number }[] | null;
  bookingHistory?: BookingHistory[] | null;
};

/**
 * Calculate the similarity score between a parent and a childminder
 */
export function calculateSimilarityScore(
  parent: ParentProfile,
  childminder: ChildminderProfile,
  bookings: BookingHistory[]
): number {
  let score = 0;

  // Location similarity (postal code matching gets a high score)
  if (parent.location && childminder.location) {
    // Extract postal code or first part of location
    const parentLocation = parent.location.split(',')[0].trim().toLowerCase();
    const childminderLocation = childminder.location.split(',')[0].trim().toLowerCase();
    
    if (parentLocation === childminderLocation) {
      score += 20; // High score for exact location match
    } else if (childminder.location.toLowerCase().includes(parentLocation)) {
      score += 10; // Lower score for partial match
    }
  }

  // Age group matching
  if (parent.children && childminder.ageGroupsServed) {
    const childAgeGroups = parent.children.map(child => {
      if (child.age <= 1) return 'infant';
      else if (child.age <= 4) return 'toddler';
      else if (child.age <= 8) return 'preschool';
      else if (child.age <= 12) return 'schoolAge';
      else return 'teenager';
    });
    
    const uniqueAgeGroups = [...new Set(childAgeGroups)];
    const matchingAgeGroups = uniqueAgeGroups.filter(ageGroup => 
      childminder.ageGroupsServed?.includes(ageGroup)
    );
    
    score += matchingAgeGroups.length * 10; // 10 points per matching age group
  }

  // Experience score
  if (childminder.yearsOfExperience) {
    // Up to 15 points for experience
    score += Math.min(childminder.yearsOfExperience, 15);
  }

  // Certification score
  if (childminder.firstAidCert) score += 5;
  if (childminder.gardaVetted) score += 10;
  if (childminder.tuslaRegistered) score += 10;

  // Booking history analysis
  if (bookings && bookings.length > 0) {
    // Find past successful bookings with this childminder
    const pastBookingsWithThisChildminder = bookings.filter(
      booking => booking.childminderId === childminder.id && booking.status === 'COMPLETED'
    );
    
    // Significant boost for childminders the parent has used before successfully
    score += pastBookingsWithThisChildminder.length * 15;
  }

  // Rating score
  if (childminder.reviewRatings && childminder.reviewRatings.length > 0) {
    const averageRating = childminder.reviewRatings.reduce((sum, rating) => sum + rating, 0) / 
      childminder.reviewRatings.length;
    
    // Up to 25 points for average rating (5 * 5)
    score += averageRating * 5;
  }

  return score;
}

/**
 * Calculate collaborative filtering recommendations
 * Based on what similar parents have booked
 */
export function getCollaborativeRecommendations(
  parentId: string,
  allParents: ParentProfile[],
  allChildminders: ChildminderProfile[],
  allBookings: BookingHistory[]
): string[] {
  // Get the current parent's bookings
  const parentBookings = allBookings.filter(booking => 
    booking.childminderId === parentId
  );
  
  // Find childminders the parent has already booked
  const parentChildminderIds = new Set(
    parentBookings.map(booking => booking.childminderId)
  );
  
  // Find similar parents (those who have booked at least one common childminder)
  const similarParents = allParents.filter(otherParent => {
    if (otherParent.id === parentId) return false; // Skip the current parent
    
    const otherParentBookings = allBookings.filter(booking => 
      booking.childminderId === otherParent.id
    );
    
    const otherParentChildminderIds = new Set(
      otherParentBookings.map(booking => booking.childminderId)
    );
    
    // Check if there's any overlap in childminders
    for (const childminderId of parentChildminderIds) {
      if (otherParentChildminderIds.has(childminderId)) {
        return true; // Found at least one common childminder
      }
    }
    
    return false;
  });
  
  // Find childminders booked by similar parents that the current parent hasn't booked
  const recommendedChildminderIds = new Set<string>();
  
  for (const similarParent of similarParents) {
    const similarParentBookings = allBookings.filter(booking => 
      booking.childminderId === similarParent.id && booking.status === 'COMPLETED'
    );
    
    for (const booking of similarParentBookings) {
      if (!parentChildminderIds.has(booking.childminderId)) {
        recommendedChildminderIds.add(booking.childminderId);
      }
    }
  }
  
  return Array.from(recommendedChildminderIds);
}

/**
 * Content-based filtering for childminder recommendations
 */
export function filterChildmindersByPreferences(
  parent: ParentProfile,
  childminders: ChildminderProfile[],
  bookings: BookingHistory[]
): ChildminderProfile[] {
  // Calculate similarity scores for each childminder
  const scoredChildminders = childminders.map(childminder => ({
    childminder,
    score: calculateSimilarityScore(parent, childminder, bookings)
  }));
  
  // Sort by score in descending order
  scoredChildminders.sort((a, b) => b.score - a.score);
  
  // Return the childminders in order of relevance
  return scoredChildminders.map(item => item.childminder);
}

/**
 * Generate explanations for why a childminder is recommended
 */
export function generateRecommendationExplanation(
  parent: ParentProfile,
  childminder: ChildminderProfile,
  bookings: BookingHistory[]
): string[] {
  const reasons: string[] = [];
  
  // Location-based reason
  if (parent.location && childminder.location) {
    const parentLocation = parent.location.split(',')[0].trim().toLowerCase();
    const childminderLocation = childminder.location.split(',')[0].trim().toLowerCase();
    
    if (parentLocation === childminderLocation) {
      reasons.push('Located in your area');
    }
  }
  
  // Age group matching reason
  if (parent.children && childminder.ageGroupsServed) {
    const childAgeGroups = parent.children.map(child => {
      if (child.age <= 1) return 'infant';
      else if (child.age <= 4) return 'toddler';
      else if (child.age <= 8) return 'preschool';
      else if (child.age <= 12) return 'schoolAge';
      else return 'teenager';
    });
    
    const uniqueAgeGroups = [...new Set(childAgeGroups)];
    const matchingAgeGroups = uniqueAgeGroups.filter(ageGroup => 
      childminder.ageGroupsServed?.includes(ageGroup)
    );
    
    if (matchingAgeGroups.length > 0) {
      reasons.push('Experienced with your children\'s age groups');
    }
  }
  
  // Experience reason
  if (childminder.yearsOfExperience && childminder.yearsOfExperience > 5) {
    reasons.push(`${childminder.yearsOfExperience} years of experience`);
  }
  
  // Certification reasons
  const certifications = [];
  if (childminder.firstAidCert) certifications.push('First Aid certified');
  if (childminder.gardaVetted) certifications.push('Garda vetted');
  if (childminder.tuslaRegistered) certifications.push('Tusla registered');
  
  if (certifications.length > 0) {
    reasons.push(`Holds important certifications: ${certifications.join(', ')}`);
  }
  
  // Previous booking reason
  if (bookings && bookings.length > 0) {
    const pastBookingsWithThisChildminder = bookings.filter(
      booking => booking.childminderId === childminder.id && booking.status === 'COMPLETED'
    );
    
    if (pastBookingsWithThisChildminder.length > 0) {
      reasons.push('You\'ve successfully booked with them before');
    }
  }
  
  // Rating reason
  if (childminder.reviewRatings && childminder.reviewRatings.length > 0) {
    const averageRating = childminder.reviewRatings.reduce((sum, rating) => sum + rating, 0) / 
      childminder.reviewRatings.length;
    
    if (averageRating >= 4.5) {
      reasons.push('Highly rated by other parents');
    } else if (averageRating >= 4.0) {
      reasons.push('Well rated by other parents');
    }
  }
  
  return reasons;
} 