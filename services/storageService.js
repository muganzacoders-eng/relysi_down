// backend/services/storageService.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS (you can also use local storage)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'education-support-files';

/**
 * Upload file to S3 or local storage
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name in storage
 * @returns {Object} - File data with URL and key
 */
const uploadFile = async (file, folder = 'uploads') => {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      // Local storage for development
      return uploadFileLocally(file, folder);
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('File upload failed');
  }
};

/**
 * Upload file locally (for development)
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name
 * @returns {Object} - File data with URL and key
 */
const uploadFileLocally = async (file, folder = 'uploads') => {
  const fs = require('fs').promises;
  const uploadPath = path.join(__dirname, '../uploads', folder);
  
  // Create directory if it doesn't exist
  try {
    await fs.mkdir(uploadPath, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(uploadPath, fileName);

  await fs.writeFile(filePath, file.buffer);

  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const fileUrl = `${baseUrl}/uploads/${folder}/${fileName}`;

  return {
    url: fileUrl,
    key: `${folder}/${fileName}`,
    size: file.size,
    mimetype: file.mimetype,
    originalname: file.originalname
  };
};

/**
 * Delete file from S3 or local storage
 * @param {string} fileKey - File key/path
 */
const deleteFile = async (fileKey) => {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      // Delete local file
      return deleteFileLocally(fileKey);
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey
    };

    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully: ${fileKey}`);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error for delete operations
  }
};

/**
 * Delete file locally
 * @param {string} fileKey - File key/path
 */
const deleteFileLocally = async (fileKey) => {
  try {
    const fs = require('fs').promises;
    const filePath = path.join(__dirname, '../uploads', fileKey);
    await fs.unlink(filePath);
    console.log(`Local file deleted successfully: ${fileKey}`);
  } catch (error) {
    console.error('Error deleting local file:', error);
    // Don't throw error for delete operations
  }
};

/**
 * Get file URL from key
 * @param {string} fileKey - File key
 * @returns {string} - File URL
 */
const getFileUrl = (fileKey) => {
  if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${fileKey}`;
  }

  return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl
};