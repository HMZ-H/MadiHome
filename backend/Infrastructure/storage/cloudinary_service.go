package storage

import (
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService struct {
	cld       *cloudinary.Cloudinary
	cloudName string
}

type CloudinaryResult struct {
	URL      string `json:"url"`
	PublicID string `json:"public_id"`
	Size     int64  `json:"size"`
	Format   string `json:"format"`
}

func NewCloudinaryService(cloudName, apiKey, apiSecret string) (*CloudinaryService, error) {
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary: %w", err)
	}

	return &CloudinaryService{
		cld:       cld,
		cloudName: cloudName,
	}, nil
}

func (c *CloudinaryService) UploadFile(file multipart.File, header *multipart.FileHeader, folder string) (*UploadResult, error) {
	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)

	// Upload to Cloudinary
	result, err := c.cld.Upload.Upload(context.Background(), file, uploader.UploadParams{
		PublicID:       fmt.Sprintf("%s/%s", folder, filename),
		Folder:         folder,
		ResourceType:   "auto",
		Transformation: "f_auto,q_auto",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	return &UploadResult{
		URL:      result.SecureURL,
		Key:      result.PublicID,
		Size:     header.Size,
		MimeType: header.Header.Get("Content-Type"),
	}, nil
}

func (c *CloudinaryService) DeleteFile(key string) error {
	_, err := c.cld.Upload.Destroy(context.Background(), uploader.DestroyParams{
		PublicID: key,
	})
	return err
}

func (c *CloudinaryService) GetFileURL(key string) string {
	// Return direct Cloudinary URL
	return fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/%s", c.cloudName, key)
}

func (c *CloudinaryService) GetOptimizedURL(publicID string, width, height int) string {
	// Return optimized Cloudinary URL
	return fmt.Sprintf("https://res.cloudinary.com/%s/image/upload/w_%d,h_%d,c_fill,f_auto,q_auto/%s", c.cloudName, width, height, publicID)
}
