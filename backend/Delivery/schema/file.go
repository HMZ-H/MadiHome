package schema

type UploadResponse struct {
	Success bool       `json:"success"`
	Message string     `json:"message"`
	Data    *FileData  `json:"data,omitempty"`
}

type FileData struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}

type FileValidationConfig struct {
	MaxSize           int64
	AllowedExtensions []string
	AllowedMimeTypes  []string
}

var PhotoValidation = FileValidationConfig{
	MaxSize:           5 * 1024 * 1024,
	AllowedExtensions: []string{".jpg", ".jpeg", ".png", ".gif", ".webp"},
	AllowedMimeTypes:  []string{"image/jpeg", "image/png", "image/gif", "image/webp"},
}

var DocumentValidation = FileValidationConfig{
	MaxSize:           10 * 1024 * 1024,
	AllowedExtensions: []string{".pdf"},
	AllowedMimeTypes:  []string{"application/pdf"},
}
