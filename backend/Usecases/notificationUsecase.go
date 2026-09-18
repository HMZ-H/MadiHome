package Usecases

import (
	"encoding/json"

	"github.com/HMZ-H/Madihome/Delivery/schema"
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
)

type NotificationUsecase struct {
	notificationRepo repository.NotificationRepository
	userRepo         repository.UserRepository
	doctorRepo       repository.DoctorRepository
}

type NotificationUsecaseInterface interface {
	CreateNotification(req *schema.CreateNotificationRequest) (*schema.NotificationResponse, error)
	GetUserNotifications(userID uint) ([]*schema.NotificationResponse, error)
	GetUnreadNotifications(userID uint) ([]*schema.NotificationResponse, error)
	MarkNotificationAsRead(notificationID uint) error
	MarkAllNotificationsAsRead(userID uint) error
	DeleteNotification(notificationID uint) error

	// Notification creation helpers
	NotifyNewBooking(booking *entity.Booking) error
	NotifyBookingAccepted(booking *entity.Booking) error
	NotifyBookingRejected(booking *entity.Booking) error
	NotifyNewVisit(visit *entity.HomecareVisit) error
}

func NewNotificationUsecase(notificationRepo repository.NotificationRepository, userRepo repository.UserRepository, doctorRepo repository.DoctorRepository) *NotificationUsecase {
	return &NotificationUsecase{
		notificationRepo: notificationRepo,
		userRepo:         userRepo,
		doctorRepo:       doctorRepo,
	}
}

func (uc *NotificationUsecase) CreateNotification(req *schema.CreateNotificationRequest) (*schema.NotificationResponse, error) {
	notification := &entity.Notification{
		UserID:  req.UserID,
		Title:   req.Title,
		Message: req.Message,
		Type:    req.Type,
		Data:    req.Data,
	}

	createdNotification, err := uc.notificationRepo.CreateNotification(notification)
	if err != nil {
		return nil, err
	}

	return toNotificationResponse(createdNotification), nil
}

func (uc *NotificationUsecase) GetUserNotifications(userID uint) ([]*schema.NotificationResponse, error) {
	notifications, err := uc.notificationRepo.GetNotificationsByUserID(userID)
	if err != nil {
		return nil, err
	}

	var responses []*schema.NotificationResponse
	for _, notification := range notifications {
		responses = append(responses, toNotificationResponse(notification))
	}

	return responses, nil
}

func (uc *NotificationUsecase) GetUnreadNotifications(userID uint) ([]*schema.NotificationResponse, error) {
	notifications, err := uc.notificationRepo.GetUnreadNotificationsByUserID(userID)
	if err != nil {
		return nil, err
	}

	var responses []*schema.NotificationResponse
	for _, notification := range notifications {
		responses = append(responses, toNotificationResponse(notification))
	}

	return responses, nil
}

func (uc *NotificationUsecase) MarkNotificationAsRead(notificationID uint) error {
	return uc.notificationRepo.MarkNotificationAsRead(notificationID)
}

func (uc *NotificationUsecase) MarkAllNotificationsAsRead(userID uint) error {
	return uc.notificationRepo.MarkAllNotificationsAsRead(userID)
}

func (uc *NotificationUsecase) DeleteNotification(notificationID uint) error {
	return uc.notificationRepo.DeleteNotification(notificationID)
}

// Notification creation helpers
func (uc *NotificationUsecase) NotifyNewBooking(booking *entity.Booking) error {
	// Get all doctors to notify them about new booking
	doctors, err := uc.doctorRepo.GetAllDoctors()
	if err != nil {
		return err
	}

	// Create notification data
	notificationData := map[string]interface{}{
		"booking_id":      booking.ID,
		"patient_name":    booking.User.FirstName + " " + booking.User.LastName,
		"service_name":    booking.Service.Name,
		"preferred_date":  booking.PreferredDate,
		"patient_address": booking.PatientAddress,
	}

	dataJSON, _ := json.Marshal(notificationData)

	// Notify all doctors
	for _, doctor := range doctors {
		notification := &entity.Notification{
			UserID:  *doctor.UserID,
			Title:   "New Booking Request",
			Message: "A new homecare booking has been requested by " + booking.User.FirstName + " " + booking.User.LastName,
			Type:    "booking",
			Data:    string(dataJSON),
		}

		_, err := uc.notificationRepo.CreateNotification(notification)
		if err != nil {
			return err
		}
	}

	return nil
}

func (uc *NotificationUsecase) NotifyBookingAccepted(booking *entity.Booking) error {
	notificationData := map[string]interface{}{
		"booking_id":     booking.ID,
		"doctor_name":    booking.Doctor.User.FirstName + " " + booking.Doctor.User.LastName,
		"service_name":   booking.Service.Name,
		"preferred_date": booking.PreferredDate,
	}

	dataJSON, _ := json.Marshal(notificationData)

	notification := &entity.Notification{
		UserID:  booking.UserID,
		Title:   "Booking Accepted",
		Message: "Your homecare booking has been accepted by Dr. " + booking.Doctor.User.FirstName + " " + booking.Doctor.User.LastName,
		Type:    "booking",
		Data:    string(dataJSON),
	}

	_, err := uc.notificationRepo.CreateNotification(notification)
	return err
}

func (uc *NotificationUsecase) NotifyBookingRejected(booking *entity.Booking) error {
	notificationData := map[string]interface{}{
		"booking_id":     booking.ID,
		"service_name":   booking.Service.Name,
		"preferred_date": booking.PreferredDate,
	}

	dataJSON, _ := json.Marshal(notificationData)

	notification := &entity.Notification{
		UserID:  booking.UserID,
		Title:   "Booking Rejected",
		Message: "Your homecare booking has been rejected. Please try booking with another doctor.",
		Type:    "booking",
		Data:    string(dataJSON),
	}

	_, err := uc.notificationRepo.CreateNotification(notification)
	return err
}

func (uc *NotificationUsecase) NotifyNewVisit(visit *entity.HomecareVisit) error {
	notificationData := map[string]interface{}{
		"visit_id":       visit.ID,
		"doctor_name":    visit.Doctor.User.FirstName + " " + visit.Doctor.User.LastName,
		"service_name":   visit.Service.Name,
		"scheduled_date": visit.ScheduledAt,
	}

	dataJSON, _ := json.Marshal(notificationData)

	notification := &entity.Notification{
		UserID:  visit.PatientID,
		Title:   "New Visit Scheduled",
		Message: "Dr. " + visit.Doctor.User.FirstName + " " + visit.Doctor.User.LastName + " has scheduled a homecare visit for you",
		Type:    "visit",
		Data:    string(dataJSON),
	}

	_, err := uc.notificationRepo.CreateNotification(notification)
	return err
}

func toNotificationResponse(notification *entity.Notification) *schema.NotificationResponse {
	return &schema.NotificationResponse{
		ID:        notification.ID,
		UserID:    notification.UserID,
		Title:     notification.Title,
		Message:   notification.Message,
		Type:      notification.Type,
		IsRead:    notification.IsRead,
		Data:      notification.Data,
		CreatedAt: notification.CreatedAt,
		UpdatedAt: notification.UpdatedAt,
	}
}
