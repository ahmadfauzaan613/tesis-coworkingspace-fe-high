import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Wifi, Coffee, Users, HelpCircle, ArrowRight } from 'lucide-react';

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

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Selected room for booking modal
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  

  
  // Booking Form State
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);




  // Fetch Rooms
  const { data: rooms, isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data;
    }
  });

  // Fetch conflicting bookings for selected room & date
  const { data: conflicts } = useQuery<ConflictingBooking[]>({
    queryKey: ['conflicts', selectedRoom?.id, bookingDate],
    queryFn: async () => {
      if (!selectedRoom) return [];
      const res = await api.get(`/bookings/conflict-check?room_id=${selectedRoom.id}&date=${bookingDate}`);
      return res.data;
    },
    enabled: !!selectedRoom
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
    if (!selectedRoom) return 0;
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const hours = endHour - startHour;
    if (hours <= 0) return 0;
    return hours * parseFloat(selectedRoom.price_per_hour);
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
        room_id: selectedRoom?.id,
        date: bookingDate,
        start_time: startTime,
        end_time: endTime,
      });

      setBookingSuccess('Booking requested successfully! Redirecting to booking list to choose payment...');

      setTimeout(() => {
        setSelectedRoom(null);
        window.location.href = '/my-bookings';
      }, 1500);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to request booking. Please check for scheduling overlap.');
    } finally {
      setSubmitting(false);
    }
  };



  // Format currency to IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const hoursArray = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white text-slate-900 font-sans">
      {/* Hero Banner */}
      <section className="relative overflow-hidden py-20 px-6 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-left animate-in fade-in slide-in-from-left-4 duration-300">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
              Tesis Prototype
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Coworking Space Scheduling System
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Book professional workspace units, meeting rooms, and conference halls in seconds. Complete with instant conflict check & Midtrans Snap payment integration.
            </p>
            <div className="pt-2">
              <Button 
                id="btn-hero-cta"
                onClick={() => window.location.href = '/catalog'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                Browse Catalog <ArrowRight className="w-4 h-4 ml-2 inline-block" />
              </Button>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl h-80 lg:h-[26rem] bg-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <img 
              src="https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80" 
              alt="Coworking Space Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-indigo-950/5"></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03),transparent_60%)]"></div>
      </section>

      {/* Rooms Showcase */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Featured Workspaces</h3>
            <p className="text-sm text-slate-550 mt-1">Check out our most popular workspace slots. Ready for direct scheduling.</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold mt-2 md:mt-0">
            Previewing: {rooms ? Math.min(rooms.length, 3) : 0} of {rooms?.length || 0}
          </span>
        </div>

        {loadingRooms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms?.slice(0, 3).map((room) => (
                <div 
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-350 hover:shadow-lg transition-all duration-300 flex flex-col justify-between shadow-sm cursor-pointer"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img 
                        src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'} 
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700 font-semibold shadow-sm">
                        Max {room.capacity} Pax
                      </div>
                    </div>
                    <div className="p-6 space-y-4 text-left">
                      <h4 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition">
                        {room.name}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {room.description}
                      </p>

                      {/* Room Amenities Detail */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {getRoomFeatures(room).map((feat, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Hourly Rate</span>
                      <span className="text-lg font-extrabold text-slate-900">{formatIDR(parseFloat(room.price_per_hour))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        id={`btn-detail-room-${room.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rooms/${room.id}`);
                        }}
                        className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                      >
                        Detail
                      </button>
                      <Button 
                        id={`btn-book-room-${room.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoom(room);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 cursor-pointer shadow-md shadow-indigo-600/10"
                      >
                        Book Space
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Catalog CTA */}
            <div className="text-center mt-12">
              <Button 
                id="btn-browse-catalog"
                onClick={() => window.location.href = '/catalog'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                Browse Full Catalog <ArrowRight className="w-4 h-4 ml-2 inline-block" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Statistics Section */}
      <section className="bg-slate-50 border-t border-b border-slate-200 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <h4 className="text-3xl md:text-4xl font-extrabold text-indigo-600">15+</h4>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Premium Spaces</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-3xl md:text-4xl font-extrabold text-indigo-600">100%</h4>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Conflict-Free Slots</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-3xl md:text-4xl font-extrabold text-indigo-600">&lt; 3 Sec</h4>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fast Snap Checkout</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-3xl md:text-4xl font-extrabold text-indigo-600">24/7</h4>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Security & Access</p>
          </div>
        </div>
      </section>

      {/* Premium Perks & Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Premium Shared Amenities</h3>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">Every reservation grants complete access to our first-class facilities built for productivity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-sm transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">High-Speed Fiber Wifi</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Stable, enterprise-grade gigabit connection with dual ISP backup to keep you seamlessly connected online.</p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-sm transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Fresh-Brewed Beverage Bar</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Unlimited cups of premium espresso, fresh teas, and dynamic infused waters available free of charge at the lounge.</p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-sm transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Silent Phone Pods</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Fully soundproofed focus pods equipped with ergonomic desk chairs, perfect for making calls without noise.</p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-200 space-y-12">
        <div className="text-center space-y-3">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h3>
          <p className="text-sm text-slate-500">Everything you need to know about our scheduling and payment process.</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <h4 className="font-bold text-slate-900 text-sm">Bagaimana sistem mendeteksi tabrakan jadwal?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-7">
              Setiap kali Anda memesan, sistem database backend akan mencocokkan tanggal and durasi jam sewa Anda dengan pesanan lain yang berstatus aktif. Jika ada waktu yang beririsan walaupun hanya 1 menit, sistem otomatis menolak pemesanan untuk menghindari tumpang tindih.
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <h4 className="font-bold text-slate-900 text-sm">Apakah saya harus login terlebih dahulu untuk memesan?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-7">
              Ya, Anda harus login terlebih dahulu. Silakan masuk (Log In) atau daftar (Sign Up) terlebih dahulu untuk dapat memesan ruangan di SpaceBook.
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <h4 className="font-bold text-slate-900 text-sm">Bagaimana status pesanan saya diperbarui setelah membayar di Midtrans?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-7">
              Ketika Anda sukses membayar di portal Midtrans Snap, callback sukses pada frontend akan memicu pengecekan status server-ke-server (`client-success`). Backend kami akan menanyakan langsung validitas transaksi tersebut ke API Midtrans. Jika disetujui, database secara otomatis merubah status pesanan Anda menjadi Approved dan Paid secara instan.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Form Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-lg text-slate-900">Book: {selectedRoom.name}</h4>
                <p className="text-xs text-slate-550 mt-0.5">Rate: {formatIDR(parseFloat(selectedRoom.price_per_hour))}/hour</p>
              </div>
              <button 
                id="btn-close-modal"
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="text-slate-400 hover:text-slate-700 transition text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form id="booking-form" onSubmit={handleBookingSubmit} className="p-6 space-y-6">
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {bookingError}
                </div>
              )}
              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-750 font-medium">
                  {bookingSuccess}
                </div>
              )}

              {/* Form Input: Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Booking Date</label>
                <input 
                  id="input-booking-date"
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Start Time</label>
                  <select 
                    id="select-start-time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    {hoursArray.slice(0, -1).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">End Time</label>
                  <select 
                    id="select-end-time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    {hoursArray.filter(h => h > startTime).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conflict Checker Display */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Scheduled Bookings on This Date:</span>
                {conflicts && conflicts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {conflicts.map((c, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-mono">
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
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Price</span>
                    <span className="text-xl font-extrabold text-indigo-600">{formatIDR(calculatePrice())}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      id="btn-cancel-booking-modal"
                      type="button"
                      onClick={() => setSelectedRoom(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <Button 
                      id="btn-confirm-booking"
                      type="submit"
                      disabled={submitting || calculatePrice() <= 0}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-5 py-2 cursor-pointer"
                    >
                      {submitting ? 'Processing...' : 'Confirm Book'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-6 mt-4 space-y-4 text-center">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
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
      )}

    </div>
  );
}
