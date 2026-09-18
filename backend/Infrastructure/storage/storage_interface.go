package storage

import (
	"mime/multipart"
)

type StorageService interface {
	UploadFile(file multipart.File, header *multipart.FileHeader, folder string) (*UploadResult, error)
	DeleteFile(key string) error
	GetFileURL(key string) string
}

type UploadResult struct {
	URL      string `json:"url"`
	Key      string `json:"key"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
}

