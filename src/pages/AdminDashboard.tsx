import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Helper: safely parse DB date (ISO or YYYY-MM-DD) to local YYYY-MM-DD
const parseLocalDate = (dateStr: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};


function BookingCountdown({ endTime, onTimeUp }: { endTime: string; onTimeUp: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endParts = endTime.split(':');
      const endHour = parseInt(endParts[0]);
      const endMin = parseInt(endParts[1] || '0');
      
      const target = new Date();
      target.setHours(endHour, endMin, 0, 0);
      
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Waktu Habis');
        onTimeUp();
        return;
      }
      
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(
        `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endTime, onTimeUp]);

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-mono animate-pulse">
      <Clock className="w-3 h-3 text-red-500" />
      <span>{timeLeft}</span>
    </span>
  );
}
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';

interface Stats {
  summary: {
    bookings: number;
    rooms: number;
    users: number;
    revenue: number;
  };
  statusStats: Array<{
    status: string;
    count: string;
  }>;
}

interface Room {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price_per_hour: string;
  image_url: string;
}

interface AllBooking {
  id: number;
  user_id: number;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  total_price: string;
  status: string;
  created_at: string;
  room_name: string;
  user_name: string;
  user_email: string;
  payment_order_id: string | null;
  payment_status: string | null;
}

interface ExtendModal {
  bookingId: number;
  roomName: string;
  currentEndTime: string;
  extraHours: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'rooms' | 'bookings'>('reports');

  // Room Form states for CRUD
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(10);
  const [roomPrice, setRoomPrice] = useState(50000);
  const [roomImage, setRoomImage] = useState('');
  const [submittingRoom, setSubmittingRoom] = useState(false);

  // Extend booking modal state
  const [extendModal, setExtendModal] = useState<ExtendModal | null>(null);
  const [extendSubmitting, setExtendSubmitting] = useState(false);
  const [extendError, setExtendError] = useState('');

  // Toast & confirm modal state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openConfirmAdmin = (opts: typeof confirmAdmin) => setConfirmAdmin(opts);
  const closeConfirmAdmin = () => setConfirmAdmin(null);

  // Fetch Stats (Reports)
  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    }
  });

  // Fetch Rooms
  const { data: rooms, refetch: refetchRooms } = useQuery<Room[]>({
    queryKey: ['adminRooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data;
    }
  });

  // Fetch All Bookings
  const { data: allBookings, refetch: refetchBookings } = useQuery<AllBooking[]>({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/admin/all');
      return res.data;
    }
  });

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRoom(true);
    try {
      await api.post('/rooms', {
        name: roomName,
        description: roomDesc,
        capacity: roomCapacity,
        price_per_hour: roomPrice,
        image_url: roomImage
      });
      setIsCreatingRoom(false);
      resetRoomForm();
      refetchRooms();
      refetchStats();
      showToast('Room created successfully.', 'success');
    } catch (err) {
      showToast('Failed to create room. Please try again.', 'error');
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setSubmittingRoom(true);
    try {
      await api.put(`/rooms/${editingRoom.id}`, {
        name: roomName,
        description: roomDesc,
        capacity: roomCapacity,
        price_per_hour: roomPrice,
        image_url: roomImage
      });
      setEditingRoom(null);
      resetRoomForm();
      refetchRooms();
      showToast('Room updated successfully.', 'success');
    } catch (err) {
      showToast('Failed to update room. Please try again.', 'error');
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleDeleteRoom = (id: number) => {
    openConfirmAdmin({
      title: 'Hapus Ruangan?',
      message: 'Ruangan ini akan dihapus beserta semua data booking-nya. Tindakan ini tidak dapat diurungkan.',
      confirmLabel: 'Ya, Hapus',
      confirmClass: 'bg-red-600 hover:bg-red-500 text-white',
      onConfirm: async () => {
        closeConfirmAdmin();
        try {
          await api.delete(`/rooms/${id}`);
          refetchRooms();
          refetchStats();
          showToast('Room deleted successfully.', 'success');
        } catch (err) {
          showToast('Failed to delete room. Please try again.', 'error');
        }
      }
    });
  };

  const handleBookingAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/bookings/admin/${id}/status`, { status });
      refetchBookings();
      refetchStats();
      showToast(`Booking ${status} successfully.`, 'success');
    } catch (err) {
      showToast('Failed to update booking status. Please try again.', 'error');
    }
  };

  const handleVacateRoom = (id: number) => {
    openConfirmAdmin({
      title: 'Tandai Sesi Selesai?',
      message: 'Sesi booking ini akan diselesaikan lebih awal. Slot waktu akan langsung dibebaskan.',
      confirmLabel: 'Ya, Selesaikan',
      confirmClass: 'bg-slate-700 hover:bg-slate-800 text-white',
      onConfirm: async () => {
        closeConfirmAdmin();
        try {
          await api.post(`/bookings/${id}/vacate`);
          refetchBookings();
          refetchStats();
          showToast('Sesi berhasil diselesaikan lebih awal.', 'success');
        } catch (err) {
          showToast('Failed to vacate room early. Please try again.', 'error');
        }
      }
    });
  };

  const handleExtendBooking = async () => {
    if (!extendModal) return;
    setExtendError('');
    setExtendSubmitting(true);
    try {
      await api.post(`/bookings/${extendModal.bookingId}/extend`, { extra_hours: extendModal.extraHours });
      setExtendModal(null);
      refetchBookings();
      refetchStats();
    } catch (err: any) {
      setExtendError(err.response?.data?.message || 'Failed to extend booking. Slot may conflict with another booking.');
    } finally {
      setExtendSubmitting(false);
    }
  };

  const isBookingActiveNow = (booking: AllBooking) => {
    if (booking.status !== 'approved' || booking.payment_status !== 'settled') return false;
    const n = new Date();
    const todayLocal = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    if (parseLocalDate(booking.date) !== todayLocal) return false;
    const cur = n.getHours() * 60 + n.getMinutes();
    const [sH, sM] = booking.start_time.split(':').map(Number);
    const [eH, eM] = booking.end_time.split(':').map(Number);
    return cur >= sH * 60 + sM && cur < eH * 60 + eM;
  };

  const resetRoomForm = () => {
    setRoomName('');
    setRoomDesc('');
    setRoomCapacity(10);
    setRoomPrice(50000);
    setRoomImage('');
  };

  const startEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomDesc(room.description || '');
    setRoomCapacity(room.capacity);
    setRoomPrice(parseFloat(room.price_per_hour));
    setRoomImage(room.image_url || '');
  };

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getMonthlyStats = () => {
    if (!allBookings) return [];
    const monthlyData: { [key: string]: { revenue: number; bookingsCount: number; settledCount: number } } = {};
    
    allBookings.forEach((b) => {
      const dateStr = b.date.slice(0, 7); 
      if (!monthlyData[dateStr]) {
        monthlyData[dateStr] = { revenue: 0, bookingsCount: 0, settledCount: 0 };
      }
      
      monthlyData[dateStr].bookingsCount += 1;
      if (b.payment_status === 'settled') {
        monthlyData[dateStr].revenue += parseFloat(b.total_price);
        monthlyData[dateStr].settledCount += 1;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => b.month.localeCompare(a.month));
  };

  const downloadCSV = () => {
    if (!allBookings || allBookings.length === 0) return;
    const headers = ['Booking ID', 'User Name', 'User Email', 'Workspace', 'Date', 'Start Time', 'End Time', 'Price', 'Status', 'Payment Status', 'Order ID'];
    const rows = allBookings.map((b) => [
      b.id,
      `"${b.user_name.replace(/"/g, '""')}"`,
      b.user_email,
      `"${b.room_name.replace(/"/g, '""')}"`,
      b.date.slice(0, 10),
      b.start_time.slice(0, 5),
      b.end_time.slice(0, 5),
      parseFloat(b.total_price),
      b.status,
      b.payment_status || 'unpaid',
      b.payment_order_id || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spacebook-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white text-slate-900 py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Control Portal</h2>
            <p className="text-sm text-slate-500 mt-1">Manage workspace rooms, review schedule transactions, and monitor revenue reports.</p>
          </div>
          {/* Tab Selector */}
          <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              id="tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Reports
            </button>
            <button
              id="tab-rooms"
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'rooms' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Manage Rooms
            </button>
            <button
              id="tab-bookings"
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Manage Bookings
            </button>
          </div>
        </div>

        {/* Tab 1: Reports / Analytics */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Stats Summary Cards */}
            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cards */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Sales Revenue</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-2">{formatIDR(stats.summary.revenue)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Booking Requests</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.summary.bookings}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Workspace Rooms</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.summary.rooms}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Registered Accounts</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.summary.users}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-28 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            )}

            {/* Monthly Summary card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Monthly Revenue Summary</h3>
                  <button 
                    id="btn-download-csv"
                    onClick={downloadCSV}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    Download CSV Report
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-655">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3">Month</th>
                        <th className="p-3">Total Bookings</th>
                        <th className="p-3">Paid Bookings</th>
                        <th className="p-3">Monthly Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getMonthlyStats().map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{row.month}</td>
                          <td className="p-3">{row.bookingsCount}</td>
                          <td className="p-3">{row.settledCount}</td>
                          <td className="p-3 font-bold text-emerald-600">{formatIDR(row.revenue)}</td>
                        </tr>
                      ))}
                      {getMonthlyStats().length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">No monthly summary data.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl flex flex-col justify-between text-left">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Monthly Summaries</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This dynamically groups all customer bookings by month, calculating paid transaction amounts. Export to CSV for audit and ledger recording.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 mt-4 sm:mt-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Last updated</span>
                  <span className="text-xs font-semibold text-slate-700">{new Date().toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Sales Table Report */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Settled Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBookings?.filter(b => b.payment_status === 'settled').map((b) => (
                      <tr key={b.id}>
                        <td className="py-3.5 font-mono text-xs text-slate-900">{b.payment_order_id || `BOOKING-${b.id}`}</td>
                        <td className="py-3.5 text-slate-800 font-medium">{b.user_name}</td>
                        <td className="py-3.5 text-slate-600">{b.room_name}</td>
                        <td className="py-3.5 font-semibold text-slate-900">{formatIDR(parseFloat(b.total_price))}</td>
                        <td className="py-3.5">
                          <span className="bg-emerald-50 border border-emerald-255 text-emerald-700 text-xs px-2 py-0.5 rounded font-medium">Settled</span>
                        </td>
                      </tr>
                    ))}
                    {allBookings?.filter(b => b.payment_status === 'settled').length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">No settled transactions available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manage Rooms */}
        {activeTab === 'rooms' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Active Rooms</h3>
              {!isCreatingRoom && !editingRoom && (
                <Button 
                  id="btn-create-room-trigger"
                  onClick={() => setIsCreatingRoom(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 cursor-pointer shadow-sm"
                >
                  Create New Room
                </Button>
              )}
            </div>

            {/* Create or Edit Room Form */}
            {(isCreatingRoom || editingRoom) && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl animate-in slide-in-from-top-4 duration-200">
                <h4 className="font-bold text-slate-900 mb-6">{editingRoom ? `Edit Room: ${editingRoom.name}` : 'Create Workspace Room'}</h4>
                <form id="room-form" onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="room-form-name" className="block text-xs font-bold text-slate-655 mb-1">Room Name</label>
                      <input 
                        id="room-form-name"
                        type="text" 
                        required 
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                        placeholder="Executive Suite"
                      />
                    </div>
                    <div>
                      <label htmlFor="room-form-capacity" className="block text-xs font-bold text-slate-655 mb-1">Capacity (People)</label>
                      <input 
                        id="room-form-capacity"
                        type="number" 
                        required 
                        value={roomCapacity}
                        onChange={(e) => setRoomCapacity(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="room-form-description" className="block text-xs font-bold text-slate-655 mb-1">Description</label>
                    <textarea 
                      id="room-form-description"
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition h-20"
                      placeholder="Room descriptions..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="room-form-price" className="block text-xs font-bold text-slate-655 mb-1">Hourly Price (IDR)</label>
                      <input 
                        id="room-form-price"
                        type="number" 
                        required 
                        value={roomPrice}
                        onChange={(e) => setRoomPrice(parseFloat(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label htmlFor="room-form-image" className="block text-xs font-bold text-slate-655 mb-1">Image URL</label>
                      <input 
                        id="room-form-image"
                        type="text" 
                        value={roomImage}
                        onChange={(e) => setRoomImage(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                    <button
                      id="btn-room-form-cancel"
                      type="button"
                      onClick={() => {
                        setIsCreatingRoom(false);
                        setEditingRoom(null);
                        resetRoomForm();
                      }}
                      className="bg-white border border-slate-255 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <Button 
                      id="btn-room-form-submit"
                      type="submit"
                      disabled={submittingRoom}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 cursor-pointer shadow-sm"
                    >
                      {editingRoom ? 'Update Room' : 'Save Room'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Room List grid */}
            {rooms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms?.map((room) => (
                  <div key={room.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow transition-all duration-300">
                    <div>
                      <div className="h-40 rounded-xl overflow-hidden bg-slate-100 mb-4">
                        <img src={room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'} alt={room.name} className="w-full h-full object-cover"/>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base tracking-tight mb-1">{room.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{room.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">Pax: {room.capacity}</span>
                        <span className="text-xs text-indigo-600 font-bold">{formatIDR(parseFloat(room.price_per_hour))}/hr</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-4 justify-end">
                      <button
                        id={`btn-edit-room-${room.id}`}
                        type="button"
                        onClick={() => startEditRoom(room)}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        id={`btn-delete-room-${room.id}`}
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Loading rooms...</p>
            )}
          </div>
        )}

        {/* Tab 3: Manage Bookings (Approve/Reject) */}
        {activeTab === 'bookings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-6">User Bookings Overview</h3>

            {allBookings ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-655">
                  <thead className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Schedule Date & Time</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Booking Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBookings?.map((booking) => {
                      const showActionBtn = booking.status === 'pending';

                      return (
                        <tr key={booking.id}>
                          <td className="py-4">
                            <div className="font-bold text-slate-900">{booking.user_name}</div>
                            <div className="text-xs text-slate-500">{booking.user_email}</div>
                          </td>
                          <td className="py-4 text-slate-800 font-medium">{booking.room_name}</td>
                          <td className="py-4">
                            <div className="text-slate-700">{parseLocalDate(booking.date)}</div>
                            <div className="text-xs text-slate-500 font-mono font-medium">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</div>
                            {isBookingActiveNow(booking) && (
                              <BookingCountdown endTime={booking.end_time} onTimeUp={() => refetchBookings()} />
                            )}
                          </td>
                          <td className="py-4 font-semibold text-slate-900">{formatIDR(parseFloat(booking.total_price))}</td>
                          <td className="py-4">
                            {booking.payment_status === 'settled' ? (
                              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2 py-0.5 rounded font-medium">Paid</span>
                            ) : (
                              <span className="bg-slate-100 border border-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded font-medium">Unpaid</span>
                            )}
                          </td>
                          <td className="py-4">
                            {booking.status === 'approved' && <span className="text-emerald-600 font-bold">Approved</span>}
                            {booking.status === 'rejected' && <span className="text-red-655 font-bold">Rejected</span>}
                            {booking.status === 'cancelled' && <span className="text-slate-500 font-medium">Cancelled</span>}
                            {booking.status === 'pending' && <span className="text-amber-600 font-bold">Awaiting Approval</span>}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2 items-center flex-wrap">
                              {showActionBtn && (
                                <>
                                  <button
                                    id={`btn-approve-booking-${booking.id}`}
                                    onClick={() => handleBookingAction(booking.id, 'approved')}
                                    className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    id={`btn-reject-booking-${booking.id}`}
                                    onClick={() => handleBookingAction(booking.id, 'rejected')}
                                    className="text-xs font-semibold px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {booking.status === 'approved' && booking.payment_status === 'settled' && isBookingActiveNow(booking) && (
                                <>
                                  <button
                                    id={`btn-admin-done-${booking.id}`}
                                    onClick={() => handleVacateRoom(booking.id)}
                                    className="text-xs font-semibold px-2.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer"
                                  >
                                    ✓ Done
                                  </button>
                                  <button
                                    id={`btn-admin-extend-${booking.id}`}
                                    onClick={() => {
                                      setExtendError('');
                                      setExtendModal({
                                        bookingId: booking.id,
                                        roomName: booking.room_name,
                                        currentEndTime: booking.end_time.slice(0, 5),
                                        extraHours: 1
                                      });
                                    }}
                                    className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer shadow-sm shadow-indigo-600/10"
                                  >
                                    + Extend
                                  </button>
                                </>
                              )}
                              {!showActionBtn && !(booking.status === 'approved' && booking.payment_status === 'settled' && isBookingActiveNow(booking)) && (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {allBookings?.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">No bookings recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500">Loading bookings...</p>
            )}
          </div>
        )}
      </div>

      {/* Extend Booking Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Perpanjang Waktu Sewa</h4>
              <p className="text-xs text-slate-500 mt-1">
                Ruangan: <span className="font-semibold text-slate-700">{extendModal.roomName}</span>
              </p>
              <p className="text-xs text-slate-500">
                Jam selesai saat ini: <span className="font-mono font-semibold text-slate-700">{extendModal.currentEndTime}</span>
              </p>
            </div>

            {extendError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {extendError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tambah Jam</label>
              <div className="flex items-center gap-3">
                {[1, 2, 3].map(h => (
                  <button
                    key={h}
                    id={`btn-extend-hours-${h}`}
                    onClick={() => setExtendModal({ ...extendModal, extraHours: h })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer ${
                      extendModal.extraHours === h
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-650'
                    }`}
                  >
                    +{h}h
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Jam selesai baru:{' '}
                <span className="font-mono font-bold text-slate-700">
                  {(() => {
                    const h = parseInt(extendModal.currentEndTime.split(':')[0]) + extendModal.extraHours;
                    return `${h.toString().padStart(2, '0')}:00`;
                  })()}
                </span>
                {' '}(cek konflik slot otomatis)
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="btn-extend-cancel"
                onClick={() => setExtendModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-extend-confirm"
                onClick={handleExtendBooking}
                disabled={extendSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-60"
              >
                {extendSubmitting ? 'Menyimpan...' : 'Konfirmasi Perpanjang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Confirm Modal */}
      {confirmAdmin && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h4 className="text-lg font-bold text-slate-900">{confirmAdmin.title}</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{confirmAdmin.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                id="btn-admin-confirm-cancel"
                onClick={closeConfirmAdmin}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Tidak
              </button>
              <button
                id="btn-admin-confirm-ok"
                onClick={confirmAdmin.onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shadow-md ${confirmAdmin.confirmClass}`}
              >
                {confirmAdmin.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-lg backdrop-blur-md min-w-[300px] ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-red-50/95 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
