package email

import (
	"fmt"
	"net/smtp"
	"os"
)

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	fromEmail    string
}

func NewEmailService() *EmailService {
	return &EmailService{
		smtpHost:     os.Getenv("SMTP_HOST"),
		smtpPort:     os.Getenv("SMTP_PORT"),
		smtpUsername: os.Getenv("SMTP_USERNAME"),
		smtpPassword: os.Getenv("SMTP_PASSWORD"),
		fromEmail:    os.Getenv("FROM_EMAIL"),
	}
}

func (es *EmailService) SendEmail(to, subject, body string) error {
	// Set up authentication
	auth := smtp.PlainAuth("", es.smtpUsername, es.smtpPassword, es.smtpHost)

	// Create the message with proper headers
	msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		es.fromEmail, to, subject, body))

	// Send the email
	addr := fmt.Sprintf("%s:%s", es.smtpHost, es.smtpPort)
	err := smtp.SendMail(addr, auth, es.fromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

func (es *EmailService) SendVerificationEmail(to, verificationToken string) error {
	subject := "Verify Your Email - MadiHome"
	verificationURL := fmt.Sprintf("http://localhost:8080/api/verify-email/%s", verificationToken)

	body := fmt.Sprintf(`
Hello!

Thank you for registering with MadiHome. Please click the link below to verify your email address:

%s

If you didn't create an account, please ignore this email.

Best regards,
MadiHome Team
`, verificationURL)

	return es.SendEmail(to, subject, body)
}

func (es *EmailService) SendPasswordResetEmail(to, resetToken string) error {
	subject := "Reset Your Password - MadiHome"
	body := fmt.Sprintf(`
Hello!

You requested to reset your password. Please click the link below to reset your password:

http://localhost:8080/api/reset-password/%s

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
MadiHome Team
`, resetToken)

	return es.SendEmail(to, subject, body)
}
