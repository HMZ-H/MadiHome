package usecases

import (
	"errors"
	"time"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type BookingUsecase struct {
	bookingRepo repository.BookingRepository
	serviceRepo repository.HomecareServiceRepository
	userRepo    repository.UserRepository
}

type BookingUsecaseInterface interface {
	CreateBooking(req *schema.CreateBookingRequest) (*schema.BookingResponse, error)
	GetBookingByID(id uint) (*schema.BookingResponse, error)
	GetBookingsByUserID(userID uint) ([]*schema.BookingResponse, error)
	GetBookingsByDoctorID(doctorID uint) ([]*schema.BookingResponse, error)
	GetBookingsByStatus(status string) ([]*schema.BookingResponse, error)
	UpdateBooking(id uint, req *schema.UpdateBookingRequest) (*schema.BookingResponse, error)
	CompleteBooking(id uint, req *schema.CompleteBookingRequest) (*schema.BookingResponse, error)
	DeleteBooking(id uint) error
}

func NewBookingUsecase(bookingRepo repository.BookingRepository, serviceRepo repository.HomecareServiceRepository, userRepo repository.UserRepository) *BookingUsecase {
	return &BookingUsecase{
		bookingRepo: bookingRepo,
		serviceRepo: serviceRepo,
		userRepo:    userRepo,
	}
}

func (uc *BookingUsecase) CreateBooking(req *schema.CreateBookingRequest) (*schema.BookingResponse, error) {
	// Validate service exists
	service, err := uc.serviceRepo.GetHomecareServiceByID(req.ServiceID)
	if err != nil {
		return nil, errors.New("service not found")
	}

	// Parse preferred date
	preferredDate, err := time.Parse(time.RFC3339, req.PreferredDate)
	if err != nil {
		return nil, errors.New("invalid date format, use RFC3339 format (2025-10-05T10:00:00Z)")
	}

	// Create booking
	newBooking := &entity.Booking{
		UserID:         req.UserID,
		ServiceID:      req.ServiceID,
		PreferredDate:  preferredDate,
		Status:         "pending",
		PatientAddress: req.PatientAddress,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		PatientNotes:   req.PatientNotes,
		EstimatedPrice: &service.Price,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	createdBooking, err := uc.bookingRepo.CreateBooking(newBooking)
	if err != nil {
		return nil, err
	}

	return toBookingResponse(createdBooking), nil
}

func (uc *BookingUsecase) GetBookingByID(id uint) (*schema.BookingResponse, error) {
	booking, err := uc.bookingRepo.GetBookingByID(id)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	return toBookingResponse(booking), nil
}

func (uc *BookingUsecase) GetBookingsByUserID(userID uint) ([]*schema.BookingResponse, error) {
	bookings, err := uc.bookingRepo.GetBookingsByUserID(userID)
	if err != nil {
		return nil, err
	}

	bookingResponses := make([]*schema.BookingResponse, len(bookings))
	for i, booking := range bookings {
		bookingResponses[i] = toBookingResponse(booking)
	}
	return bookingResponses, nil
}

func (uc *BookingUsecase) GetBookingsByDoctorID(doctorID uint) ([]*schema.BookingResponse, error) {
	bookings, err := uc.bookingRepo.GetBookingsByDoctorID(doctorID)
	if err != nil {
		return nil, err
	}

	bookingResponses := make([]*schema.BookingResponse, len(bookings))
	for i, booking := range bookings {
		bookingResponses[i] = toBookingResponse(booking)
	}
	return bookingResponses, nil
}

func (uc *BookingUsecase) GetBookingsByStatus(status string) ([]*schema.BookingResponse, error) {
	bookings, err := uc.bookingRepo.GetBookingsByStatus(status)
	if err != nil {
		return nil, err
	}

	bookingResponses := make([]*schema.BookingResponse, len(bookings))
	for i, booking := range bookings {
		bookingResponses[i] = toBookingResponse(booking)
	}
	return bookingResponses, nil
}

func (uc *BookingUsecase) UpdateBooking(id uint, req *schema.UpdateBookingRequest) (*schema.BookingResponse, error) {
	booking, err := uc.bookingRepo.GetBookingByID(id)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	// Update booking fields
	booking.Status = req.Status
	booking.DoctorNotes = req.DoctorNotes
	if req.ActualPrice != nil {
		booking.ActualPrice = req.ActualPrice
	}
	booking.UpdatedAt = time.Now()

	// If accepting booking, set doctor ID
	if req.Status == "accepted" {
		// This should be set by the controller from JWT context
		// booking.DoctorID = doctorID
	}

	updatedBooking, err := uc.bookingRepo.UpdateBooking(booking)
	if err != nil {
		return nil, err
	}

	return toBookingResponse(updatedBooking), nil
}

func (uc *BookingUsecase) CompleteBooking(id uint, req *schema.CompleteBookingRequest) (*schema.BookingResponse, error) {
	booking, err := uc.bookingRepo.GetBookingByID(id)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	// Update booking fields
	booking.Status = req.Status
	booking.DoctorNotes = req.DoctorNotes
	if req.ActualPrice != nil {
		booking.ActualPrice = req.ActualPrice
	}
	booking.UpdatedAt = time.Now()

	updatedBooking, err := uc.bookingRepo.UpdateBooking(booking)
	if err != nil {
		return nil, err
	}

	return toBookingResponse(updatedBooking), nil
}

func (uc *BookingUsecase) DeleteBooking(id uint) error {
	_, err := uc.bookingRepo.GetBookingByID(id)
	if err != nil {
		return errors.New("booking not found")
	}
	return uc.bookingRepo.DeleteBooking(id)
}

func toBookingResponse(booking *entity.Booking) *schema.BookingResponse {
	var doctorID *uint
	if booking.DoctorID != nil {
		doctorID = booking.DoctorID
	}

	response := &schema.BookingResponse{
		ID:             booking.ID,
		UserID:         booking.UserID,
		ServiceID:      booking.ServiceID,
		DoctorID:       doctorID,
		PreferredDate:  booking.PreferredDate,
		Status:         booking.Status,
		PatientAddress: booking.PatientAddress,
		Latitude:       booking.Latitude,
		Longitude:      booking.Longitude,
		PatientNotes:   booking.PatientNotes,
		DoctorNotes:    booking.DoctorNotes,
		EstimatedPrice: booking.EstimatedPrice,
		ActualPrice:    booking.ActualPrice,
		CreatedAt:      booking.CreatedAt,
		UpdatedAt:      booking.UpdatedAt,
	}

	// Add user information
	response.User = schema.UserResponse{
		ID:        booking.User.ID,
		FirstName: booking.User.FirstName,
		LastName:  booking.User.LastName,
		Email:     booking.User.Email,
		Phone:     booking.User.Phone,
		Role:      booking.User.Role,
	}

	// Add service information
	response.Service = schema.HomecareServiceResponse{
		ID:          booking.Service.ID,
		DoctorID:    booking.Service.DoctorID,
		Name:        booking.Service.Name,
		Description: booking.Service.Description,
		Duration:    booking.Service.Duration,
		Price:       booking.Service.Price,
		Category:    booking.Service.Category,
		IsActive:    booking.Service.IsActive,
		CreatedAt:   booking.Service.CreatedAt,
		UpdatedAt:   booking.Service.UpdatedAt,
	}

	// Add doctor information if available
	if booking.Doctor != nil {
		response.Doctor = &schema.DoctorResponse{
			ID:              booking.Doctor.ID,
			UserID:          *booking.Doctor.UserID,
			Specialization:  booking.Doctor.Specialization,
			LicenseNumber:   booking.Doctor.LicenseNumber,
			ExperienceYears: booking.Doctor.ExperienceYears,
			Bio:             booking.Doctor.Bio,
			CreatedAt:       booking.Doctor.CreatedAt,
			UpdatedAt:       booking.Doctor.UpdatedAt,
		}
	}

	return response
}
