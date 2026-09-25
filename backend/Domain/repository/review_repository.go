package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type ReviewRepository interface {
	CreateReview(review *entity.Review) (*entity.Review, error)
	GetReviewByID(id uint) (*entity.Review, error)
	GetReviewsByDoctorID(doctorID uint) ([]*entity.Review, error)
	GetReviewsByUserID(userID uint) ([]*entity.Review, error)
	GetReviewByBookingID(bookingID uint) (*entity.Review, error)
	GetDoctorAverageRating(doctorID uint) (float64, int64, error)
	UpdateReview(review *entity.Review) (*entity.Review, error)
	DeleteReview(id uint) error
}
