import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  isImageFile,
  isDocumentFile,
  getAcceptString,
  MAX_PHOTO_SIZE,
  MAX_DOC_SIZE,
} from './fileValidation';

function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('isImageFile', () => {
  it('accepts valid image types', () => {
    expect(isImageFile(createMockFile('photo.jpg', 'image/jpeg', 100))).toBe(true);
    expect(isImageFile(createMockFile('photo.png', 'image/png', 100))).toBe(true);
    expect(isImageFile(createMockFile('photo.gif', 'image/gif', 100))).toBe(true);
    expect(isImageFile(createMockFile('photo.webp', 'image/webp', 100))).toBe(true);
  });

  it('rejects invalid image types', () => {
    expect(isImageFile(createMockFile('doc.pdf', 'application/pdf', 100))).toBe(false);
    expect(isImageFile(createMockFile('file.txt', 'text/plain', 100))).toBe(false);
    expect(isImageFile(createMockFile('image.svg', 'image/svg+xml', 100))).toBe(false);
  });
});

describe('isDocumentFile', () => {
  it('accepts PDF files', () => {
    expect(isDocumentFile(createMockFile('report.pdf', 'application/pdf', 100))).toBe(true);
  });

  it('rejects non-PDF documents', () => {
    expect(isDocumentFile(createMockFile('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 100))).toBe(false);
    expect(isDocumentFile(createMockFile('photo.jpg', 'image/jpeg', 100))).toBe(false);
  });
});

describe('getAcceptString', () => {
  it('returns image MIME types for image type', () => {
    const accept = getAcceptString('image');
    expect(accept).toContain('image/jpeg');
    expect(accept).toContain('image/png');
    expect(accept).not.toContain('application/pdf');
  });

  it('returns document MIME types for document type', () => {
    const accept = getAcceptString('document');
    expect(accept).toContain('application/pdf');
    expect(accept).not.toContain('image/jpeg');
  });
});

describe('size constants', () => {
  it('has correct photo size limit', () => {
    expect(MAX_PHOTO_SIZE).toBe(5 * 1024 * 1024);
  });

  it('has correct document size limit', () => {
    expect(MAX_DOC_SIZE).toBe(10 * 1024 * 1024);
  });
});
