const cloudinary = require('cloudinary').v2;

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
  console.warn("⚠️ Cloudinary credentials missing in env. Private file uploads are unavailable.");
}

const uploadPrivateDocument = async (fileBuffer, fileName) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Private document storage is not configured.');
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
        access_mode: 'authenticated',
        folder: 'smart_bharat_private',
        filename_override: fileName
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ publicId: result.public_id, format: result.format || '' });
      }
    ).end(fileBuffer);
  });
};

const uploadPrivateEvidence = async (fileBuffer, fileName) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Private evidence storage is not configured.');
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        type: 'authenticated',
        access_mode: 'authenticated',
        folder: 'smart_bharat_private/evidence',
        filename_override: fileName
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ publicId: result.public_id, format: result.format || '' });
      }
    ).end(fileBuffer);
  });
};

const getPrivateDocumentUrl = (publicId, format) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Private document storage is not configured.');
  }

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300,
    attachment: true
  });
};

const getPrivateEvidenceUrl = (publicId, format) => {
  if (!isCloudinaryConfigured) {
    throw new Error('Private evidence storage is not configured.');
  }

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 300,
    attachment: true
  });
};

const deletePrivateEvidence = async (publicId) => {
  if (!isCloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    invalidate: true
  });
};

const deletePrivateDocument = async (publicId) => {
  if (!isCloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    invalidate: true
  });
};

module.exports = {
  uploadPrivateDocument,
  uploadPrivateEvidence,
  getPrivateDocumentUrl,
  getPrivateEvidenceUrl,
  deletePrivateDocument,
  deletePrivateEvidence,
  isCloudinaryConfigured
};
