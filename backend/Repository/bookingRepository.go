package repository

import (
	"github.com/HMZ-H/Madihome/Domain/entity"
	"github.com/HMZ-H/Madihome/Domain/repository"
	"gorm.io/gorm"
)

type BookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) repository.BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) CreateBooking(booking *entity.Booking) (*entity.Booking, error) {
	err := r.db.Create(booking).Error
	if err != nil {
		return nil, err
	}
	// Preload relationships
	err = r.db.Preload("User").Preload("Service").Preload("Doctor").First(booking, booking.ID).Error
	if err != nil {
		return nil, err
	}
	return booking, nil
}

func (r *BookingRepository) GetBookingByID(id uint) (*entity.Booking, error) {
	var booking entity.Booking
	err := r.db.Preload("User").Preload("Service").Preload("Doctor").First(&booking, id).Error
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *BookingRepository) GetBookingsByUserID(userID uint) ([]*entity.Booking, error) {
	var bookings []*entity.Booking
	err := r.db.Preload("User").Preload("Service").Preload("Doctor").Where("user_id = ?", userID).Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) GetBookingsByDoctorID(doctorID uint) ([]*entity.Booking, error) {
	var bookings []*entity.Booking
	err := r.db.Preload("User").Preload("Service").Preload("Doctor").Where("doctor_id = ?", doctorID).Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) GetBookingsByStatus(status string) ([]*entity.Booking, error) {
	var bookings []*entity.Booking
	err := r.db.Preload("User").Preload("Service").Preload("Doctor").Where("status = ?", status).Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) GetBookingsByServiceID(serviceID uint) ([]*entity.Booking, error) {
	var bookings []*entity.Booking
	err := r.db.Preload("User").Preload("Service").Preload("Doctor").Where("service_id = ?", serviceID).Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) UpdateBooking(booking *entity.Booking) (*entity.Booking, error) {
	err := r.db.Save(booking).Error
	if err != nil {
		return nil, err
	}
	// Preload relationships after update
	err = r.db.Preload("User").Preload("Service").Preload("Doctor").First(booking, booking.ID).Error
	if err != nil {
		return nil, err
	}
	return booking, nil
}

func (r *BookingRepository) DeleteBooking(id uint) error {
	return r.db.Delete(&entity.Booking{}, id).Error
}

func (r *BookingRepository) GetAllBookings() ([]*entity.Booking, error) {
	var bookings []*entity.Booking
	err := r.db.Preload("User").Preload("Service").Preload("Doctor").Find(&bookings).Error
	if err != nil {
		return nil, err
	}
	return bookings, nil
}

