package security

import "testing"

func TestHashAndVerifyPassword(t *testing.T) {
	svc := NewPasswordService()

	hash, err := svc.HashPassword("mypassword123")
	if err != nil {
		t.Fatalf("HashPassword error: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if hash == "mypassword123" {
		t.Fatal("hash should not equal plaintext")
	}

	if !svc.VerifyPassword(hash, "mypassword123") {
		t.Error("expected password to verify")
	}
}

func TestVerifyPasswordWrong(t *testing.T) {
	svc := NewPasswordService()

	hash, _ := svc.HashPassword("correct-password")

	if svc.VerifyPassword(hash, "wrong-password") {
		t.Error("expected wrong password to not verify")
	}
}

func TestHashPasswordUnique(t *testing.T) {
	svc := NewPasswordService()

	hash1, _ := svc.HashPassword("same-password")
	hash2, _ := svc.HashPassword("same-password")

	if hash1 == hash2 {
		t.Error("expected different hashes for same password (bcrypt uses random salt)")
	}
}
