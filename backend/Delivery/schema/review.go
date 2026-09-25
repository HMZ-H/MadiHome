package schema

import "time"

type CreateReviewRequest struct {
	BookingID uint   `json:"booking_id" binding:"required"`
	Rating    int    `json:"rating" binding:"required,min=1,max=5"`
	Comment   string `json:"comment"`
}

type UpdateReviewRequest struct {
	Rating  *int   `json:"rating" binding:"omitempty,min=1,max=5"`
	Comment string `json:"comment"`
}

type ReviewResponse struct {
	ID        uint      `json:"id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	Patient   struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	} `json:"patient"`
	Doctor struct {
		ID             uint   `json:"id"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		Specialization string `json:"specialization"`
	} `json:"doctor"`
	BookingID uint `json:"booking_id"`
}

type DoctorRatingResponse struct {
	DoctorID    uint    `json:"doctor_id"`
	Average     float64 `json:"average"`
	TotalCount  int64   `json:"total_count"`
}
