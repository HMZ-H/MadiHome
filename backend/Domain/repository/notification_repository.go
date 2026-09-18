package repository

import "github.com/HMZ-H/Madihome/Domain/entity"

type NotificationRepository interface {
	CreateNotification(notification *entity.Notification) (*entity.Notification, error)
	GetNotificationsByUserID(userID uint) ([]*entity.Notification, error)
	GetUnreadNotificationsByUserID(userID uint) ([]*entity.Notification, error)
	MarkNotificationAsRead(notificationID uint) error
	MarkAllNotificationsAsRead(userID uint) error
	DeleteNotification(notificationID uint) error
	GetNotificationByID(notificationID uint) (*entity.Notification, error)
}
