import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Medical service type definition
interface MedicalService {
  id: number;
  name: string;
  type: string;
  position: [number, number];
  services: string[];
  available: boolean;
}

// Patient booking type definition
interface PatientBooking {

  id: number;
  patient_name: string;
  patient_email: string;
  service_name: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
  urgency: 'low' | 'medium' | 'high';
  patient_notes?: string;
  doctor_notes?: string;
  requested_time: string;
  patient_address: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

// Main doctor and team (example data for Addis Ababa)
const medicalServices: MedicalService[] = [
  {
    id: 1,
    name: "Dr. Mohammed - Main Doctor",
    type: "Main Doctor",
    position: [9.0192, 38.7525],
    services: ["General Practice", "Home Visits", "Team Management"],
    available: true
  },
  {
    id: 2,
    name: "Dr. Sarah - Team Doctor",
    type: "Team Doctor", 
    position: [9.0054, 38.7636],
    services: ["Pediatrics", "Child Care", "Home Visits"],
    available: true
  },
  {
    id: 3,
    name: "Dr. Ahmed - Team Doctor",
    type: "Team Doctor",
    position: [9.0123, 38.7456],
    services: ["Cardiology", "Heart Care", "Home Monitoring"],
    available: true
  },
  {
    id: 4,
    name: "Nurse Fatima - Team Nurse",
    type: "Team Nurse",
    position: [9.0089, 38.7589],
    services: ["Wound Care", "Medication", "Health Check"],
    available: true
  }
];

// Default coordinates for Addis Ababa when no coordinates are provided
const DEFAULT_COORDINATES = [9.0192, 38.7525];

// Custom homecare icons
const createMedicalIcon = (type: string, available: boolean) => {
  const color = available ? '#0077B6' : '#6B7280';
  const iconHtml = type === 'Main Doctor' ? '👨‍⚕️' : 
                   type === 'Team Doctor' ? '👩‍⚕️' : 
                   type === 'Team Nurse' ? '👩‍⚕️' : '🏥';
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${iconHtml}</div>`,
    className: 'custom-medical-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// Custom patient booking icons
const createPatientIcon = (status: string, urgency: string) => {
  const statusColors = {
    'pending': '#FFA500',
    'accepted': '#32CD32', 
    'in_progress': '#1E90FF',
    'completed': '#4CAF50', // Changed to green to show treatment completed
    'rejected': '#F44336'
  };
  
  const urgencyIcons = {
    'low': '🟢',
    'medium': '🟡', 
    'high': '🔴'
  };
  
  const color = statusColors[status as keyof typeof statusColors] || '#808080';
  const icon = urgencyIcons[urgency as keyof typeof urgencyIcons] || '🟢';
  
  // For completed bookings, show a checkmark instead of urgency icon
  const displayIcon = status === 'completed' ? '✓' : icon;
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      opacity: ${status === 'completed' ? '0.8' : '1'};
    ">${displayIcon}</div>`,
    className: 'custom-patient-icon',
    iconSize: [25, 25],
    iconAnchor: [12, 12]
  });
};

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    }
  });
  return null;
}

interface InteractiveMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number];
  height?: string;
  bookings?: PatientBooking[];
  onAcceptBooking?: (bookingId: number) => void;
  onRejectBooking?: (bookingId: number) => void;
}

