const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
  console.log("✅ Cloudinary Configured Successfully");
} else {
  console.warn("⚠️ Cloudinary credentials missing in env. Falling back to local backend filesystem uploads.");
}

// Ensure local uploads directory exists
const localUploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Exportable upload helper
const uploadImage = async (fileBuffer, fileName) => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'smart_bharat' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      ).end(fileBuffer);
    });
  } else {
    // Local fallback: write file to backend/uploads and return a local URL path
    const safeName = `${Date.now()}-${fileName.replace(/[^a-z0-9.]/gi, '_')}`;
    const filePath = path.join(localUploadsDir, safeName);
    fs.writeFileSync(filePath, fileBuffer);
    // Return relative URL that Express can serve statically
    return `/uploads/${safeName}`;
  }
};

module.exports = {
  uploadImage,
  isCloudinaryConfigured
};
