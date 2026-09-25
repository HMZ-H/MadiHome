package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"gorm.io/gorm"
)

type ReviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

func (r *ReviewRepository) CreateReview(review *entity.Review) (*entity.Review, error) {
	err := r.db.Create(review).Error
	if err != nil {
		return nil, err
	}
	return r.GetReviewByID(review.ID)
}

func (r *ReviewRepository) GetReviewByID(id uint) (*entity.Review, error) {
	var review entity.Review
	err := r.db.Preload("User").Preload("Doctor").Preload("Doctor.User").First(&review, id).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *ReviewRepository) GetReviewsByDoctorID(doctorID uint) ([]*entity.Review, error) {
	var reviews []*entity.Review
	err := r.db.Preload("User").Where("doctor_id = ?", doctorID).Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (r *ReviewRepository) GetReviewsByUserID(userID uint) ([]*entity.Review, error) {
	var reviews []*entity.Review
	err := r.db.Preload("Doctor").Preload("Doctor.User").Where("user_id = ?", userID).Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (r *ReviewRepository) GetReviewByBookingID(bookingID uint) (*entity.Review, error) {
	var review entity.Review
	err := r.db.Preload("User").Where("booking_id = ?", bookingID).First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *ReviewRepository) GetDoctorAverageRating(doctorID uint) (float64, int64, error) {
	var result struct {
		Avg   float64
		Count int64
	}
	err := r.db.Model(&entity.Review{}).
		Select("COALESCE(AVG(rating), 0) as avg, COUNT(*) as count").
		Where("doctor_id = ?", doctorID).
		Scan(&result).Error
	return result.Avg, result.Count, err
}

func (r *ReviewRepository) UpdateReview(review *entity.Review) (*entity.Review, error) {
	err := r.db.Save(review).Error
	if err != nil {
		return nil, err
	}
	return r.GetReviewByID(review.ID)
}

func (r *ReviewRepository) DeleteReview(id uint) error {
	return r.db.Delete(&entity.Review{}, id).Error
}