export default function InteractiveMap({ 
  onLocationSelect, 
  selectedLocation, 
  height = "400px",
  bookings = [],
  onAcceptBooking,
  onRejectBooking
}: InteractiveMapProps) {
  const handleLocationSelect = (lat: number, lng: number) => {
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer
        center={[9.0192, 38.7525]} // Addis Ababa coordinates
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Medical team markers */}
        {medicalServices.map((service) => (
          <Marker
            key={service.id}
            position={service.position as [number, number]}
            icon={createMedicalIcon(service.type, service.available)}
            eventHandlers={{
              click: () => console.log('Selected service:', service.name)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-primary">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.type}</p>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700">Services:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {service.services.map((s, idx) => (
                      <span key={idx} className="bg-primary text-white text-xs px-2 py-1 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {service.type === 'Main Doctor' && (
                  <button 
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    onClick={() => {
                      console.log('Add team member:', service.name);
                      // This would connect to your backend to add team members
                    }}
                  >
                    Add Team Member
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Real patient booking markers */}
        {bookings.map((booking) => {
          // Use booking coordinates if available, otherwise use default position with slight offset
          const position: [number, number] = booking.latitude && booking.longitude 
            ? [booking.latitude, booking.longitude]
            : [DEFAULT_COORDINATES[0] + (Math.random() - 0.5) * 0.01, DEFAULT_COORDINATES[1] + (Math.random() - 0.5) * 0.01];
          
          return (
            <Marker
              key={`booking-${booking.id}`}
              position={position}
              icon={createPatientIcon(booking.status, booking.urgency)}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <h3 className="font-bold text-gray-800">{booking.patient_name}</h3>
                  <p className="text-sm text-gray-600">{booking.service_name}</p>
                  <p className="text-xs text-gray-500">{booking.patient_email}</p>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-xs"><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        booking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-xs"><strong>Urgency:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        booking.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        booking.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {booking.urgency ? booking.urgency.toUpperCase() : 'NORMAL'}
                      </span>
                    </p>
                    <p className="text-xs"><strong>Time:</strong> {booking.requested_time}</p>
                    <p className="text-xs"><strong>Address:</strong> {booking.patient_address}</p>
                    {booking.patient_notes && (
                      <p className="text-xs"><strong>Notes:</strong> {booking.patient_notes}</p>
                    )}
                    {booking.doctor_notes && (
                      <p className="text-xs"><strong>Doctor Notes:</strong> {booking.doctor_notes}</p>
                    )}
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button 
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        onClick={() => {
                          if (onAcceptBooking) {
                            onAcceptBooking(booking.id);
                          }
                        }}
                      >
                        Accept
                      </button>
                      <button 
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                        onClick={() => {
                          if (onRejectBooking) {
                            onRejectBooking(booking.id);
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {/* Navigation buttons for all active bookings */}
                  {(booking.status === 'accepted' || booking.status === 'in_progress') && (
                    <div className="mt-3 flex gap-2">
                      <button 
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          // Open in Google Maps
                          const lat = booking.latitude || 0;
                          const lng = booking.longitude || 0;
                          const address = encodeURIComponent(booking.patient_address);
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${address}`, '_blank');
                        }}
                      >
                        🧭 Navigate
                      </button>
                      <button 
                        className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                        onClick={() => {
                          // Open in Waze
                          const lat = booking.latitude || 0;
                          const lng = booking.longitude || 0;
                          window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
                        }}
                      >
                        🚗 Waze
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'accepted' && (
                    <div className="mt-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        ✓ Accepted
                      </span>
                    </div>
                  )}
                  
                  {booking.status === 'in_progress' && (
                    <div className="mt-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        🔄 Treatment in Progress
                      </span>
                    </div>
                  )}
                  
                  {booking.status === 'completed' && (
                    <div className="mt-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        ✅ Treatment Completed
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Patient location remains visible until next booking
                      </p>
                    </div>
                  )}
                  
                  {booking.status === 'rejected' && (
                    <div className="mt-3">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        ✗ Rejected
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker position={selectedLocation}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-primary">Selected Location</h3>
                <p className="text-sm text-gray-600">
                  Lat: {selectedLocation[0].toFixed(4)}, Lng: {selectedLocation[1].toFixed(4)}
                </p>
                <button className="mt-2 bg-secondary text-white px-3 py-1 rounded text-sm hover:bg-teal-600 transition-colors">
                  Request Homecare Here
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        <MapClickHandler onLocationSelect={handleLocationSelect} />
      </MapContainer>
    </div>
  );
}
