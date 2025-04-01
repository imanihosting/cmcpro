# Childminder Connect AI Recommendation Engine

This document explains the implementation of the AI-powered recommendation engine in Childminder Connect. The system uses content-based filtering and collaborative filtering techniques to suggest the most suitable childminders to parents.

## Overview

The recommendation engine analyzes several data points to generate personalized childminder suggestions:

1. **Parent preferences**: Children's age groups, location, and special needs
2. **Booking history**: Past successful bookings and patterns
3. **Childminder attributes**: Certifications, experience, ratings, and availability
4. **User behavior**: Click-through rates on recommendations

## Technical Implementation

The recommendation system is built using the following components:

### 1. Machine Learning Library (`src/lib/ml.ts`)

Contains the core algorithms for generating recommendations:

- `calculateSimilarityScore()`: Computes a similarity score between a parent and childminder
- `filterChildmindersByPreferences()`: Content-based filtering algorithm
- `getCollaborativeRecommendations()`: Collaborative filtering algorithm
- `generateRecommendationExplanation()`: Creates human-readable explanations for recommendations

### 2. Database Schema

The recommendation data is stored in a dedicated `Recommendation` table with the following structure:

- `id`: Unique identifier
- `parentId`: Parent user ID
- `childminderId`: Childminder user ID
- `score`: Match score (0-100)
- `reasons`: Array of reasons explaining the recommendation
- `isCollaborative`: Whether this recommendation came from collaborative filtering
- `isViewed`: Whether the parent has viewed this recommendation
- `isClicked`: Whether the parent clicked on this recommendation
- Timestamps and relationships to User model

### 3. API Endpoints

Two main API endpoints handle recommendation functionality:

#### `/api/recommendations`

- **GET**: Retrieves personalized recommendations for the authenticated parent
- Checks for recent recommendations (within 24 hours) before generating new ones
- Returns recommendations with childminder details, match scores, and explanations

#### `/api/recommendations/click`

- **POST**: Tracks when a parent clicks on a recommendation
- Updates the `isClicked` flag in the database
- Used for improving recommendation quality over time

### 4. Front-end Component

The `AIRecommendations` React component (`src/components/dashboard/parent/AIRecommendations.tsx`) displays the recommendations on the parent dashboard with:

- Childminder profile information
- Match score percentage
- Reasons why each childminder is recommended
- Visual indicators for new recommendations

## Recommendation Algorithm

The recommendation algorithm works as follows:

### Content-Based Filtering

1. **Location matching**: Parents are matched with childminders in the same area (high weight)
2. **Age group matching**: Children's ages are mapped to age groups and matched with childminder expertise
3. **Certification score**: Childminders with more certifications (First Aid, Garda vetted, etc.) score higher
4. **Experience score**: More experienced childminders receive higher scores
5. **Rating score**: Higher-rated childminders are prioritized

### Collaborative Filtering

1. **Similar parent identification**: Find parents who have booked similar childminders
2. **Recommendation generation**: Suggest childminders that similar parents have used successfully
3. **Integration**: Combine with content-based recommendations for best results

## Explainability

Each recommendation includes human-readable explanations for why a childminder was recommended, such as:

- "Located in your area"
- "Experienced with your children's age groups"
- "10 years of experience"
- "Holds important certifications: First Aid certified, Garda vetted"
- "Highly rated by other parents"
- "You've successfully booked with them before"

## Future Improvements

The recommendation engine can be enhanced with:

1. **Deeper learning models**: Implement more sophisticated ML models like neural networks
2. **Real-time updates**: Update recommendations based on availability changes
3. **Personalization tuning**: Allow parents to provide feedback on recommendations
4. **Time-aware recommendations**: Factor in time of day/week preferences
5. **Price sensitivity modeling**: Include parent budget preferences in the matching algorithm 