import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Mail, 
  CheckCircle2, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  History,
  X,
  ArrowRight,
  Lock,
  Briefcase,
  Check,
  LogOut,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { Service, Booking, User, Plan } from './types';

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Basic',
    price: 0,
    features: ['Standard Booking', 'Email Support', 'Basic Service History'],
  },
  {
    id: 'pro',
    name: 'Home Pro',
    price: 19,
    recommended: true,
    features: ['Priority Booking', '24/7 Support', '10% Discount on Services', 'Extended Warranty'],
  },
  {
    id: 'enterprise',
    name: 'Estate',
    price: 49,
    features: ['Dedicated Manager', 'Unlimited Services', '20% Discount', 'Custom Maintenance Plan'],
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [view, setView] = useState<'home' | 'bookings' | 'login' | 'register' | 'plans'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'customer' as 'customer' | 'servicer' });
  const [bookingForm, setBookingForm] = useState({
    customer_name: '',
    customer_email: '',
    booking_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [currentUser]);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchBookings = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setView('home');
        setAuthForm({ name: '', email: '', password: '', role: 'customer' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          customer_name: currentUser?.name || bookingForm.customer_name,
          customer_email: currentUser?.email || bookingForm.customer_email,
          booking_date: bookingForm.booking_date,
        }),
      });

      if (res.ok) {
        setBookingSuccess(`Successfully booked ${selectedService.name}!`);
        setBookingForm({
          customer_name: '',
          customer_email: '',
          booking_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        });
        setTimeout(() => {
          setIsBookingModalOpen(false);
          setBookingSuccess(null);
          setSelectedService(null);
          fetchBookings();
        }, 2000);
      }
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!currentUser) {
      setView('login');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, plan: planId }),
      });
      if (res.ok) {
        setCurrentUser({ ...currentUser, plan: planId as any });
        setPlanSuccess(`Plan updated to ${planId.toUpperCase()}!`);
        setTimeout(() => setPlanSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Plan update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
              <div className="w-8 h-8 bg-brand-950 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-brand-950">HomeEase</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setView('home')}
                className={cn("text-sm font-medium transition-colors", view === 'home' ? "text-brand-950" : "text-brand-500 hover:text-brand-950")}
              >
                Services
              </button>
              <button 
                onClick={() => setView('plans')}
                className={cn("text-sm font-medium transition-colors", view === 'plans' ? "text-brand-950" : "text-brand-500 hover:text-brand-950")}
              >
                Pricing
              </button>
              {currentUser ? (
                <>
                  <button 
                    onClick={() => setView('bookings')}
                    className={cn("text-sm font-medium transition-colors flex items-center gap-2", view === 'bookings' ? "text-brand-950" : "text-brand-500 hover:text-brand-950")}
                  >
                    <History className="w-4 h-4" />
                    My Bookings
                  </button>
                  <div className="flex items-center gap-4 pl-4 border-l border-brand-200">
                    <div className="text-right">
                      <div className="text-xs font-bold text-brand-950">{currentUser.name}</div>
                      <div className="text-[10px] text-brand-400 uppercase tracking-widest">{currentUser.plan} member</div>
                    </div>
                    <button 
                      onClick={() => setCurrentUser(null)}
                      className="p-2 text-brand-400 hover:text-red-500 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('login')}
                    className="text-sm font-medium text-brand-600 hover:text-brand-950"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setView('register')}
                    className="bg-brand-950 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-800 transition-all shadow-sm"
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-5xl md:text-7xl font-serif italic text-brand-950 mb-6"
                >
                  Expert care for your <br /> sanctuary.
                </motion.h1>
                <p className="text-brand-600 text-lg max-w-2xl mx-auto mb-10">
                  Premium home services delivered by vetted professionals. 
                  From deep cleaning to emergency repairs, we've got you covered.
                </p>
                
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Search for a service (e.g. Cleaning, Plumbing)..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-brand-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service) => (
                  <motion.div
                    key={service.id}
                    whileHover={{ y: -5 }}
                    className="group bg-white rounded-3xl overflow-hidden border border-brand-200 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-900 uppercase tracking-wider">
                        {service.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-brand-950">{service.name}</h3>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold">4.9</span>
                        </div>
                      </div>
                      <p className="text-brand-600 text-sm mb-6 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-brand-400 uppercase font-bold tracking-widest">Starting from</span>
                          <div className="text-2xl font-bold text-brand-950">${service.price}</div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedService(service);
                            setBookingForm(prev => ({ ...prev, booking_date: format(new Date(), "yyyy-MM-dd'T'HH:mm") }));
                            setBookingSuccess(null);
                            setIsBookingModalOpen(true);
                          }}
                          className="bg-brand-100 text-brand-950 p-3 rounded-2xl hover:bg-brand-950 hover:text-white transition-all group/btn"
                        >
                          <ChevronRight className="w-6 h-6 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto px-4 py-20"
            >
              <div className="bg-white p-8 rounded-3xl border border-brand-200 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-serif italic text-brand-950 mb-2">Welcome Back</h2>
                  <p className="text-brand-500">Sign in to manage your home services</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                      <input 
                        required
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                      <input 
                        required
                        type="password"
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-brand-950 text-white py-4 rounded-2xl font-bold hover:bg-brand-800 transition-all shadow-lg shadow-brand-950/20"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
                <p className="text-center mt-8 text-sm text-brand-500">
                  Don't have an account? <button onClick={() => setView('register')} className="text-brand-950 font-bold hover:underline">Register</button>
                </p>
              </div>
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto px-4 py-20"
            >
              <div className="bg-white p-8 rounded-3xl border border-brand-200 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-serif italic text-brand-950 mb-2">Create Account</h2>
                  <p className="text-brand-500">Join the HomeEase community today</p>
                </div>

                <div className="flex p-1 bg-brand-50 rounded-2xl mb-8">
                  <button 
                    onClick={() => setAuthForm({...authForm, role: 'customer'})}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                      authForm.role === 'customer' ? "bg-white text-brand-950 shadow-sm" : "text-brand-400"
                    )}
                  >
                    <UserIcon className="w-4 h-4" /> Customer
                  </button>
                  <button 
                    onClick={() => setAuthForm({...authForm, role: 'servicer'})}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                      authForm.role === 'servicer' ? "bg-white text-brand-950 shadow-sm" : "text-brand-400"
                    )}
                  >
                    <Briefcase className="w-4 h-4" /> Servicer
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                      <input 
                        required
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                      <input 
                        required
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                      <input 
                        required
                        type="password"
                        className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-brand-950 text-white py-4 rounded-2xl font-bold hover:bg-brand-800 transition-all shadow-lg shadow-brand-950/20"
                  >
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
                <p className="text-center mt-8 text-sm text-brand-500">
                  Already have an account? <button onClick={() => setView('login')} className="text-brand-950 font-bold hover:underline">Login</button>
                </p>
              </div>
            </motion.div>
          )}

          {view === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 py-20"
            >
              <div className="text-center mb-16">
                <h2 className="text-5xl font-serif italic text-brand-950 mb-4">Simple, Transparent Pricing</h2>
                <p className="text-brand-600">Choose the plan that fits your lifestyle</p>
              </div>

              {planSuccess && (
                <div className="max-w-md mx-auto mb-8 p-4 bg-emerald-50 text-emerald-600 text-center rounded-xl border border-emerald-100">
                  {planSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                  <div 
                    key={plan.id}
                    className={cn(
                      "relative bg-white p-8 rounded-3xl border transition-all",
                      plan.recommended ? "border-brand-950 shadow-2xl scale-105 z-10" : "border-brand-200 shadow-sm"
                    )}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-950 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        Recommended
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-brand-950 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-brand-950">${plan.price}</span>
                      <span className="text-brand-400">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-brand-600">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={currentUser?.plan === plan.id}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold transition-all",
                        currentUser?.plan === plan.id 
                          ? "bg-brand-50 text-brand-300 cursor-not-allowed" 
                          : plan.recommended 
                            ? "bg-brand-950 text-white hover:bg-brand-800" 
                            : "bg-brand-100 text-brand-950 hover:bg-brand-200"
                      )}
                    >
                      {currentUser?.plan === plan.id ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto px-4 py-12"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-serif italic text-brand-950">Your Bookings</h2>
                <button 
                  onClick={() => setView('home')}
                  className="text-sm font-medium text-brand-600 hover:text-brand-950 flex items-center gap-1"
                >
                  Book more services <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-brand-300">
                  <Calendar className="w-12 h-12 text-brand-200 mx-auto mb-4" />
                  <p className="text-brand-500">No bookings found yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white p-6 rounded-2xl border border-brand-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle2 className="text-brand-500 w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-950">{booking.service_name}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-sm text-brand-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-sm text-brand-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(booking.booking_date), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <div className="text-sm font-medium text-brand-950">{booking.customer_name}</div>
                          <div className="text-xs text-brand-400">{booking.customer_email}</div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          booking.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-brand-950 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-white w-6 h-6" />
                <span className="text-2xl font-bold tracking-tight">HomeEase</span>
              </div>
              <p className="text-brand-400 max-w-sm">
                The most trusted platform for professional home services. 
                We bring quality and peace of mind to your doorstep.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6">Services</h5>
              <ul className="space-y-4 text-brand-400 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">Cleaning</li>
                <li className="hover:text-white cursor-pointer transition-colors">Plumbing</li>
                <li className="hover:text-white cursor-pointer transition-colors">Electrical</li>
                <li className="hover:text-white cursor-pointer transition-colors">Landscaping</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6">Company</h5>
              <ul className="space-y-4 text-brand-400 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-brand-500 text-xs">© 2026 HomeEase Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-serif italic text-brand-950">Book Service</h3>
                    <p className="text-brand-500 font-medium">{selectedService.name}</p>
                  </div>
                  <button 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="p-2 hover:bg-brand-50 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-brand-400" />
                  </button>
                </div>

                {bookingSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold text-brand-950 mb-2">Booking Confirmed!</h4>
                    <p className="text-brand-600">{bookingSuccess}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-6">
                    <div className="space-y-4">
                      {!currentUser && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Full Name</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                              <input 
                                required
                                type="text"
                                placeholder="John Doe"
                                className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                value={bookingForm.customer_name}
                                onChange={(e) => setBookingForm({...bookingForm, customer_name: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                              <input 
                                required
                                type="email"
                                placeholder="john@example.com"
                                className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                value={bookingForm.customer_email}
                                onChange={(e) => setBookingForm({...bookingForm, customer_email: e.target.value})}
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Date & Time</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300 w-4 h-4" />
                          <input 
                            required
                            type="datetime-local"
                            className="w-full pl-10 pr-4 py-3 bg-brand-50 border border-brand-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                            value={bookingForm.booking_date}
                            onChange={(e) => setBookingForm({...bookingForm, booking_date: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-brand-100">
                      <div>
                        <span className="text-xs text-brand-400 uppercase font-bold tracking-widest">Total Price</span>
                        <div className="text-2xl font-bold text-brand-950">
                          ${currentUser?.plan === 'pro' ? (selectedService.price * 0.9).toFixed(2) : currentUser?.plan === 'enterprise' ? (selectedService.price * 0.8).toFixed(2) : selectedService.price}
                          {currentUser?.plan !== 'free' && currentUser?.plan && <span className="ml-2 text-xs text-emerald-500 font-bold">Plan Discount Applied</span>}
                        </div>
                      </div>
                      <button 
                        disabled={isSubmitting}
                        type="submit"
                        className="bg-brand-950 text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-950/20"
                      >
                        {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
