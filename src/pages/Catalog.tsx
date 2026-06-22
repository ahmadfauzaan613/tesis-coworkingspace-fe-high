import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Search, SlidersHorizontal, ArrowUpDown, ShieldAlert, CheckCircle2 } from 'lucide-react';

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

export default function Catalog() {
  const token = localStorage.getItem('token');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name');

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

  // Filter & Sort Rooms
  const filteredRooms = rooms?.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          room.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCapacity = true;
    if (capacityFilter === 'small') matchesCapacity = room.capacity < 5;
    else if (capacityFilter === 'medium') matchesCapacity = room.capacity >= 5 && room.capacity <= 10;
    else if (capacityFilter === 'large') matchesCapacity = room.capacity > 10;

    return matchesSearch && matchesCapacity;
  }).sort((a, b) => {
    if (sortOrder === 'price_asc') return parseFloat(a.price_per_hour) - parseFloat(b.price_per_hour);
    if (sortOrder === 'price_desc') return parseFloat(b.price_per_hour) - parseFloat(a.price_per_hour);
    return a.name.localeCompare(b.name);
  });

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



  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const hoursArray = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white text-slate-900 font-sans py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Title */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Workspace Catalog</h2>
          <p className="text-sm text-slate-500 mt-1">Explore our range of professional hot-desks, conference chambers, and executive suites.</p>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              id="catalog-search"
              type="text"
              placeholder="Search by workspace name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Filter by capacity */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <select
                id="filter-capacity"
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
              >
                <option value="all">All Capacities</option>
                <option value="small">Small (&lt; 5 Pax)</option>
                <option value="medium">Medium (5 - 10 Pax)</option>
                <option value="large">Large (&gt; 10 Pax)</option>
              </select>
            </div>

            {/* Sort by price */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <select
                id="sort-price"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
              >
                <option value="name">Alphabetical</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Room Catalog Grid */}
        {loadingRooms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[28rem] rounded-2xl bg-slate-50 border border-slate-200 animate-pulse"></div>
            ))}
          </div>
        ) : filteredRooms && filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => (
              <div 
                key={room.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-350 hover:shadow-lg transition-all duration-300 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img 
                      src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'} 
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 text-xs px-3 py-1 rounded-full text-slate-700 font-bold shadow-sm">
                      Max {room.capacity} Pax
                    </div>
                  </div>
                  <div className="p-6 space-y-4 text-left">
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition">
                      {room.name}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
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
                      onClick={() => window.location.href = `/rooms/${room.id}`}
                      className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Detail
                    </button>
                    <Button 
                      id={`btn-book-room-${room.id}`}
                      onClick={() => setSelectedRoom(room)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      Book Space
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl py-20 text-center shadow-sm">
            <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-900">No Workspaces Found</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Try adjusting your search criteria or changing the capacity filter.</p>
          </div>
        )}

      </div>

      {/* Booking Form Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-lg text-slate-900">Book: {selectedRoom.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Rate: {formatIDR(parseFloat(selectedRoom.price_per_hour))}/hour</p>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-750 flex items-start gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 text-red-655 mt-0.5 flex-shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}
              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-750 flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-655 mt-0.5 flex-shrink-0" />
                  <span>{bookingSuccess}</span>
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
              </div>              {/* Calculations and Actions */}
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
