import React, { useState, useEffect } from 'react';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface Booking {
  id: number;
  service_id: number;
  preferred_date: string;
  status: string;
  patient_address: string;
  latitude: number;
  longitude: number;
  patient_notes: string;
  service?: {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
  };
  doctor?: {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  existingBooking?: Booking;
}

export default function BookingForm({ isOpen, onClose, onSuccess, editMode = false, existingBooking }: BookingFormProps) {
  const [formData, setFormData] = useState({
    serviceId: '',
    preferredDate: '',
    preferredTime: '',
    patientAddress: '',
    latitude: '',
    longitude: '',
    patientNotes: ''
  });
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when in edit mode
  useEffect(() => {
    if (editMode && existingBooking) {
      const appointmentDate = new Date(existingBooking.preferred_date);
      setFormData({
        serviceId: existingBooking.service_id.toString(),
        preferredDate: appointmentDate.toISOString().split('T')[0],
        preferredTime: appointmentDate.toTimeString().split(' ')[0].substring(0, 5),
        patientAddress: existingBooking.patient_address,
        latitude: existingBooking.latitude?.toString() || '',
        longitude: existingBooking.longitude?.toString() || '',
        patientNotes: existingBooking.patient_notes
      });
    } else if (!editMode) {
      // Reset form for new bookings
      setFormData({
        serviceId: '',
        preferredDate: '',
        preferredTime: '',
        patientAddress: '',
        latitude: '',
        longitude: '',
        patientNotes: ''
      });
    }
  }, [editMode, existingBooking, isOpen]);

  // Fetch available services
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
	    try {
	      const response = await fetch('http://localhost:8080/api/services');
	      if (response.ok) {
	        const data = await response.json();
	        // Support either { data: [...] } or direct array
	        const items = Array.isArray(data) ? data : (data.data || []);
	        setServices(items);
	      } else {
	        console.error('Failed to load services. Status:', response.status);
	      }
	    } catch (err) {
	      console.error('Error fetching services:', err);
	    }
	  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter address manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Combine date and time
      const dateTime = `${formData.preferredDate}T${formData.preferredTime}:00Z`;

      const bookingData = {
        service_id: parseInt(formData.serviceId),
        preferred_date: dateTime,
        patient_address: formData.patientAddress,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        patient_notes: formData.patientNotes
      };

      let response;
      if (editMode && existingBooking) {
        // UPDATE existing booking
        response = await fetch(`http://localhost:8080/api/user/bookings/${existingBooking.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
      } else {
        // CREATE new booking
        response = await fetch('http://localhost:8080/api/user/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log(editMode ? 'Booking updated:' : 'Booking created:', result);
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          serviceId: '',
          preferredDate: '',
          preferredTime: '',
          patientAddress: '',
          latitude: '',
          longitude: '',
          patientNotes: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editMode ? 'update' : 'create'} booking`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editMode ? 'update' : 'create'} booking`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {editMode ? 'Reschedule Booking' : 'Book New Homecare Visit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service *
            </label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              required
              disabled={editMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Choose a service...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time *
              </label>
              <input
                type="time"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Address *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="patientAddress"
                value={formData.patientAddress}
                onChange={handleChange}
                required
                placeholder="Enter your full address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleLocationClick}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                📍 Use My Location
              </button>
            </div>
            {(formData.latitude && formData.longitude) && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Location detected: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="patientNotes"
              value={formData.patientNotes}
              onChange={handleChange}
              rows={3}
              placeholder="Any special requirements or notes for the doctor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (editMode ? 'Updating Booking...' : 'Creating Booking...') 
                : (editMode ? 'Update Booking' : 'Create Booking')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
