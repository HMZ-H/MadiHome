// Photo upload utility functions

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export const uploadPhoto = async (file: File): Promise<PhotoUploadResult> => {
  try {
    console.log('Starting photo upload...');
    console.log('File:', file.name, file.size, file.type);
    console.log('API Base URL:', API_BASE_URL);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('photo', file);

    const uploadUrl = `${API_BASE_URL}/api/upload/photo`;
    console.log('Upload URL:', uploadUrl);

    // Upload file
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const result = await response.json();
    console.log('Upload result:', result);
    
    // Use the URL directly from Cloudinary (it's already a complete URL)
    const photoUrl = result.data?.url;
    
    return {
      success: true,
      url: photoUrl || undefined,
      filename: result.data?.filename,
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

export const getPhotoUrl = (filename: string): string => {
  // If it's already a complete URL (Cloudinary), return it as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // Otherwise, construct the local API URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${apiBaseUrl}/api/uploads/photos/${filename}`;
};
