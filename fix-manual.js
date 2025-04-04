#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Specific files that need manual fixes
const FILES_TO_FIX = [
  'src/app/dashboard/admin/messages/page.tsx',
  'src/app/dashboard/admin/messages/search/page.tsx',
  'src/app/dashboard/admin/subscriptions/page.tsx',
  'src/app/dashboard/admin/support/page.tsx',
];

/**
 * This function manually fixes each file with a targeted approach
 */
async function fixFile(filePath) {
  try {
    console.log(`Fixing ${filePath}...`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the issue with SearchParamsListener by ensuring proper JSX structure
    if (content.includes('<SearchParamsListener />')) {
      // Extract the content between return statement and closing parenthesis
      const returnRegex = /return\s*\(\s*([\s\S]*?)\s*\);/g;
      
      content = content.replace(returnRegex, (match, innerContent) => {
        // If we find the problematic pattern where SearchParamsListener is misplaced
        if (innerContent.includes('<SearchParamsListener />') && !innerContent.includes('<SearchParamsListener />\n')) {
          // Create a properly structured JSX block
          const fixedInnerContent = innerContent
            .replace(/<div>[\s\n]*<SearchParamsListener \/>/, '<div>\n        <SearchParamsListener />')
            .replace(/<div className="([^"]+)">/, '<div className="$1">')
            .replace(/<\/div>[\s\n]*<\/div>/, '</div>\n      </div>');
          
          return `return (\n      ${fixedInnerContent}\n    );`;
        }
        return match;
      });
    }
    
    // Write the changes back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

// Main function
async function main() {
  console.log('Starting manual fix script...');
  
  for (const file of FILES_TO_FIX) {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      await fixFile(fullPath);
    } else {
      console.warn(`File not found: ${fullPath}`);
    }
  }
  
  console.log('Done! Fixed all specified files.');
}

main().catch(console.error); 