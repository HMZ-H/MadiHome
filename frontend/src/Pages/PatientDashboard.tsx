import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Bell } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import Navbar from '../components/Navbar';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
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
  doctor_notes?: string;
  estimated_price?: number;
  actual_price?: number;
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

interface PatientNotification {
  id: number;
  title: string;
  message: string;
  type: 'booking' | 'visit' | 'system';
  is_read: boolean;
  created_at: string;
}

function PatientNotifications() {
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/user/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications((data.data || []).slice(0, 10));
      }
    } catch { /* silent */ }
  }, [API_BASE_URL]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = API_BASE_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`${wsProtocol}://${wsHost}/api/ws?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const evt = JSON.parse(event.data);
        if (evt.type === 'notification' && evt.content) {
          const n: PatientNotification = JSON.parse(evt.content);
          setNotifications(prev => [n, ...prev].slice(0, 10));
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      wsRef.current = null;
      reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
    };
    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearInterval(interval);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchNotifications, connectWebSocket]);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/api/user/notifications/${id}/read`, {
      method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const typeColors: Record<string, { bg: string; dot: string }> = {
    booking: { bg: 'bg-blue-50', dot: 'bg-blue-500' },
    visit: { bg: 'bg-green-50', dot: 'bg-green-500' },
    system: { bg: 'bg-gray-50', dot: 'bg-gray-500' },
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-6">
        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map(n => {
        const colors = typeColors[n.type] || typeColors.system;
        return (
          <button
            key={n.id}
            onClick={() => !n.is_read && markAsRead(n.id)}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors ${
              n.is_read ? 'bg-gray-50' : colors.bg
            }`}
          >
            {!n.is_read && <div className={`w-2 h-2 ${colors.dot} rounded-full mt-2 flex-shrink-0`} />}
            {n.is_read && <div className="w-2 h-2 mt-2 flex-shrink-0" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{n.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function PatientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = !bookingSearch ||
        (b.service?.name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
        (b.doctor ? `${b.doctor.first_name} ${b.doctor.last_name}` : '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.patient_address.toLowerCase().includes(bookingSearch.toLowerCase());
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, bookingSearch, statusFilter]);


  useEffect(() => {
    // Check if user is logged in and is a patient
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    console.log('Dashboard useEffect - Token:', token ? 'Present' : 'Missing');
    console.log('Dashboard useEffect - UserData:', userData);
    
    if (!token || !userData) {
      console.log('No token or user data, redirecting to login');
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Parsed user:', parsedUser);
      console.log('User role:', parsedUser.role);
      
      // Redirect to appropriate dashboard based on role
      if (parsedUser.role === 'doctor') {
        console.log('User is a doctor, redirecting to doctor dashboard');
        window.location.href = '/doctor-dashboard';
        return;
      } else if (parsedUser.role === 'super_admin') {
        console.log('User is a super admin, redirecting to super admin dashboard');
        window.location.href = '/super-admin-dashboard';
        return;
      } else if (parsedUser.role && parsedUser.role !== 'user' && parsedUser.role !== 'patient') {
        console.log('Invalid role, redirecting to login');
        // Redirect to login if not a valid role
        window.location.href = '/login';
        return;
      }

      setUser(parsedUser);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.clear();
      window.location.href = '/login';
    }
  }, []);
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      console.log('=== FETCH BOOKINGS DEBUG ===');
      console.log('User data:', userData);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('No access token found');
        setError('Please log in again');
        return;
      }
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('User role:', parsedUser.role);
        console.log('User ID:', parsedUser.id);
      }
      
      console.log('Making API request to: http://localhost:8080/api/user/bookings');
      const response = await fetch('http://localhost:8080/api/user/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // If 401, redirect to login
        if (response.status === 401) {
          console.log('401 Unauthorized - clearing storage and redirecting');
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        
        // If 403, show specific error
        if (response.status === 403) {
          console.log('403 Forbidden - role issue');
          setError('Access denied. Please contact support.');
          return;
        }
        
        throw new Error(`Failed to fetch bookings: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      setBookings(data.data || []);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Unable to load appointments. Please try again.')
    } finally {
      setIsLoadingBookings(false);
    }
  }

  const refreshBookings = () => {
    fetchBookings();
  }

  // Booking Details Modal Component
  const BookingDetailsModal = ({ booking, isOpen, onClose }: { 
    booking: Booking | null; 
    isOpen: boolean; 
    onClose: () => void; 
  }) => {
    if (!booking || !isOpen) return null;

    const appointmentDate = new Date(booking.preferred_date);
    
    const getStatusColor = () => {
      switch (booking.status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'accepted': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'completed': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            {/* Service Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-800">{booking.service?.name || 'Homecare Service'}</p>
                {booking.service?.description && (
                  <p className="text-sm text-gray-600 mt-1">{booking.service.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  {booking.service?.duration && (
                    <span>Duration: {booking.service.duration} minutes</span>
                  )}
                  {booking.service?.price && (
                    <span>Price: ${booking.service.price}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            {booking.doctor && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Assigned Doctor</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-800">
                    Dr. {booking.doctor.first_name} {booking.doctor.last_name}
                  </p>
                  {booking.doctor.specialization && (
                    <p className="text-sm text-gray-600 mt-1">{booking.doctor.specialization}</p>
                  )}
                </div>
              </div>
            )}

            {/* Appointment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Appointment Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{appointmentDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right max-w-xs">{booking.patient_address}</span>
                </div>
                {booking.latitude && booking.longitude && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-sm">
                      {booking.latitude.toFixed(4)}, {booking.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {booking.patient_notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Patient Notes</h3>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-gray-700">{booking.patient_notes}</p>
                </div>
              </div>
            )}

            {/* Doctor Notes */}
            {booking.doctor_notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Doctor Notes</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700">{booking.doctor_notes}</p>
                </div>
              </div>
            )}

            {/* Pricing Information */}
            {(booking.estimated_price || booking.actual_price) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Pricing</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {booking.estimated_price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Price:</span>
                      <span className="font-medium">${booking.estimated_price}</span>
                    </div>
                  )}
                  {booking.actual_price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Price:</span>
                      <span className="font-medium">${booking.actual_price}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {booking.status === 'pending' && (
              <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                Reschedule
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (isLoadingBookings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Patient Dashboard Header */}
      <Navbar />
    
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">My Home<span className="text-emerald-600">care</span></h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.first_name} {user?.last_name}</p>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to Your Homecare Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              Manage your homecare appointments and track your medical visits
            </p>
            <button 
              onClick={() => setShowBookingForm(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Book New Homecare Visit
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Visits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bookings.filter(booking => 
                    booking.status === 'pending' || booking.status === 'accepted'
                  ).length}
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
                  {bookings.filter(booking => booking.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Appointments */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">My Appointments</h3>
          </div>
          {/* Search & Filter Bar */}
          <div className="px-6 pt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by service, doctor, address..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="p-6">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">
                  {bookingSearch || statusFilter ? 'No appointments match your filters' : 'No appointments scheduled'}
                </p>
                <p className="text-gray-400 text-sm">
                  {bookingSearch || statusFilter ? (
                    <button onClick={() => { setBookingSearch(''); setStatusFilter(''); }} className="text-emerald-600 hover:underline">
                      Clear filters
                    </button>
                  ) : 'Book your first homecare visit to get started'}
                </p>
              </div>
            ) : (
              filteredBookings
                .sort((a, b) => new Date(b.preferred_date).getTime() - new Date(a.preferred_date).getTime())
                .map((booking) => {
                  const appointmentDate = new Date(booking.preferred_date);
                  const isToday = appointmentDate.toDateString() === new Date().toDateString();
                  const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  
                  const getDateText = () => {
                    if (isToday) return 'Today';
                    if (isTomorrow) return 'Tomorrow';
                    return appointmentDate.toLocaleDateString();
                  };

                  const getTimeText = () => {
                    return appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  };

                  const getStatusColor = () => {
                    switch (booking.status) {
                      case 'pending': return 'bg-yellow-100 text-yellow-800';
                      case 'accepted': return 'bg-green-100 text-green-800';
                      case 'rejected': return 'bg-red-100 text-red-800';
                      case 'completed': return 'bg-blue-100 text-blue-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };

                  return (
                    <div key={booking.id} className="p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                              {booking.service?.name || 'Homecare Service'}
                              {booking.doctor && ` - Dr. ${booking.doctor.first_name} ${booking.doctor.last_name}`}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor()}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {getDateText()}, {getTimeText()}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{booking.patient_address}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowBookingDetails(true);
                              }}
                              className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-emerald-700 transition-colors"
                            >
                              View Details
                            </button>
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setBookingToReschedule(booking);
                                  setShowRescheduleForm(true);
                                }}
                                className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-300 transition-colors"
                              >
                                Reschedule
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Recent Activity & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              ) : (
                bookings
                  .sort((a, b) => new Date(b.preferred_date).getTime() - new Date(a.preferred_date).getTime())
                  .slice(0, 3)
                  .map((booking) => {
                    const appointmentDate = new Date(booking.preferred_date);
                    const isToday = appointmentDate.toDateString() === new Date().toDateString();
                    const isYesterday = appointmentDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
                    
                    const getDateText = () => {
                      if (isToday) return 'Today';
                      if (isYesterday) return 'Yesterday';
                      return appointmentDate.toLocaleDateString();
                    };

                    const getStatusIcon = () => {
                      switch (booking.status) {
                        case 'pending': return '⏳';
                        case 'accepted': return '✅';
                        case 'completed': return '🏥';
                        case 'rejected': return '❌';
                        default: return '📅';
                      }
                    };

                    return (
                      <div key={booking.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{getStatusIcon()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {booking.service?.name || 'Homecare Service'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getDateText()} • {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Notifications</h3>
            <PatientNotifications />
          </div>
        </div>

        {/* Quick Stats & Help/Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'completed').length > 0 ? '100%' : '0%'}
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {bookings.filter(b => b.status === 'pending' || b.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-600">Active Bookings</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {bookings.length > 0 ? Math.round(bookings.reduce((acc, b) => acc + (b.service?.duration || 0), 0) / bookings.length) : 0}
                </div>
                <div className="text-sm text-gray-600">Avg. Duration (min)</div>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Help & Support</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">How to Book</p>
                    <p className="text-xs text-gray-600">Learn how to book appointments</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Guide
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contact Support</p>
                    <p className="text-xs text-gray-600">Get help from our team</p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  Contact
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">FAQ</p>
                    <p className="text-xs text-gray-600">Frequently asked questions</p>
                  </div>
                </div>
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  View FAQ
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Book New Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      <BookingForm
        isOpen={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        onSuccess={() => {
          // Refresh bookings after successful booking
          refreshBookings();
          setShowBookingForm(false);
        }}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={showBookingDetails}
        onClose={() => {
          setShowBookingDetails(false);
          setSelectedBooking(null);
        }}
      />

      {/* Reschedule Form Modal */}
      <BookingForm
        isOpen={showRescheduleForm}
        onClose={() => {
          setShowRescheduleForm(false);
          setBookingToReschedule(null);
        }}
        onSuccess={() => {
          refreshBookings();
          setShowRescheduleForm(false);
          setBookingToReschedule(null);
        }}
        editMode={true}
        existingBooking={bookingToReschedule || undefined}
      />
    </div>
  );
}
