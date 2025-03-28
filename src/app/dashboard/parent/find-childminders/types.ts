// Types for the childminder search feature

export interface Reviewer {
  id: string;
  name: string;
  image: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer: Reviewer;
}

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Certifications {
  firstAidCert: boolean | null;
  childrenFirstCert: boolean | null;
  gardaVetted: boolean | null;
  tuslaRegistered: boolean | null;
}

export interface Childminder {
  id: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  location: string | null;
  rate: number | null;
  yearsOfExperience: number | null;
  ageGroupsServed: string[] | null;
  languagesSpoken: string[] | null;
  certifications: Certifications;
  specialNeedsExp: boolean | null;
  mealsProvided: boolean | null;
  pickupDropoff: boolean | null;
  availability: Availability[];
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SearchResponse {
  data: Childminder[];
  pagination: Pagination;
}

export interface SearchFilters {
  location?: string;
  dayOfWeek?: number;
  minRating?: number;
  ageGroup?: string;
  minRate?: number;
  maxRate?: number;
  minExperience?: number;
  language?: string;
  firstAidCert?: boolean;
  childrenFirstCert?: boolean;
  gardaVetted?: boolean;
  tuslaRegistered?: boolean;
  specialNeedsExp?: boolean;
  mealsProvided?: boolean;
  pickupDropoff?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Age groups that childminders can serve
export const AGE_GROUPS = [
  'infant',        // 0-12 months
  'toddler',       // 1-3 years
  'preschool',     // 3-5 years
  'school-age',    // 5-12 years
  'adolescent'     // 13-18 years
];

// Languages commonly spoken
export const LANGUAGES = [
  'English',
  'Irish',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Polish',
  'Chinese',
  'Arabic',
  'Romanian',
  'Portuguese',
  'Lithuanian',
  'Russian'
];

// Days of the week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

// Rating options
export const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 3, label: '3+ stars' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
  { value: 5, label: '5 stars only' }
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Most recent' },
  { value: 'rate', label: 'Price: Low to High', order: 'asc' },
  { value: 'rate', label: 'Price: High to Low', order: 'desc' },
  { value: 'yearsOfExperience', label: 'Experience', order: 'desc' },
  { value: 'name', label: 'Name (A-Z)', order: 'asc' }
]; 