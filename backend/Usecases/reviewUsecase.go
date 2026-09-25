package Usecases

import (
	"errors"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type ReviewUsecase struct {
	reviewRepo  repository.ReviewRepository
	bookingRepo repository.BookingRepository
}

type ReviewUsecaseInterface interface {
	CreateReview(userID uint, req *schema.CreateReviewRequest) (*schema.ReviewResponse, error)
	GetReviewsByDoctorID(doctorID uint) ([]*schema.ReviewResponse, error)
	GetReviewsByUserID(userID uint) ([]*schema.ReviewResponse, error)
	GetDoctorRating(doctorID uint) (*schema.DoctorRatingResponse, error)
	UpdateReview(reviewID uint, userID uint, req *schema.UpdateReviewRequest) (*schema.ReviewResponse, error)
	DeleteReview(reviewID uint, userID uint) error
}

func NewReviewUsecase(reviewRepo repository.ReviewRepository, bookingRepo repository.BookingRepository) *ReviewUsecase {
	return &ReviewUsecase{reviewRepo: reviewRepo, bookingRepo: bookingRepo}
}

func (uc *ReviewUsecase) CreateReview(userID uint, req *schema.CreateReviewRequest) (*schema.ReviewResponse, error) {
	booking, err := uc.bookingRepo.GetBookingByID(req.BookingID)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	if booking.UserID != userID {
		return nil, errors.New("you can only review your own bookings")
	}

	if booking.Status != "completed" {
		return nil, errors.New("you can only review completed bookings")
	}

	if booking.DoctorID == nil {
		return nil, errors.New("booking has no assigned doctor")
	}

	existing, _ := uc.reviewRepo.GetReviewByBookingID(req.BookingID)
	if existing != nil {
		return nil, errors.New("you have already reviewed this booking")
	}

	review := &entity.Review{
		UserID:    userID,
		DoctorID:  *booking.DoctorID,
		BookingID: req.BookingID,
		Rating:    req.Rating,
		Comment:   req.Comment,
	}

	created, err := uc.reviewRepo.CreateReview(review)
	if err != nil {
		return nil, err
	}

	return toReviewResponse(created), nil
}

func (uc *ReviewUsecase) GetReviewsByDoctorID(doctorID uint) ([]*schema.ReviewResponse, error) {
	reviews, err := uc.reviewRepo.GetReviewsByDoctorID(doctorID)
	if err != nil {
		return nil, err
	}

	var responses []*schema.ReviewResponse
	for _, r := range reviews {
		responses = append(responses, toReviewResponse(r))
	}
	return responses, nil
}

func (uc *ReviewUsecase) GetReviewsByUserID(userID uint) ([]*schema.ReviewResponse, error) {
	reviews, err := uc.reviewRepo.GetReviewsByUserID(userID)
	if err != nil {
		return nil, err
	}

	var responses []*schema.ReviewResponse
	for _, r := range reviews {
		responses = append(responses, toReviewResponse(r))
	}
	return responses, nil
}

func (uc *ReviewUsecase) GetDoctorRating(doctorID uint) (*schema.DoctorRatingResponse, error) {
	avg, count, err := uc.reviewRepo.GetDoctorAverageRating(doctorID)
	if err != nil {
		return nil, err
	}
	return &schema.DoctorRatingResponse{
		DoctorID:   doctorID,
		Average:    avg,
		TotalCount: count,
	}, nil
}

func (uc *ReviewUsecase) UpdateReview(reviewID uint, userID uint, req *schema.UpdateReviewRequest) (*schema.ReviewResponse, error) {
	review, err := uc.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		return nil, errors.New("review not found")
	}
	if review.UserID != userID {
		return nil, errors.New("you can only edit your own reviews")
	}

	if req.Rating != nil {
		review.Rating = *req.Rating
	}
	review.Comment = req.Comment

	updated, err := uc.reviewRepo.UpdateReview(review)
	if err != nil {
		return nil, err
	}
	return toReviewResponse(updated), nil
}

func (uc *ReviewUsecase) DeleteReview(reviewID uint, userID uint) error {
	review, err := uc.reviewRepo.GetReviewByID(reviewID)
	if err != nil {
		return errors.New("review not found")
	}
	if review.UserID != userID {
		return errors.New("you can only delete your own reviews")
	}
	return uc.reviewRepo.DeleteReview(reviewID)
}

func toReviewResponse(r *entity.Review) *schema.ReviewResponse {
	resp := &schema.ReviewResponse{
		ID:        r.ID,
		Rating:    r.Rating,
		Comment:   r.Comment,
		CreatedAt: r.CreatedAt,
		BookingID: r.BookingID,
	}
	resp.Patient.ID = r.User.ID
	resp.Patient.FirstName = r.User.FirstName
	resp.Patient.LastName = r.User.LastName
	resp.Doctor.ID = r.Doctor.ID
	if r.Doctor.User.ID != 0 {
		resp.Doctor.FirstName = r.Doctor.User.FirstName
		resp.Doctor.LastName = r.Doctor.User.LastName
	}
	resp.Doctor.Specialization = r.Doctor.Specialization
	return resp
}
