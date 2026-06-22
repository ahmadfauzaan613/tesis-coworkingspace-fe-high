import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Contacts() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white text-slate-900 py-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
            Contact Us
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Get in Touch
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Have questions about our coworking spaces, pricing plans, or thesis validation process? Reach out to our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          {/* Contact Details info card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900">Contact Information</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Feel free to contact us via email or phone. We aim to respond to all inquiries within 24 business hours.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Support</span>
                    <a href="mailto:support@spacebook.com" className="text-xs font-semibold text-slate-700 hover:text-indigo-600">
                      support@spacebook.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Call Us</span>
                    <span className="text-xs font-semibold text-slate-700">
                      +62 (21) 555-8930
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location Office</span>
                    <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                      Sudirman Central Business District, Tower 3, Jakarta, Indonesia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Hours of Operations</span>
              <p className="text-xs text-slate-600 font-medium">Monday - Friday: 08:00 AM - 08:00 PM</p>
              <p className="text-xs text-slate-600 font-medium">Saturday - Sunday: Closed</p>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Send Us a Message</h3>
            
            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                <h4 className="font-bold text-emerald-800 text-base">Message Sent Successfully!</h4>
                <p className="text-xs text-emerald-700 max-w-sm">
                  Thank you for reaching out. A SpaceBook team member will contact you shortly.
                </p>
              </div>
            ) : (
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Your Full Name
                    </label>
                    <input 
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Email Address
                    </label>
                    <input 
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Message
                  </label>
                  <textarea 
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    id="btn-send-message"
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-2"
                  >
                    Send Message <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Google Map Section Mock */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 shadow-sm h-64 overflow-hidden relative group">
          <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="w-8 h-8 text-indigo-600 mx-auto animate-bounce" />
              <h4 className="font-bold text-slate-800 text-sm">SpaceBook Headquarters</h4>
              <p className="text-xs text-slate-500">SCBD Tower 3, Jakarta, Indonesia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
