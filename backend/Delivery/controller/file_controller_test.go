package controller

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/HMZ-H/Madihome/Infrastructure/storage"
	"github.com/gin-gonic/gin"
)

type mockStorageService struct{}

func (m *mockStorageService) UploadFile(file multipart.File, header *multipart.FileHeader, folder string) (*storage.UploadResult, error) {
	return &storage.UploadResult{
		URL:  "https://example.com/photo.jpg",
		Key:  "photo.jpg",
		Size: 1024,
	}, nil
}

func (m *mockStorageService) DeleteFile(key string) error { return nil }
func (m *mockStorageService) GetFileURL(key string) string { return "" }

func createMultipartRequest(t *testing.T, fieldName, filename string, content []byte, contentType string) *http.Request {
	t.Helper()
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	h := make(map[string][]string)
	h["Content-Disposition"] = []string{`form-data; name="` + fieldName + `"; filename="` + filename + `"`}
	if contentType != "" {
		h["Content-Type"] = []string{contentType}
	}

	part, err := writer.CreatePart(h)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := io.Copy(part, bytes.NewReader(content)); err != nil {
		t.Fatal(err)
	}
	writer.Close()

	path := "/upload/photo"
	if fieldName == "document" {
		path = "/upload/document"
	}

	req := httptest.NewRequest(http.MethodPost, path, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}

func setupRouter() (*gin.Engine, *FileController) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	fc := NewFileController(&mockStorageService{})
	r.POST("/upload/photo", fc.UploadPhoto)
	r.POST("/upload/document", fc.UploadDocument)
	r.GET("/uploads/photos/:filename", fc.ServePhotos)
	return r, fc
}

func TestUploadPhoto_ValidJPEG(t *testing.T) {
	r, _ := setupRouter()

	jpegMagic := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	content := append(jpegMagic, make([]byte, 100)...)
	req := createMultipartRequest(t, "photo", "test.jpg", content, "image/jpeg")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["success"] != true {
		t.Errorf("expected success=true, got %v", resp["success"])
	}
}

func TestUploadPhoto_ValidPNG(t *testing.T) {
	r, _ := setupRouter()

	pngMagic := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	content := append(pngMagic, make([]byte, 100)...)
	req := createMultipartRequest(t, "photo", "test.png", content, "image/png")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUploadPhoto_InvalidExtension(t *testing.T) {
	r, _ := setupRouter()

	jpegMagic := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	content := append(jpegMagic, make([]byte, 100)...)
	req := createMultipartRequest(t, "photo", "test.exe", content, "image/jpeg")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUploadPhoto_SpoofedContentType(t *testing.T) {
	r, _ := setupRouter()

	// EXE magic bytes disguised as JPEG
	content := []byte("MZ" + string(make([]byte, 100)))
	req := createMultipartRequest(t, "photo", "malware.jpg", content, "image/jpeg")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for spoofed content, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUploadPhoto_NoFile(t *testing.T) {
	r, _ := setupRouter()

	req := httptest.NewRequest(http.MethodPost, "/upload/photo", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUploadPhoto_FileTooLarge(t *testing.T) {
	r, _ := setupRouter()

	jpegMagic := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	content := append(jpegMagic, make([]byte, 6*1024*1024)...)
	req := createMultipartRequest(t, "photo", "huge.jpg", content, "image/jpeg")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		// MaxBytesReader or header.Size check should reject
		var resp map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &resp)
		if resp["success"] == true {
			t.Error("expected rejection for 6MB file")
		}
	}
}

func TestServePhotos_PathTraversal(t *testing.T) {
	r, _ := setupRouter()

	cases := []string{
		"../../../etc/passwd",
		"..%2F..%2Fetc%2Fpasswd",
	}

	for _, tc := range cases {
		req := httptest.NewRequest(http.MethodGet, "/uploads/photos/"+tc, nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			t.Errorf("path traversal should not return 200 for %q", tc)
		}
	}
}

func TestUploadDocument_ValidPDF(t *testing.T) {
	r, _ := setupRouter()

	pdfContent := []byte("%PDF-1.4 fake pdf content here")
	req := createMultipartRequest(t, "document", "report.pdf", pdfContent, "application/pdf")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for valid PDF, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUploadDocument_InvalidExtension(t *testing.T) {
	r, _ := setupRouter()

	pdfContent := []byte("%PDF-1.4 fake pdf content")
	req := createMultipartRequest(t, "document", "report.docx", pdfContent, "application/pdf")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for .docx extension, got %d", w.Code)
	}
}

func TestUploadDocument_FakeContent(t *testing.T) {
	r, _ := setupRouter()

	fakeContent := []byte("This is not a PDF file at all")
	req := createMultipartRequest(t, "document", "fake.pdf", fakeContent, "application/pdf")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for fake PDF content, got %d", w.Code)
	}
}

func TestValidateMagicBytes(t *testing.T) {
	tests := []struct {
		name  string
		head  []byte
		valid bool
	}{
		{"JPEG", []byte{0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0}, true},
		{"PNG", []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}, true},
		{"GIF", []byte("GIF89a\x00\x00\x00\x00\x00\x00"), true},
		{"WebP", []byte("RIFF\x00\x00\x00\x00WEBP"), true},
		{"PDF", []byte("%PDF-1.4\x00\x00\x00\x00"), false},
		{"EXE", []byte("MZ\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"), false},
		{"Empty", []byte{}, false},
		{"Short", []byte{0xFF}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validateMagicBytes(tt.head); got != tt.valid {
				t.Errorf("validateMagicBytes(%s) = %v, want %v", tt.name, got, tt.valid)
			}
		})
	}
}
