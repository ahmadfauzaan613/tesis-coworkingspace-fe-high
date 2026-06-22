import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { CheckCircle2, ShieldAlert, Clock } from 'lucide-react';

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

interface Booking {
  id: number;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  total_price: string;
  status: string;
  created_at: string;
  room_name: string;
  room_image: string;
  price_per_hour: string;
  payment_order_id: string | null;
  payment_snap_token: string | null;
  payment_status: string | null;
}

// Helper: parse date string (YYYY-MM-DD or ISO) safely to local date string YYYY-MM-DD
const parseLocalDate = (dateStr: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const loadMidtransSnap = (clientKey: string, isProduction: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).snap) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js' 
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

interface ConfirmModal {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
}

export default function MyBookings() {
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [mockPaymentModal, setMockPaymentModal] = useState<Booking | null>(null);
  const [submittingMock, setSubmittingMock] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const openConfirm = (opts: ConfirmModal) => setConfirmModal(opts);
  const closeConfirm = () => setConfirmModal(null);

  // Fetch bookings
  const { data: bookings, isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const res = await api.get('/bookings/my-bookings');
      return res.data;
    }
  });

  const handlePay = async (booking: Booking) => {
    setPayingBookingId(booking.id);
    try {
      const configRes = await api.get('/payments/config');
      const { clientKey, isProduction } = configRes.data;

      const res = await api.post('/payments/charge', { booking_id: booking.id });
      const { snapToken, isMock } = res.data;

      if (isMock) {
        setMockPaymentModal(booking);
      } else {
        const loaded = await loadMidtransSnap(clientKey, isProduction);
        if (!loaded) {
          setMockPaymentModal(booking);
          return;
        }

        const snap = (window as any).snap;
        if (snap) {
          snap.pay(snapToken, {
            onSuccess: async function (result: any) {
              console.log('Success:', result);
              try {
                await api.post('/payments/client-success', { booking_id: booking.id });
                showToast('Transaction completed successfully!', 'success');
              } catch (err) {
                showToast('Failed to verify payment on backend.', 'error');
              }
              refetch();
            },
            onPending: async function (result: any) {
              console.log('Pending:', result);
              try {
                await api.post('/payments/client-success', { booking_id: booking.id });
                showToast('Transaction is pending approval.', 'success');
              } catch (err) {
                console.error('Verify failed:', err);
              }
              refetch();
            },
            onError: function (result: any) {
              console.log('Error:', result);
              showToast('Transaction payment failed. Please try again.', 'error');
            },
            onClose: function () {
              console.log('Customer closed popup without payment.');
            }
          });
        } else {
          setMockPaymentModal(booking);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to initiate payment transaction.', 'error');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleMockPaymentSuccess = async () => {
    if (!mockPaymentModal) return;
    setSubmittingMock(true);
    try {
      await api.post('/payments/mock-success', { booking_id: mockPaymentModal.id });
      setMockPaymentModal(null);
      showToast('Mock Transaction paid successfully!', 'success');
      refetch();
    } catch (err) {
      showToast('Mock transaction payment failed.', 'error');
    } finally {
      setSubmittingMock(false);
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    openConfirm({
      title: 'Batalkan Booking?',
      message: 'Booking ini akan dibatalkan dan slot jadwal akan dibebaskan. Tindakan ini tidak dapat diurungkan.',
      confirmLabel: 'Ya, Batalkan',
      confirmClass: 'bg-red-600 hover:bg-red-500 text-white',
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.post(`/bookings/${bookingId}/cancel`);
          showToast('Booking berhasil dibatalkan.', 'success');
          refetch();
        } catch (err: any) {
          showToast(err.response?.data?.message || 'Gagal membatalkan booking.', 'error');
        }
      }
    });
  };


  // Booking is today and in approved+paid state
  const isBookingToday = (booking: Booking) => {
    if (booking.status !== 'approved' || booking.payment_status !== 'settled') return false;
    const todayLocal = (() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    })();
    return parseLocalDate(booking.date) === todayLocal;
  };

  const isBookingActiveNow = (booking: Booking) => {
    if (!isBookingToday(booking)) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = booking.start_time.split(':').map(Number);
    const [eH, eM] = booking.end_time.split(':').map(Number);
    return cur >= sH * 60 + sM && cur < eH * 60 + eM;
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs px-2.5 py-1 rounded-full font-semibold">Approved</span>;
      case 'rejected':
        return <span className="bg-red-50 border border-red-200 text-red-600 text-xs px-2.5 py-1 rounded-full font-semibold">Rejected</span>;
      case 'cancelled':
        return <span className="bg-slate-100 border border-slate-200 text-slate-500 text-xs px-2.5 py-1 rounded-full font-semibold">Cancelled</span>;
      default:
        return <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold">Pending Approval</span>;
    }
  };

  const getPaymentBadge = (status: string | null) => {
    if (status === 'settled') {
      return <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs px-2.5 py-1 rounded-full font-semibold">Paid</span>;
    } else if (status === 'failed') {
      return <span className="bg-red-50 border border-red-200 text-red-600 text-xs px-2.5 py-1 rounded-full font-semibold">Failed</span>;
    } else if (status === 'pending') {
      return <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold">Unpaid (Pending)</span>;
    } else {
      return <span className="bg-slate-100 border border-slate-200 text-slate-500 text-xs px-2.5 py-1 rounded-full font-semibold">Unpaid</span>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 text-slate-800 py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor your coworking slot schedules and billing status.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="h-44 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const startStr = booking.start_time.slice(0, 5);
              const endStr = booking.end_time.slice(0, 5);
              const showPayBtn = booking.status !== 'rejected' && booking.status !== 'cancelled' && booking.payment_status !== 'settled';
              const activeNow = isBookingActiveNow(booking);
              const bookedToday = isBookingToday(booking);

              return (
                <div 
                  key={booking.id}
                  className={`bg-white border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition shadow-md ${activeNow ? 'border-red-200 shadow-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img 
                        src={booking.room_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'} 
                        alt={booking.room_name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base tracking-tight">{booking.room_name}</h4>
                        {activeNow && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            Sedang Berlangsung
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        Date: <span className="text-slate-800 font-semibold">{parseLocalDate(booking.date)}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-2">
                        Slot Time: <span className="text-slate-700 font-semibold font-mono">{startStr} - {endStr}</span>
                        {bookedToday && (
                          <BookingCountdown endTime={endStr} onTimeUp={() => refetch()} />
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold">
                        Total Cost: <span className="text-indigo-655">{formatIDR(parseFloat(booking.total_price))}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1 items-start md:items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking Status</span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex flex-col gap-1 items-start md:items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Status</span>
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 w-full md:w-auto">
                      {showPayBtn && (
                        <Button 
                          id={`btn-pay-booking-${booking.id}`}
                          onClick={() => handlePay(booking)}
                          disabled={payingBookingId === booking.id}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 cursor-pointer w-full md:w-auto shadow-md shadow-indigo-600/10"
                        >
                          {payingBookingId === booking.id ? 'Loading...' : 'Payment'}
                        </Button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'approved') && booking.payment_status !== 'settled' && (
                        <button
                          id={`btn-cancel-booking-${booking.id}`}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-xs border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 px-3 py-2 rounded-lg font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-md">
            <p className="text-slate-500 text-sm">You do not have any bookings yet.</p>
            <Button 
              id="btn-browse-rooms-fallback"
              onClick={() => window.location.href = '/'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white mt-4 font-semibold text-xs px-5 py-2 cursor-pointer"
            >
              Browse Rooms
            </Button>
          </div>
        )}
      </div>

      {/* Mock Sandbox Payment Modal */}
      {mockPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 text-left">
              <h4 className="font-bold text-lg text-slate-900">Midtrans Snap Sandbox Simulation</h4>
              <p className="text-xs text-slate-500 mt-0.5">Mocking environment since actual keys are placeholders.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-slate-700 text-left space-y-2">
                <p><strong>Item:</strong> {mockPaymentModal.room_name}</p>
                <p><strong>Date:</strong> {parseLocalDate(mockPaymentModal.date)}</p>
                <p><strong>Amount:</strong> {formatIDR(parseFloat(mockPaymentModal.total_price))}</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed text-left">
                Clicking the button below will simulate a successful transaction callback from Midtrans, marking the booking as paid and approved.
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button 
                  id="btn-mock-payment-cancel"
                  type="button"
                  onClick={() => setMockPaymentModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <Button 
                  id="btn-mock-payment-success"
                  onClick={handleMockPaymentSuccess}
                  disabled={submittingMock}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-5 py-2 cursor-pointer shadow-md"
                >
                  {submittingMock ? 'Simulating...' : 'Mock Pay Successful'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Confirm Modal (replaces window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h4 className="text-lg font-bold text-slate-900">{confirmModal.title}</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                id="btn-confirm-modal-cancel"
                onClick={closeConfirm}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Tidak
              </button>
              <button
                id="btn-confirm-modal-ok"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shadow-md ${confirmModal.confirmClass}`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-lg backdrop-blur-md min-w-[300px] text-left ${
            toast.type === 'success' 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
              : 'bg-red-50/90 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-655 flex-shrink-0" />
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
