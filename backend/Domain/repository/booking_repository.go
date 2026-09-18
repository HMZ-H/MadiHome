package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type BookingRepository interface {
	CreateBooking(booking *entity.Booking) (*entity.Booking, error)
	GetBookingByID(id uint) (*entity.Booking, error)
	GetBookingsByUserID(userID uint) ([]*entity.Booking, error)
	GetBookingsByDoctorID(doctorID uint) ([]*entity.Booking, error)
	GetBookingsByStatus(status string) ([]*entity.Booking, error)
	GetBookingsByServiceID(serviceID uint) ([]*entity.Booking, error)
	UpdateBooking(booking *entity.Booking) (*entity.Booking, error)
	DeleteBooking(id uint) error
	GetAllBookings() ([]*entity.Booking, error)
}

