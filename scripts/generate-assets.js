const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (valid binary PNG file)
const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const pngBuffer = Buffer.from(PNG_BASE64, 'base64');

const assetsDir = path.join(__dirname, '..', 'assets');
const files = ['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'notification-icon.png'];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated: ${file}`);
});

console.log('PNG assets generated successfully!');
