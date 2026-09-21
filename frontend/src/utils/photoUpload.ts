const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_DOC_TYPES = ['application/pdf'];
const ALLOWED_DOC_EXTENSIONS = ['.pdf'];
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex).toLowerCase();
}

function validateFile(
  file: File,
  allowedTypes: string[],
  allowedExtensions: string[],
  maxSize: number,
  label: string
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed ${label} types: ${allowedExtensions.join(', ')}`;
  }

  const ext = getFileExtension(file.name);
  if (!allowedExtensions.includes(ext)) {
    return `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`;
  }

  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    return `File size must be less than ${sizeMB}MB`;
  }

  if (file.size === 0) {
    return 'File is empty';
  }

  return null;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const uploadPhoto = async (file: File): Promise<UploadResult> => {
  try {
    const validationError = validateFile(
      file,
      ALLOWED_IMAGE_TYPES,
      ALLOWED_IMAGE_EXTENSIONS,
      MAX_PHOTO_SIZE,
      'image'
    );
    if (validationError) {
      return { success: false, error: validationError };
    }

    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE_URL}/api/upload/photo`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // use default error message
      }
      return { success: false, error: errorMessage };
    }

    const result = await response.json();
    return {
      success: true,
      url: result.data?.url,
      filename: result.data?.filename,
      size: result.data?.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const uploadDocument = async (file: File): Promise<UploadResult> => {
  try {
    const validationError = validateFile(
      file,
      ALLOWED_DOC_TYPES,
      ALLOWED_DOC_EXTENSIONS,
      MAX_DOC_SIZE,
      'document'
    );
    if (validationError) {
      return { success: false, error: validationError };
    }

    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // use default error message
      }
      return { success: false, error: errorMessage };
    }

    const result = await response.json();
    return {
      success: true,
      url: result.data?.url,
      filename: result.data?.filename,
      size: result.data?.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const getPhotoUrl = (filename: string): string => {
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${API_BASE_URL}/api/uploads/photos/${filename}`;
};
