#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files that need to be fixed - add to this list as needed
const FILES_TO_FIX = [
  'src/app/subscription/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/parent/messages/page.tsx',
  'src/app/dashboard/parent/find-childminders/page.tsx',
  'src/app/dashboard/parent/bookings/new/page.tsx',
  'src/app/dashboard/admin/documents/page.tsx',
  'src/app/dashboard/admin/subscriptions/page.tsx',
  'src/app/dashboard/admin/support/page.tsx',
  'src/app/dashboard/admin/messages/page.tsx',
  'src/app/dashboard/admin/messages/search/page.tsx',
  'src/app/dashboard/childminder/messages/page.tsx',
];

// The fix process:
// 1. Add Suspense import and useSafeSearchParams import
// 2. Replace direct useSearchParams() call with useSafeSearchParams()
// 3. Add SearchParamsListener to the JSX
// 4. Wrap the component with Suspense
async function fixFile(filePath) {
  try {
    console.log(`Fixing ${filePath}...`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Check if we're already using the safe version
    if (content.includes('useSafeSearchParams')) {
      console.log(`File ${filePath} already using useSafeSearchParams. Skipping.`);
      return;
    }
    
    // 2. Check if we're importing useSearchParams
    if (!content.includes('useSearchParams')) {
      console.log(`File ${filePath} does not use useSearchParams. Skipping.`);
      return;
    }
    
    // 3. Replace the import statement
    content = content.replace(
      /import\s+\{([^}]*?)useSearchParams([^}]*?)\}\s+from\s+['"]next\/navigation['"]/g,
      (match, before, after) => {
        return `import {${before}${after}} from 'next/navigation'`;
      }
    );
    
    // 4. Add the necessary imports
    let importStatements = '';
    
    // Add Suspense if not already imported
    if (!content.includes('Suspense')) {
      if (content.includes('import React')) {
        content = content.replace(/import React(, \{[^}]*\})?/, (match) => {
          if (match.includes('{')) {
            return match.replace('{', '{ Suspense, ');
          }
          return 'import React, { Suspense }';
        });
      } else if (content.includes('import {')) {
        const importRegex = /import\s+\{([^}]*)\}\s+from\s+['"]react['"]/;
        const importMatch = content.match(importRegex);
        
        if (importMatch) {
          content = content.replace(importRegex, `import { Suspense, ${importMatch[1]} } from 'react'`);
        } else {
          importStatements += "import { Suspense } from 'react';\n";
        }
      } else {
        importStatements += "import { Suspense } from 'react';\n";
      }
    }
    
    // Add useSafeSearchParams import
    importStatements += "import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';\n";
    
    // Add imports after the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    let lastImportEndIndex = content.indexOf('\n', lastImportIndex);
    
    if (lastImportEndIndex !== -1) {
      content = content.slice(0, lastImportEndIndex + 1) + importStatements + content.slice(lastImportEndIndex + 1);
    }
    
    // 5. Replace the direct useSearchParams call
    content = content.replace(
      /const\s+searchParams\s*=\s*useSearchParams\(\);/g,
      'const { searchParams, SearchParamsListener } = useSafeSearchParams();'
    );
    
    // 6. Identify the main component(s) in the file
    const componentMatch = content.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
    if (!componentMatch) {
      console.log(`Could not identify main component in ${filePath}. Manual fix needed.`);
      return;
    }
    
    const componentName = componentMatch[1];
    
    // 7. Create a content component for the Suspense wrapper
    const contentComponentName = `${componentName}Content`;
    
    // 8. Rename the main component function to the content component
    content = content.replace(
      new RegExp(`export\\s+default\\s+function\\s+${componentName}`),
      `function ${contentComponentName}`
    );
    
    // 9. Add SearchParamsListener to the JSX
    content = content.replace(
      /(return\s*\(\s*<div)/,
      'return (\n    <div>\n      <SearchParamsListener />'
    );
    
    // 10. Add the new main component with Suspense
    const suspenseWrapper = `
export default function ${componentName}() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>}>
      <${contentComponentName} />
    </Suspense>
  );
}`;
    
    content += suspenseWrapper;
    
    // Write the changes back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

// Main function
async function main() {
  console.log('Starting useSearchParams fix script...');
  
  for (const file of FILES_TO_FIX) {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      await fixFile(fullPath);
    } else {
      console.warn(`File not found: ${fullPath}`);
    }
  }
  
  console.log('Done! Fixed all specified files.');
  console.log('Please manually check the changes and build the app to ensure all errors are fixed.');
}

main().catch(console.error); 