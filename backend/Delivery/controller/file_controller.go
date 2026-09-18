package controller

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/HMZ-H/Madihome/Infrastructure/storage"
	"github.com/gin-gonic/gin"
)

type FileController struct {
	storageService storage.StorageService
}

func NewFileController(storageService storage.StorageService) *FileController {
	return &FileController{
		storageService: storageService,
	}
}

// UploadPhoto handles photo uploads
func (fc *FileController) UploadPhoto(c *gin.Context) {
	// Get the file from the request
	file, header, err := c.Request.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File must be an image"})
		return
	}

	// Validate file size (max 10MB for production)
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 10MB"})
		return
	}

	// Use cloud storage service
	result, err := fc.storageService.UploadFile(file, header, "photos")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file: " + err.Error()})
		return
	}

	// Return the file URL
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

// ServePhotos serves uploaded photos
func (fc *FileController) ServePhotos(c *gin.Context) {
	filename := c.Param("filename")
	filepath := filepath.Join("uploads/photos", filename)

	// Check if file exists
	if _, err := os.Stat(filepath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(filepath)
}
