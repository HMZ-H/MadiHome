package scheduler

import (
	"log"
	"time"

	"github.com/HMZ-H/Madihome/Domain/repository"
	"github.com/HMZ-H/Madihome/Infrastructure/email"
)

type ReminderScheduler struct {
	bookingRepo  repository.BookingRepository
	emailService *email.EmailService
	stopCh       chan struct{}
}

func NewReminderScheduler(bookingRepo repository.BookingRepository, emailService *email.EmailService) *ReminderScheduler {
	return &ReminderScheduler{
		bookingRepo:  bookingRepo,
		emailService: emailService,
		stopCh:       make(chan struct{}),
	}
}

func (rs *ReminderScheduler) Start() {
	go rs.run()
	log.Println("Appointment reminder scheduler started")
}

func (rs *ReminderScheduler) Stop() {
	close(rs.stopCh)
}

func (rs *ReminderScheduler) run() {
	// Check every 15 minutes
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	// Run immediately on start
	rs.sendReminders()

	for {
		select {
		case <-ticker.C:
			rs.sendReminders()
		case <-rs.stopCh:
			log.Println("Reminder scheduler stopped")
			return
		}
	}
}

func (rs *ReminderScheduler) sendReminders() {
	now := time.Now()
	// Send reminders for appointments in the next 24 hours
	from := now
	to := now.Add(24 * time.Hour)

	bookings, err := rs.bookingRepo.GetUpcomingBookings(from, to)
	if err != nil {
		log.Printf("Reminder scheduler: error fetching upcoming bookings: %v", err)
		return
	}

	for _, booking := range bookings {
		patientName := booking.User.FirstName + " " + booking.User.LastName
		serviceName := booking.Service.Name

		// Get doctor name
		doctorDisplayName := "your assigned doctor"
		if booking.Doctor != nil {
			doctorDisplayName = booking.Doctor.User.FirstName + " " + booking.Doctor.User.LastName
		}

		// Send reminder to patient
		err := rs.emailService.SendAppointmentReminder(
			booking.User.Email,
			patientName,
			serviceName,
			doctorDisplayName,
			booking.PreferredDate,
		)
		if err != nil {
			log.Printf("Reminder scheduler: failed to send patient reminder for booking %d: %v", booking.ID, err)
			continue
		}

		// Send reminder to doctor if assigned
		if booking.Doctor != nil && booking.Doctor.User.Email != "" {
			doctorName := doctorDisplayName
			err = rs.emailService.SendDoctorAppointmentReminder(
				booking.Doctor.User.Email,
				doctorName,
				patientName,
				serviceName,
				booking.PatientAddress,
				booking.PreferredDate,
			)
			if err != nil {
				log.Printf("Reminder scheduler: failed to send doctor reminder for booking %d: %v", booking.ID, err)
			}
		}

		// Mark reminder as sent
		if err := rs.bookingRepo.MarkReminderSent(booking.ID); err != nil {
			log.Printf("Reminder scheduler: failed to mark reminder sent for booking %d: %v", booking.ID, err)
		}

		log.Printf("Reminder sent for booking %d (patient: %s)", booking.ID, patientName)
	}

	if len(bookings) > 0 {
		log.Printf("Reminder scheduler: sent %d reminder(s)", len(bookings))
	}
}

