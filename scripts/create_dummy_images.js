const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Function to create a placeholder image
function createPlaceholderImage(width, height, bgColor, text, textColor, outputPath) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Text
  ctx.fillStyle = textColor;
  ctx.font = `${Math.floor(width/10)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width/2, height/2);
  
  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created: ${outputPath}`);
}

// Create directories if they don't exist
const dirs = [
  path.join(__dirname, '../public/testimonials'), 
  path.join(__dirname, '../public')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create user images
const users = ['user1', 'user2', 'user3', 'profile', 'parent1', 'parent2', 'parent3'];
const colors = ['#9333ea', '#6366f1', '#8b5cf6', '#7e22ce', '#a855f7', '#6b21a8', '#8b5cf6'];

users.forEach((user, index) => {
  createPlaceholderImage(
    300, 300, 
    colors[index % colors.length], 
    user, 
    '#ffffff',
    path.join(__dirname, `../public/testimonials/${user}.jpg`)
  );
});

// Create hero and activity images
createPlaceholderImage(
  800, 600, 
  '#7e22ce', 
  'Childminder with Children', 
  '#ffffff',
  path.join(__dirname, '../public/hero-childminder.jpg')
);

createPlaceholderImage(
  800, 600, 
  '#8b5cf6', 
  'Activity with Children', 
  '#ffffff',
  path.join(__dirname, '../public/childminder-activity.jpg')
);

console.log('All placeholder images created successfully!'); 