import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import InteractiveMap from '../components/InteractiveMap';
import NotificationBell from '../components/NotificationBell';
import AddServiceForm from '../components/AddServiceForm';
import ScheduleVisitForm from '../components/ScheduleVisitForm';
import { Search } from 'lucide-react';


interface DoctorStats {
  activePatients: number;
  completedVisits: number;
  pendingRequests: number;
  responseTime: number; // in minutes
}

interface Booking {
  id: number;
  patient_name: string;
  patient_email: string;
  service_name: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  urgency: 'low' | 'medium' | 'high';
  requested_time: string;
  patient_address: string;
  latitude?: number;
  longitude?: number;
  patient_notes?: string;
  doctor_notes?: string;
  created_at: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
  created_at: string;
}

interface Service {
  id: number;
  doctor_id?: number | null;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Visit {
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

export default function DoctorDashboard() {
  const { show } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<Patient | null>(null);
  const [stats, setStats] = useState<DoctorStats>({
    activePatients: 0,
    completedVisits: 0,
    pendingRequests: 0,
    responseTime: 0
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [statsLoading, setStatsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesToEdit, setServicesToEdit] = useState<Service | null>(null);
  const [showEditServiceForm, setShowEditServiceForm] = useState(false);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<number | null>(null);
  const [showDeleteServiceConfirm, setShowDeleteServiceConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = !bookingSearch ||
        b.patient_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.service_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.patient_address.toLowerCase().includes(bookingSearch.toLowerCase());
      const matchesStatus = !bookingStatusFilter || b.status === bookingStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);
  const [showAddVisitForm, setShowAddVisitForm] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<Visit | null>(null);
  const [showEditVisitForm, setShowEditVisitForm] = useState(false);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // Fetch doctor statistics
  const fetchDoctorStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch patients count
      const patientsResponse = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const patientsData = await patientsResponse.json();
      const activePatients = patientsData.data?.length || 0;

      // Fetch visits count
      const visitsResponse = await fetch(`${API_BASE_URL}/api/doctor/visits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const visitsData = await visitsResponse.json();
      const completedVisits = visitsData.data?.filter((visit: { status: string }) => visit.status === 'completed').length || 0;

      // Fetch pending bookings count
      const bookingsResponse = await fetch(`${API_BASE_URL}/api/doctor/bookings/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingsData = await bookingsResponse.json();
      const pendingRequests = bookingsData.data?.length || 0;

      // Calculate average response time (simplified - in real app, you'd calculate from timestamps)
      const responseTime = 12; // This would be calculated from actual booking timestamps

      setStats({
        activePatients,
        completedVisits,
        pendingRequests,
        responseTime
      });
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch doctor bookings (both assigned and pending)
  const fetchDoctorBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch both assigned bookings and pending bookings
      const [assignedResponse, pendingResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/doctor/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/doctor/bookings/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      let allBookings: Booking[] = [];
      
      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json();
        allBookings = [...allBookings, ...(assignedData.data || [])];
      }
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        allBookings = [...allBookings, ...(pendingData.data || [])];
      }
      
      // Transform the data to match the frontend interface
      const transformedBookings = allBookings.map((booking: {
        id: number;
        user?: { first_name: string; last_name: string; email: string };
        service?: { name: string };
        status: string;
        urgency?: string;
        preferred_date?: string;
        patient_address?: string;
        latitude?: number;
        longitude?: number;
        patient_notes?: string;
        doctor_notes?: string;
        created_at: string;
      }) => ({
        id: booking.id,
        patient_name: booking.user ? `${booking.user.first_name} ${booking.user.last_name}` : 'Unknown Patient',
        patient_email: booking.user?.email || '',
        service_name: booking.service?.name || 'Unknown Service',
        status: booking.status as 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected',
        urgency: (booking.urgency || 'low') as 'low' | 'medium' | 'high',
        requested_time: booking.preferred_date ? new Date(booking.preferred_date).toLocaleString() : '',
        patient_address: booking.patient_address || '',
        latitude: booking.latitude,
        longitude: booking.longitude,
        patient_notes: booking.patient_notes || '',
        doctor_notes: booking.doctor_notes || '',
        created_at: booking.created_at
      }));
      
      // Sort by creation date (newest first)
      transformedBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch doctor patients
  const fetchDoctorPatients = useCallback(async () => {
    try {
      setPatientsLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Patients API response:', data);
        // Ensure patients is always an array
        const patientsArray = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setPatients(patientsArray);
      } else {
        console.error('Failed to fetch patients');
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch doctor services
  const fetchDoctorServices = useCallback(async () => {
    try {
      setServicesLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/doctor/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        console.error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setServicesLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch doctor visits
  const fetchDoctorVisits = useCallback(async () => {
    try {
      setVisitsLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/doctor/visits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisits(data.data || []);
      } else {
        console.error('Failed to fetch visits');
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setVisitsLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    // Check if user is logged in and is a doctor
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUserData(parsedUser);
    console.log('DoctorDashboard - User role:', parsedUser.role);
    
    // Redirect to appropriate dashboard based on role
    if (parsedUser.role === 'user' || parsedUser.role === 'patient') {
      console.log('User is a patient, redirecting to patient dashboard');
      window.location.href = '/patient-dashboard';
      return;
    } else if (parsedUser.role === 'super_admin') {
      console.log('User is a super admin, redirecting to super admin dashboard');
      window.location.href = '/super-admin-dashboard';
      return;
    } else if (parsedUser.role && parsedUser.role !== 'doctor') {
      console.log('Invalid role, redirecting to login');
      // Redirect to login if not a valid role
      window.location.href = '/login';
      return;
    }

    setIsLoading(false);
    
    // Fetch data after authentication check
    fetchDoctorStats();
    fetchDoctorBookings();
    fetchDoctorPatients();
    fetchDoctorServices();
    fetchDoctorVisits();
  }, [fetchDoctorStats, fetchDoctorBookings, fetchDoctorPatients, fetchDoctorServices, fetchDoctorVisits]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Handle booking actions
  const handleAcceptBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/doctor/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'accepted',
          doctor_notes: 'Booking accepted by doctor'
        })
      });

      if (response.ok) {
        fetchDoctorBookings();
        show('✅ Booking accepted successfully!', 'success');
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Unknown error';
        
        if (response.status === 400) {
          errorMessage = 'Bad request - Invalid data sent';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized - Please login again';
        } else if (response.status === 404) {
          errorMessage = 'Booking not found';
        } else if (response.status === 500) {
          errorMessage = 'Server error - Please try again later';
        }
        
        show(`❌ Failed to accept booking. ${errorMessage}`, 'error');
      }
    } catch (error) {
      show(`Error accepting booking: ${error instanceof Error ? error.message : 'Unknown error'}`,'error');
    }
  };

  const handleCompleteBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh bookings and stats
        fetchDoctorBookings();
        fetchDoctorStats();
        alert('Booking completed successfully!');
      } else {
        alert('Failed to complete booking');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      alert('Error completing booking');
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    setBookingToReject(bookingId);
    setShowRejectConfirm(true);
  };

  const confirmRejectBooking = async () => {
    if (!bookingToReject) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/bookings/${bookingToReject}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'rejected',
          doctor_notes: 'Booking rejected by doctor'
        })
      });

      if (response.ok) {
        fetchDoctorBookings();
        show('✅ Booking rejected successfully!', 'success');
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Unknown error';
        
        if (response.status === 400) {
          errorMessage = 'Bad request - Invalid data sent';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized - Please login again';
        } else if (response.status === 404) {
          errorMessage = 'Booking not found';
        } else if (response.status === 500) {
          errorMessage = 'Server error - Please try again later';
        }
        
        show(`❌ Failed to reject booking. ${errorMessage}`, 'error');
      }
    } catch (error) {
      show(`Error rejecting booking: ${error instanceof Error ? error.message : 'Unknown error'}`,'error');
    } finally {
      setShowRejectConfirm(false);
      setBookingToReject(null);
    }
  };

