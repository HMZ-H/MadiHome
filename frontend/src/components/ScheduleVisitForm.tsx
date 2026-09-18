import React, { useState, useEffect } from 'react';

export interface Visit {
  id: number;
  patient_id: number;
  doctor_id: number;
  service_id: number;
  patient_name: string;
  service_name: string;
  status: string;
  scheduled_date: string;
  notes: string;
  created_at: string;
}

export interface ScheduleVisitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (visit: Visit) => void;
  editMode?: boolean;
  existingVisit?: Visit;
}

interface VisitFormData {
  patient_id: number | '';
  service_id: number | '';
  scheduled_date: string;
  notes: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ScheduleVisitForm({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  existingVisit,
}: ScheduleVisitFormProps) {
  const [formData, setFormData] = useState<VisitFormData>({
    patient_id: '',
    service_id: '',
    scheduled_date: '',
    notes: '',
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editMode && existingVisit) {
      setFormData({
        patient_id: existingVisit.patient_id || '',
        service_id: existingVisit.service_id || '',
        scheduled_date: existingVisit.scheduled_date ? new Date(existingVisit.scheduled_date).toISOString().slice(0, 16) : '',
        notes: existingVisit.notes || '',
      });
    } else {
      setFormData({
        patient_id: '',
        service_id: '',
        scheduled_date: '',
        notes: '',
      });
    }
  }, [editMode, existingVisit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log('ScheduleVisitForm: Opening form');
      setLoading(true);
      setError('');
      
      const loadData = async () => {
        try {
          await Promise.all([fetchPatients(), fetchServices()]);
        } catch (error) {
          console.error('Error loading form data:', error);
          setError('Failed to load form data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      } else {
        console.error('Failed to fetch patients:', response.status);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        console.error('Failed to fetch services:', response.status);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  if (!isOpen) return null;

  console.log('ScheduleVisitForm: Rendering form', { 
    isOpen, 
    editMode, 
    patientsCount: patients.length, 
    servicesCount: services.length,
    loading,
    error 
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'patient_id' || name === 'service_id' 
        ? (value === '' ? '' : Number(value))
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.patient_id || !formData.service_id || !formData.scheduled_date) {
      setError('Please fill all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      const url = editMode && existingVisit
        ? `${API_BASE_URL}/api/doctor/visits/${existingVisit.id}`
        : `${API_BASE_URL}/api/doctor/visits`;
      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          booking_id: 0, // For direct scheduling, we can use 0 or create a dummy booking
          user_id: Number(formData.patient_id),
          service_id: Number(formData.service_id),
          care_plan_id: null,
          scheduled_at: new Date(formData.scheduled_date).toISOString(),
          notes: formData.notes || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to save visit');
      }

      onSuccess?.(data.data || data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {editMode ? 'Update Visit' : 'Schedule New Visit'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading patients and services...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a patient</option>
              {patients && patients.length > 0 ? patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.email})
                </option>
              )) : (
                <option value="" disabled>No patients available</option>
              )}
            </select>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service *
            </label>
            <select
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a service</option>
              {services && services.length > 0 ? services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration} min)
                </option>
              )) : (
                <option value="" disabled>No services available</option>
              )}
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Additional notes for this visit..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (editMode ? 'Updating...' : 'Scheduling...') : (editMode ? 'Update Visit' : 'Schedule Visit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
