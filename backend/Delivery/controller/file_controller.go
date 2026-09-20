package controller

import (
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/HMZ-H/Madihome/Infrastructure/storage"
	"github.com/gin-gonic/gin"
)

const maxPhotoSize = 5 * 1024 * 1024  // 5MB
const maxDocumentSize = 10 * 1024 * 1024 // 10MB

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

var allowedDocMimeTypes = map[string]bool{
	"application/pdf": true,
}

var allowedDocExtensions = map[string]bool{
	".pdf": true,
}

// Magic bytes for allowed image formats
var magicHeaders = []struct {
	mime   string
	magic  []byte
	offset int
}{
	{"image/jpeg", []byte{0xFF, 0xD8, 0xFF}, 0},
	{"image/png", []byte{0x89, 0x50, 0x4E, 0x47}, 0},
	{"image/gif", []byte("GIF8"), 0},
	{"image/webp", []byte("RIFF"), 0},
}

type FileController struct {
	storageService storage.StorageService
}

func NewFileController(storageService storage.StorageService) *FileController {
	return &FileController{
		storageService: storageService,
	}
}

func (fc *FileController) UploadPhoto(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxPhotoSize+512)

	file, header, err := c.Request.FormFile("photo")
	if err != nil {
		if err.Error() == "http: request body too large" {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"success": false,
				"message": "File size must be less than 5MB",
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No file uploaded",
		})
		return
	}
	defer file.Close()

	if header.Size > maxPhotoSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"success": false,
			"message": "File size must be less than 5MB",
		})
		return
	}

	// Validate extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Allowed file types: JPEG, PNG, GIF, WebP",
		})
		return
	}

	// Read first 12 bytes for magic number validation
	head := make([]byte, 12)
	n, err := io.ReadFull(file, head)
	if err != nil && n < 4 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Could not read file",
		})
		return
	}
	head = head[:n]

	if !validateMagicBytes(head) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "File content does not match an allowed image format",
		})
		return
	}

	// Rewind file for upload
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process file",
		})
		return
	}

	// Validate declared Content-Type matches
	contentType := header.Header.Get("Content-Type")
	if !allowedMimeTypes[contentType] {
		contentType = http.DetectContentType(head)
		if !allowedMimeTypes[contentType] {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "File must be a valid image (JPEG, PNG, GIF, WebP)",
			})
			return
		}
	}

	result, err := fc.storageService.UploadFile(file, header, "photos")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to upload file",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "File uploaded successfully",
		"data": gin.H{
			"url":      result.URL,
			"filename": result.Key,
			"size":     result.Size,
		},
	})
}

func (fc *FileController) ServePhotos(c *gin.Context) {
	filename := filepath.Base(c.Param("filename"))

	// Reject path traversal attempts
	if filename == "." || filename == ".." || strings.ContainsAny(filename, `/\`) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid filename",
		})
		return
	}

	path := filepath.Join("uploads/photos", filename)

	if _, err := os.Stat(path); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "File not found",
		})
		return
	}

	c.File(path)
}

var docMagicHeaders = []struct {
	mime   string
	magic  []byte
	offset int
}{
	{"application/pdf", []byte("%PDF"), 0},
}

func (fc *FileController) UploadDocument(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxDocumentSize+512)

	file, header, err := c.Request.FormFile("document")
	if err != nil {
		if err.Error() == "http: request body too large" {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"success": false,
				"message": "File size must be less than 10MB",
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No file uploaded",
		})
		return
	}
	defer file.Close()

	if header.Size > maxDocumentSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"success": false,
			"message": "File size must be less than 10MB",
		})
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedDocExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Allowed document types: PDF",
		})
		return
	}

	head := make([]byte, 12)
	n, err := io.ReadFull(file, head)
	if err != nil && n < 4 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Could not read file",
		})
		return
	}
	head = head[:n]

	if !validateMagicBytesWithHeaders(head, docMagicHeaders) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "File content does not match an allowed document format",
		})
		return
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process file",
		})
		return
	}

	result, err := fc.storageService.UploadFile(file, header, "documents")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to upload document",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Document uploaded successfully",
		"data": gin.H{
			"url":      result.URL,
			"filename": result.Key,
			"size":     result.Size,
		},
	})
}

func validateMagicBytes(head []byte) bool {
	return validateMagicBytesWithHeaders(head, magicHeaders)
}

func validateMagicBytesWithHeaders(head []byte, headers []struct {
	mime   string
	magic  []byte
	offset int
}) bool {
	for _, m := range headers {
		end := m.offset + len(m.magic)
		if end > len(head) {
			continue
		}
		if hex.EncodeToString(head[m.offset:end]) == hex.EncodeToString(m.magic) {
			return true
		}
	}
	return false
}
