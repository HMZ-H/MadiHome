import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type DoctorDetail = {
  id: number;
  user?: { id: number; first_name: string; last_name: string; email?: string; photo_url?: string };
  first_name?: string;
  last_name?: string;
  email?: string;
  specialty?: string;
  hospital?: string;
  experience_years?: number;
  rating?: number;
  ratings_count?: number;
  bio?: string;
  education?: string;
  photo_url?: string;
};

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!doctor) return '';
    const fn = doctor.user?.first_name || doctor.first_name || '';
    const ln = doctor.user?.last_name || doctor.last_name || '';
    return `${fn} ${ln}`.trim();
  }, [doctor]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080';
        const res = await fetch(`${API_BASE_URL}/api/doctors/${id}`);
        if (!res.ok) throw new Error('Failed to load doctor');
        const json = await res.json();
        setDoctor(json?.data || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const onChat = () => {
    const userId = doctor?.user?.id;
    if (!userId) return;
    navigate('/patient/messages');
    // The patient messages page will allow selecting the doctor to start chat
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-600">Loading doctor…</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-600">{error || 'Doctor not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                {/* Photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={doctor.photo_url || doctor.user?.photo_url || '/placeholder-doctor.jpg'} alt={displayName} className="w-full h-64 object-cover" />
              </div>
            </div>
            <div className="md:w-2/3">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Dr. {displayName}</h1>
                <button onClick={onChat} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Chat</button>
              </div>
              <p className="text-gray-600 mt-1">{doctor.specialty || 'Specialist'}</p>
              <p className="text-gray-500 mt-1">{doctor.hospital || ''}</p>

              <div className="mt-4 flex items-center gap-4">
                <div className="text-emerald-600 font-semibold">{doctor.experience_years || 0}+ years</div>
                <div className="text-gray-600">Rating: {doctor.rating || 4.5} ({doctor.ratings_count || 0})</div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Biography</h2>
                <p className="text-gray-600 leading-6">{doctor.bio || 'No biography provided.'}</p>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Education</h2>
                <p className="text-gray-600">{doctor.education || 'Not specified'}</p>
              </div>

              <div className="mt-6">
                <button className="px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Book Now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


