#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const FILES_TO_FIX = [
  'src/app/subscription/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/parent/messages/page.tsx',
  'src/app/dashboard/parent/find-childminders/page.tsx',
  'src/app/dashboard/admin/documents/page.tsx',
  'src/app/dashboard/admin/subscriptions/page.tsx',
  'src/app/dashboard/admin/support/page.tsx',
  'src/app/dashboard/admin/messages/page.tsx',
  'src/app/dashboard/admin/messages/search/page.tsx',
  'src/app/dashboard/childminder/messages/page.tsx',
];

async function fixFile(filePath) {
  try {
    console.log(`Fixing ${filePath}...`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix incorrect SearchParamsListener placement
    content = content.replace(
      /<SearchParamsListener\s*\/>\s*className="([^"]+)">/g,
      '<SearchParamsListener />\n      <div className="$1">'
    );
    
    // Fix return statement indentation issues
    content = content.replace(
      /return\s*\(\s*\n\s*<div>/g,
      'return (\n      <div>'
    );
    
    // Write the changes back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

// Main function
async function main() {
  console.log('Starting layout fix script...');
  
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