  const handleViewBooking = (bookingId: number) => {
    // Navigate to booking details or open modal
    console.log('View booking:', bookingId);
    alert(`View booking details for ID: ${bookingId}`);
  };


  // Handle service actions
  const handleEditService = (service: Service) => {
    setServicesToEdit(service);
    setShowEditServiceForm(true);
  };

  const handleDeleteService = (serviceId: number) => {
    setServiceToDelete(serviceId);
    setShowDeleteServiceConfirm(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/services/${serviceToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh services
        fetchDoctorServices();
        alert('Service deleted successfully!');
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service');
    } finally {
      setShowDeleteServiceConfirm(false);
      setServiceToDelete(null);
    }
  };

  // Handle visit actions
  const handleCreateVisit = () => {
    setShowAddVisitForm(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setVisitToEdit(visit);
    setShowEditVisitForm(true);
  };

  const handleUpdateVisitStatus = async (visitId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh visits
        fetchDoctorVisits();
        alert(`Visit ${newStatus} successfully!`);
      } else {
        alert(`Failed to ${newStatus} visit`);
      }
    } catch (error) {
      console.error(`Error updating visit status:`, error);
      alert(`Error updating visit status`);
    }
  };

  const handleDeleteVisit = async (visitId: number) => {
    if (!confirm('Are you sure you want to delete this visit?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/doctor/visits/${visitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh visits
        fetchDoctorVisits();
        alert('Visit deleted successfully!');
      } else {
        alert('Failed to delete visit');
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Error deleting visit');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-14">
        <Link to="/" className="flex items-center">
          <Logo size="sm" variant="simple" />
        </Link>
     <div className="flex items-center gap-4">
       <NotificationBell />
       <Link to="/" className="text-gray-600 hover:text-emerald-600 text-sm">Home</Link>
       <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Logout</button>
     </div>
      </div>
    </nav>

    {/* Page Header */}
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {userData?.first_name} {userData?.last_name}</p>
      </div>
    </div>


      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'patients'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Patients
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'visits'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visits
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : stats.activePatients}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Visits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : stats.completedVisits}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : stats.pendingRequests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statsLoading ? '...' : `${stats.responseTime}min`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map Section - Only for Doctors */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-medium mb-3">
              🏠 Doctor Team Management
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-3">
              Patient Booking <span className="text-emerald-600">Dashboard</span>
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              View patient booking locations and manage your homecare team. 
              Blue markers show your medical team, colored markers show patient requests with urgency levels.
              <br />
              <span className="text-emerald-600 font-medium">✓ Completed treatments remain visible on the map until the next booking.</span>
            </p>
            
            {/* Production Navigation Features */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={() => {
                  const activeBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'in_progress');
                  if (activeBookings.length === 0) {
                    alert('No active bookings to optimize route');
                    return;
                  }
                  
                  // Create optimized route URL for Google Maps
                  const waypoints = activeBookings
                    .filter(b => b.latitude && b.longitude)
                    .map(b => `${b.latitude},${b.longitude}`)
                    .join('|');
                  
                  if (waypoints) {
                    window.open(`https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`, '_blank');
                  }
                }}
              >
                🗺️ Optimize Route
              </button>
              
              <button 
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
                onClick={() => {
                  const activeBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'in_progress');
                  if (activeBookings.length === 0) {
                    alert('No active bookings to optimize route');
                    return;
                  }
                  
                  // Create optimized route URL for Waze
                  const waypoints = activeBookings
                    .filter(b => b.latitude && b.longitude)
                    .map(b => `${b.latitude},${b.longitude}`)
                    .join(',');
                  
                  if (waypoints) {
                    window.open(`https://waze.com/ul?ll=${waypoints}&navigate=yes`, '_blank');
                  }
                }}
              >
                🚗 Waze Route
              </button>
              
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                onClick={() => {
                  // Show route summary
                  const activeBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'in_progress');
                  const completedToday = bookings.filter(b => b.status === 'completed' && 
                    new Date(b.created_at).toDateString() === new Date().toDateString()).length;
                  
                  alert(`Route Summary:\n• Active visits: ${activeBookings.length}\n• Completed today: ${completedToday}\n• Total patients: ${bookings.length}`);
                }}
              >
                📊 Route Summary
              </button>
            </div>
          </div>
          
          <div className="w-full overflow-hidden rounded-lg">
            <InteractiveMap 
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              height="350px"
              bookings={bookings}
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
            />
          </div>
          
          {selectedLocation && (
            <div className="mt-4 p-3 bg-emerald-600 text-white rounded-lg">
              <h3 className="font-bold mb-1 text-sm">📍 Location Selected!</h3>
              <p className="text-xs">
                Coordinates: {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)}
              </p>
              <button className="mt-2 bg-white text-emerald-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                Accept Booking at This Location
              </button>
            </div>
          )}
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Patient Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.patient_name}</div>
                        <div className="text-sm text-gray-500">{booking.patient_email}</div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.service_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          booking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.urgency === 'high' ? 'bg-red-100 text-red-800' :
                          booking.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {booking.urgency ? booking.urgency.charAt(0).toUpperCase() + booking.urgency.slice(1) : 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.requested_time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAcceptBooking(booking.id)}
                              className="text-green-600 hover:text-green-700 mr-3"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRejectBooking(booking.id)}
                              className="text-red-600 hover:text-red-700 mr-3"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'accepted' && (
                          <button 
                            onClick={() => handleAcceptBooking(booking.id)}
                            className="text-emerald-600 hover:text-blue-700 mr-3"
                          >
                            Start Visit
                          </button>
                        )}
                        {booking.status === 'in_progress' && (
                          <button 
                            onClick={() => handleCompleteBooking(booking.id)}
                            className="text-emerald-600 hover:text-blue-700 mr-3"
                          >
                            Complete
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewBooking(booking.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Patient Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Loading patients...
                      </td>
                    </tr>
                  ) : !Array.isArray(patients) || patients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No patients found
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.email}</div>
                          <div className="text-sm text-gray-500">{patient.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            patient.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {patient.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(patient.created_at).toLocaleDateString()}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-emerald-600 hover:text-blue-700 mr-3">View</button>
                          <button className="text-gray-600 hover:text-gray-900">Contact</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Recent Patient Bookings</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage patient booking requests. Accept pending bookings or reject them with confirmation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patient, service, address..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookingsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading bookings...
                  </td>
                </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        {bookingSearch || bookingStatusFilter ? 'No bookings match your filters' : 'No bookings found'}
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.patient_name}</div>
                          <div className="text-sm text-gray-500">{booking.patient_email}</div>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.service_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            booking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.urgency === 'high' ? 'bg-red-100 text-red-800' :
                            booking.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {booking.urgency ? booking.urgency.charAt(0).toUpperCase() + booking.urgency.slice(1) : 'Normal'}
                    </span>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.requested_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleAcceptBooking(booking.id)}
                                className="text-green-600 hover:text-green-700 mr-3"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleRejectBooking(booking.id)}
                                className="text-red-600 hover:text-red-700 mr-3"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {booking.status === 'accepted' && (
                            <button 
                              onClick={() => handleAcceptBooking(booking.id)}
                              className="text-emerald-600 hover:text-blue-700 mr-3"
                            >
                              Start Visit
                            </button>
                          )}
                          {booking.status === 'in_progress' && (
                            <button 
                              onClick={() => handleCompleteBooking(booking.id)}
                              className="text-emerald-600 hover:text-blue-700 mr-3"
                            >
                              Complete
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewBooking(booking.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Homecare Services</h3>
              <button onClick={() => setShowAddServiceForm(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Add New Service
              </button>
            </div>
            {showAddServiceForm && (
              <AddServiceForm
                isOpen={showAddServiceForm}
                onClose={() => setShowAddServiceForm(false)}
                onSuccess={() => {
                  // Refresh services after successful addition
                  fetchDoctorServices();
                  setShowAddServiceForm(false);
                }}
              />
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {servicesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading services...
                  </td>
                </tr>
                  ) : services.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No services found
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{service.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${service.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {service.duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEditService(service)}
                            className="text-emerald-600 hover:text-blue-700 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Homecare Visits</h3>
              <button 
                onClick={handleCreateVisit}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Schedule New Visit
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading visits...
                      </td>
                    </tr>
                  ) : visits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No visits found
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr key={visit.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{visit.patient_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.service_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            visit.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {visit.status.charAt(0).toUpperCase() + visit.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(visit.scheduled_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visit.notes || 'No notes'}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {visit.status === 'scheduled' && (
                      <button 
                        onClick={() => handleUpdateVisitStatus(visit.id, 'in_progress')}
                        className="text-blue-600 hover:text-blue-700 mr-3"
                      >
                        Start
                      </button>
                    )}
                    {visit.status === 'in_progress' && (
                      <button 
                        onClick={() => handleUpdateVisitStatus(visit.id, 'completed')}
                        className="text-green-600 hover:text-green-700 mr-3"
                      >
                        Complete
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditVisit(visit)}
                      className="text-emerald-600 hover:text-emerald-700 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteVisit(visit.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Reject Booking</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to reject this booking? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={confirmRejectBooking}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mr-2"
                  >
                    Yes, Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectConfirm(false);
                      setBookingToReject(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Service Confirmation Modal */}
        {showDeleteServiceConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Service</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this service? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={confirmDeleteService}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mr-2"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteServiceConfirm(false);
                      setServiceToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Service Form Modal */}
        {showEditServiceForm && (
          <AddServiceForm
            isOpen={showEditServiceForm}
            onClose={() => setShowEditServiceForm(false)}
            onSuccess={() => {
              fetchDoctorServices();
              setShowEditServiceForm(false);
            }}
            editMode={true}
            existingService={servicesToEdit || undefined}
          />
        )}

        {/* Schedule Visit Form Modal */}
        {showAddVisitForm && (
          <ScheduleVisitForm
            isOpen={showAddVisitForm}
            onClose={() => setShowAddVisitForm(false)}
            onSuccess={() => {
              fetchDoctorVisits();
              setShowAddVisitForm(false);
            }}
          />
        )}

        {/* Edit Visit Form Modal */}
        {showEditVisitForm && (
          <ScheduleVisitForm
            isOpen={showEditVisitForm}
            onClose={() => setShowEditVisitForm(false)}
            onSuccess={() => {
              fetchDoctorVisits();
              setShowEditVisitForm(false);
            }}
            editMode={true}
            existingVisit={visitToEdit || undefined}
          />
        )}
      </div>
    </div>
  );
}
