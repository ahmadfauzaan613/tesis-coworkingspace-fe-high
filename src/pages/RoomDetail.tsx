import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { CheckCircle2, ArrowLeft, Calendar, Clock, ShieldAlert } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price_per_hour: string;
  image_url: string;
}

interface ConflictingBooking {
  id: number;
  start_time: string;
  end_time: string;
}

const getRoomFeatures = (room: Room) => {
  const features = ['High-Speed Wi-Fi', `Max ${room.capacity} Pax` ];
  if (room.capacity >= 15) {
    features.push('Dual Projector Screen', 'Multi-Mic Audio System');
  } else if (room.capacity >= 5) {
    features.push('65" Smart Whiteboard', 'Video Conferencing');
  } else if (room.capacity === 1) {
    features.push('Soundproof Pod', 'Ergonomic Standing Desk');
  } else {
    features.push('Ergonomic Seating', 'Individual Power Outlets');
  }
  features.push('Free Flow Coffee/Tea');
  return features;
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('token');

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);



  // Fetch Room by ID
  const { data: room, isLoading: loadingRoom, error: roomError } = useQuery<Room>({
    queryKey: ['room', id],
    queryFn: async () => {
      const res = await api.get(`/rooms/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch conflicting bookings for selected room & date
  const { data: conflicts } = useQuery<ConflictingBooking[]>({
    queryKey: ['conflicts', id, bookingDate],
    queryFn: async () => {
      if (!id) return [];
      const res = await api.get(`/bookings/conflict-check?room_id=${id}&date=${bookingDate}`);
      return res.data;
    },
    enabled: !!id
  });

  // Auto-adjust start time to the first available non-conflicting slot
  useEffect(() => {
    if (conflicts) {
      let candidateStart = 9;
      let candidateEnd = 12;
      
      while (candidateStart < 22) {
        const hasConflict = conflicts.some(c => {
          const cStart = parseInt(c.start_time.split(':')[0]);
          const cEnd = parseInt(c.end_time.slice(0, 5).split(':')[0]);
          return candidateStart < cEnd && candidateEnd > cStart;
        });

        // Specific rule: if 10:00 - 11:00 is booked, shift to 12:00 - 13:00
        const isTenToElevenBooked = conflicts.some(c => {
          const cStart = c.start_time.slice(0, 5);
          const cEnd = c.end_time.slice(0, 5);
          return cStart === '10:00' && cEnd === '11:00';
        });

        if (isTenToElevenBooked && (candidateStart === 10 || (candidateStart < 11 && candidateEnd > 10))) {
          candidateStart = 12;
          candidateEnd = 13;
          continue;
        }

        if (hasConflict) {
          candidateStart += 1;
          candidateEnd = candidateStart + 3; // Keep default 3-hour duration
          if (candidateEnd > 22) {
            candidateEnd = 22;
          }
        } else {
          break;
        }
      }
      
      const startStr = `${candidateStart.toString().padStart(2, '0')}:00`;
      const endStr = `${candidateEnd.toString().padStart(2, '0')}:00`;
      setStartTime(startStr);
      setEndTime(endStr);
    }
  }, [conflicts]);

  // Calculate dynamic price
  const calculatePrice = () => {
    if (!room) return 0;
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const hours = endHour - startHour;
    if (hours <= 0) return 0;
    return hours * parseFloat(room.price_per_hour);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (startTime >= endTime) {
      setBookingError('Start time must be before end time.');
      return;
    }

    setSubmitting(true);

    try {

      // 2. Create the booking slot
      await api.post('/bookings', {
        room_id: room?.id,
        date: bookingDate,
        start_time: startTime,
        end_time: endTime,
      });

      setBookingSuccess('Booking requested successfully! Redirecting to booking list to choose payment...');

      setTimeout(() => {
        window.location.href = '/my-bookings';
      }, 1500);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to request booking. Please check for scheduling overlap.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const hoursArray = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  if (loadingRoom) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-white text-slate-900">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Loading space specifications...</p>
        </div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-white text-slate-900 px-6">
        <div className="text-center space-y-4 max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold">Workspace Not Found</h3>
          <p className="text-sm text-slate-500">The workspace you are looking for does not exist or has been removed.</p>
          <Link to="/catalog">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs mt-2">
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white text-slate-900 font-sans py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back Button */}
        <div>
          <Link to="/catalog" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Workspace Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Room Details Info */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm space-y-6">
            <div className="relative h-96 overflow-hidden bg-slate-100">
              <img 
                src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'} 
                alt={room.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-left">
                <h2 className="font-extrabold text-3xl text-white tracking-tight drop-shadow-sm">{room.name}</h2>
                <span className="inline-block mt-2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                  Max {room.capacity} Pax Capacity
                </span>
              </div>
            </div>

            <div className="p-8 space-y-6 text-left">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                <p className="text-sm text-slate-650 leading-relaxed font-normal">
                  {room.description}
                </p>
              </div>

              {/* Specifications/Features Grid */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Included Amenities</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {getRoomFeatures(room).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown info */}
              <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pricing Policy</span>
                  <p className="text-xs text-slate-500 mt-1">Charged on a strict hourly basis. Includes access to shared lounges.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hourly Rate</span>
                  <span className="text-2xl font-extrabold text-indigo-600">{formatIDR(parseFloat(room.price_per_hour))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="text-left mb-6 space-y-1">
              <h3 className="text-lg font-bold text-slate-905">Schedule Workspace</h3>
              <p className="text-xs text-slate-500">Configure date and duration below to queue this booking.</p>
            </div>

            <form id="booking-form" onSubmit={handleBookingSubmit} className="space-y-6">
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-750 flex items-start gap-2 font-medium text-left">
                  <ShieldAlert className="w-4 h-4 text-red-655 mt-0.5 flex-shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}
              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-750 flex items-start gap-2 font-medium text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-655 mt-0.5 flex-shrink-0" />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              {/* Form Input: Date */}
              <div className="text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Booking Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    id="input-booking-date"
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select 
                      id="select-start-time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer appearance-none"
                    >
                      {hoursArray.slice(0, -1).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">End Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select 
                      id="select-end-time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer appearance-none"
                    >
                      {hoursArray.filter(h => h > startTime).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Conflict Checker Display */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Scheduled Bookings on This Date:</span>
                {conflicts && conflicts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {conflicts.map((c, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-750 border border-red-200 px-2.5 py-1 rounded font-mono font-semibold">
                        {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No bookings scheduled yet on this date. All slots available.</p>
                )}
              </div>

              {/* Calculations and Actions */}
              {token ? (
                <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Price</span>
                    <span className="text-2xl font-extrabold text-indigo-650">{formatIDR(calculatePrice())}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/catalog">
                      <button 
                        id="btn-cancel-booking-modal"
                        type="button"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </Link>
                    <Button 
                      id="btn-confirm-booking"
                      type="submit"
                      disabled={submitting || calculatePrice() <= 0}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 cursor-pointer shadow-lg shadow-indigo-600/10"
                    >
                      {submitting ? 'Processing...' : 'Confirm Book'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-6 mt-4 space-y-4 text-center">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed text-left">
                    Anda harus login terlebih dahulu untuk melakukan pemesanan. Silakan masuk (Log In) atau daftar (Sign Up) untuk memesan ruangan ini.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Link 
                      id="btn-modal-login"
                      to="/login" 
                      className="text-xs font-semibold px-4.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition flex items-center justify-center cursor-pointer min-w-[90px]"
                    >
                      Log In
                    </Link>
                    <Link 
                      id="btn-modal-register"
                      to="/register" 
                      className="text-xs font-semibold px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center shadow-md shadow-indigo-600/10 cursor-pointer min-w-[90px]"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
