import { Clock, Shield, Sparkles, Coffee, Wifi, Users, Globe, BookOpen } from 'lucide-react';

export default function About() {
  return (
    <div id="about-container" data-testid="about-container" className="min-h-[calc(100vh-73px)] bg-white text-slate-800 font-sans py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Section 1: Hero Intro */}
        <div className="text-center space-y-6">
          <span id="about-badge" data-testid="about-badge" className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-50/65 border border-violet-200 text-violet-600">
            About SpaceBook
          </span>
          <h2 id="about-title" data-testid="about-title" className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Seamless Coworking Space Booking System
          </h2>
          <p id="about-subtitle" data-testid="about-subtitle" className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SpaceBook is a state-of-the-art reservation ecosystem designed to streamline room scheduling, conflict resolution, and instant transactions.
          </p>
        </div>

        {/* Banner Image */}
        <div id="about-banner-container" data-testid="about-banner-container" className="relative h-64 md:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
          <img 
            id="about-banner-image"
            data-testid="about-banner-image"
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" 
            alt="Coworking Space Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 space-y-2 text-left">
            <h3 id="about-banner-title" data-testid="about-banner-title" className="text-2xl font-bold text-white shadow-sm">Modern & Collaborative Workspaces</h3>
            <p id="about-banner-description" data-testid="about-banner-description" className="text-sm text-slate-200 shadow-sm">Designed to maximize productivity and networking opportunities.</p>
          </div>
        </div>

        {/* Section 2: Core Academic Purpose (Tesis Highlight) */}
        <div id="about-thesis-card" data-testid="about-thesis-card" className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200/50 flex items-center justify-center text-violet-600 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 id="about-thesis-title" data-testid="about-thesis-title" className="text-xl font-bold text-slate-900 tracking-tight">Academic Research & Tesis Focus</h3>
          </div>
          <p id="about-thesis-description" data-testid="about-thesis-description" className="text-sm text-slate-600 leading-relaxed">
            This application is constructed as an empirical case study for an academic Master's Thesis investigating **AI/Vibe Coding efficacy**. It measures the ability of autonomous AI coders to generate high-fidelity, production-grade systems featuring complex timesheet reservation conflicts, JWT multi-role authorization guards, and server-to-server transaction settlement integrations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Scope of Study</span>
              <p id="about-scope-value" data-testid="about-scope-value" className="text-xs text-slate-700 font-semibold">Automatic Conflict Resolution & Real-time Transactions</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Validation</span>
              <p id="about-validation-value" data-testid="about-validation-value" className="text-xs text-slate-700 font-semibold">E2E Automation Testing Reliability (Cypress/Playwright)</p>
            </div>
          </div>
        </div>

        {/* Section 3: Premium Space Features */}
        <div id="about-amenities-container" data-testid="about-amenities-container" className="space-y-8">
          <div className="text-center md:text-left">
            <h3 id="about-amenities-title" data-testid="about-amenities-title" className="text-2xl font-bold text-slate-900">Amenities & Perks</h3>
            <p className="text-sm text-slate-500 mt-1">Every booking grants complete access to premium coworking facilities.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div id="about-amenity-internet" data-testid="about-amenity-internet" className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Ultra-Speed Internet</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Stable Gigabit fiber connectivity with backup channels to guarantee uninterrupted remote meetings and streaming.</p>
            </div>

            <div id="about-amenity-drinks" data-testid="about-amenity-drinks" className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Coffee className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Free-Flow Premium Drinks</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Unlimited access to fresh-ground espresso, dark-roast coffee, hot teas, and refreshing infused water throughout your stay.</p>
            </div>

            <div id="about-amenity-lounges" data-testid="about-amenity-lounges" className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Ergonomic Lounges</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Sleek hot-desks, premium orthopaedic chairs, and silent privacy booths custom-built for absolute phone call privacy.</p>
            </div>
          </div>
        </div>

        {/* Section 4: System Architecture Features */}
        <div id="about-architecture-container" data-testid="about-architecture-container" className="space-y-6">
          <div className="text-center md:text-left">
            <h3 id="about-architecture-title" data-testid="about-architecture-title" className="text-2xl font-bold text-slate-900">Advanced System Features</h3>
            <p className="text-sm text-slate-500 mt-1">Engineered with high standards of security and reliability.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="about-feature-conflict" data-testid="about-feature-conflict" className="flex gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-900 text-sm">Conflict Avoidance Engine</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time database queries intercept overlaps instantly. A room is reserved only if the chosen date and hours are entirely conflict-free.
                </p>
              </div>
            </div>

            <div id="about-feature-security" data-testid="about-feature-security" className="flex gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-900 text-sm">Secure Server Settlement</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dual-layer payment validation. Midtrans Snap tokens are encrypted, and approvals are verified directly using secure server-to-server HTTPS tokens.
                </p>
              </div>
            </div>

            <div id="about-feature-booking" data-testid="about-feature-booking" className="flex gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-900 text-sm">Seamless Session Booking</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse public timetables freely. Authenticated reservation inputs verify schedules and automatically queue bookings for secure payment.
                </p>
              </div>
            </div>

            <div id="about-feature-test-hooks" data-testid="about-feature-test-hooks" className="flex gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-slate-900 text-sm">Automated Test Hooks</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Equipped with uniquely generated HTML element IDs to support reliable headless browser automation scripts (Cypress/Playwright).
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

