export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export const ALLOWED_DOC_TYPES = ['application/pdf'] as const;
export const ALLOWED_DOC_EXTENSIONS = ['.pdf'] as const;
export const MAX_DOC_SIZE = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number]);
}

export function isDocumentFile(file: File): boolean {
  return ALLOWED_DOC_TYPES.includes(file.type as typeof ALLOWED_DOC_TYPES[number]);
}

export function getAcceptString(type: 'image' | 'document'): string {
  if (type === 'image') {
    return ALLOWED_IMAGE_TYPES.join(',');
  }
  return ALLOWED_DOC_TYPES.join(',');
}
