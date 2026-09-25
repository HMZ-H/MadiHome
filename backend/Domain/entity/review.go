package entity

import "time"

type Review struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	DoctorID  uint      `json:"doctor_id" gorm:"not null;index"`
	BookingID uint      `json:"booking_id" gorm:"not null;uniqueIndex"`
	Rating    int       `json:"rating" gorm:"not null;check:rating >= 1 AND rating <= 5"`
	Comment   string    `json:"comment" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User    User    `json:"user" gorm:"foreignKey:UserID"`
	Doctor  Doctor  `json:"doctor" gorm:"foreignKey:DoctorID"`
	Booking Booking `json:"booking" gorm:"foreignKey:BookingID"`
}
