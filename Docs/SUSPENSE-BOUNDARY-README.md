# Fixing useSearchParams() Suspense Boundary Errors

When building the application for production, you might encounter the following error:

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/path/page". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
```

This error occurs because `useSearchParams()` from Next.js requires a Suspense boundary in order to be used during static generation.

## Solution

We've created a custom hook and components that safely wrap the `useSearchParams` hook in a Suspense boundary to fix this issue.

### 1. The Custom Hook and Components

The solution is implemented in `src/hooks/useSafeSearchParams.tsx`:

- `useSafeSearchParams()` - A hook that safely wraps useSearchParams in a Suspense boundary
- `WithSearchParams` - A component for simpler use cases

### 2. How to Fix Your Components

#### Option 1: Using the Hook in a Page Component

```tsx
import { Suspense } from 'react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

// Inner content component that uses searchParams
function MyPageContent() {
  const { searchParams, SearchParamsListener } = useSafeSearchParams();
  
  // Use searchParams here, always checking if it's null first
  
  return (
    <div>
      <SearchParamsListener /> {/* Add this component at the top of your JSX */}
      {/* Rest of your component */}
    </div>
  );
}

// Wrap your page export with Suspense
export default function MyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyPageContent />
    </Suspense>
  );
}
```

#### Option 2: Using the WithSearchParams Component

For simpler cases, you can use the WithSearchParams component:

```tsx
import { WithSearchParams } from '@/hooks/useSafeSearchParams';

export default function MyComponent() {
  return (
    <WithSearchParams>
      {({ searchParams }) => (
        <div>
          {searchParams?.get('param')}
          {/* Rest of your component */}
        </div>
      )}
    </WithSearchParams>
  );
}
```

### 3. Important Notes

- Always check if searchParams is null before using it
- The searchParams are only available after the component is mounted
- Use the SearchParamsListener component at the top of your JSX
- Always wrap your page with Suspense to handle the loading state

### 4. Running the Fix Helper

We've included a script to help identify all files that need to be updated:

```bash
npm run fix-search-params
```

This will output a list of files that need to be fixed.

### 5. References

- [Next.js Documentation: useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js Error: missing-suspense-with-csr-bailout](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) 