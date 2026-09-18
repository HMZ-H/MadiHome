package schema

import "time"

type CreateRoleRequestRequest struct {
	RequestedRole string `json:"requested_role" binding:"required"`
	Reason        string `json:"reason" binding:"required"`
	Documents     string `json:"documents"` // JSON string of document URLs
}

type UpdateRoleRequestRequest struct {
	Status      string `json:"status" binding:"required"` // approved, rejected
	ReviewNotes string `json:"review_notes"`
}

type RoleRequestResponse struct {
	ID            uint      `json:"id"`
	UserID        uint      `json:"user_id"`
	RequestedRole string    `json:"requested_role"`
	Status        string    `json:"status"`
	Reason        string    `json:"reason"`
	Documents     string    `json:"documents"`
	ReviewedBy    *uint     `json:"reviewed_by"`
	ReviewNotes   string    `json:"review_notes"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// User information
	User struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Role      string `json:"role"`
	} `json:"user"`

	// Reviewer information (if reviewed)
	Reviewer *struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
	} `json:"reviewer,omitempty"`
}
