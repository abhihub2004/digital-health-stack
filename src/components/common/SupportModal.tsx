import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  HelpCircle,
  Phone,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Send,
  Clock,
  Sparkles,
  FileText,
  Lock,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentPatient } = useApp();
  const [activeTab, setActiveTab] = useState<'FAQ' | 'TICKET' | 'HELPLINES'>('FAQ');
  
  // Ticket form state
  const [category, setCategory] = useState('APPOINTMENT');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // FAQ accordion state
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      id: 0,
      question: 'How do I upload and extract my offline lab reports?',
      icon: FileText,
      answer:
        'Go to "Lab Reports" in the sidebar (or click "+ Upload Personal Report" on the Dashboard). You can upload a PDF, image, or text file, or simply paste the raw lab text. The built-in generic OCR parser automatically recognizes test parameters (e.g. Hemoglobin, TLC, Glucose, Lipid levels) and populates normal/abnormal reference status.'
    },
    {
      id: 1,
      question: 'How does doctor consent and privacy protect my records?',
      icon: Lock,
      answer:
        'By default, all your medical records are sealed. Possession of your UHID does not allow any doctor to view your records without prior permission. A doctor must dispatch a consent request, which you approve or deny. You can also revoke consent at any moment from the "Consent Center" with one click.'
    },
    {
      id: 2,
      question: 'How do I track my consultation queue token or cancel an appointment?',
      icon: Calendar,
      answer:
        'Click on "Appointments" in the navigation. You will see all your scheduled consultations, live queue token numbers, and estimated wait times. You can cancel any scheduled visit or book an appointment with a new specialist anytime.'
    },
    {
      id: 3,
      question: 'What is a Unique Health ID (UHID)?',
      icon: ShieldCheck,
      answer:
        'A UHID is your unified national health record identifier. It links your prescriptions, diagnostic tests, and doctor visits across all accredited hospitals while ensuring you remain the sole owner of your data through strict cryptographic consent gates.'
    }
  ];

  const helplines = [
    {
      name: 'National Health Helpline',
      number: '1075',
      desc: 'Toll-Free 24x7 Government Health Advisory & Epidemic Support',
      timing: '24 Hours / 7 Days'
    },
    {
      name: 'Emergency Medical & Ambulance',
      number: '108',
      desc: 'Immediate dispatch for critical trauma, cardiac events, and acute distress',
      timing: 'Immediate 24x7'
    },
    {
      name: 'Tele-MANAS (Mental Health Helpline)',
      number: '14416',
      desc: 'Confidential psychological support & tele-counseling with certified counselors',
      timing: '24x7 Multi-lingual'
    },
    {
      name: 'Digital Health Privacy & Grievance Desk',
      number: '1800-11-4477',
      desc: 'Assistance with UHID linkage, unauthorized record access, and consent queries',
      timing: '09:00 AM - 08:00 PM'
    }
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const tktId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedTicketId(tktId);
  };

  const handleCopyPhone = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedPhone(num);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const handleResetForm = () => {
    setSubmittedTicketId(null);
    setMessage('');
    setSubject('');
    setActiveTab('FAQ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                HealthStack Support Desk
              </h2>
              <p className="text-xs text-slate-500">
                24x7 Help Center, Live Support Inquiries & Emergency Helplines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('FAQ')}
            className={`px-4 py-2 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'FAQ'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Frequently Asked Questions
          </button>
          <button
            onClick={() => setActiveTab('TICKET')}
            className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'TICKET'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Talk to Support</span>
          </button>
          <button
            onClick={() => setActiveTab('HELPLINES')}
            className={`px-4 py-2 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'HELPLINES'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Emergency Helplines</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: FAQ */}
          {activeTab === 'FAQ' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <strong className="text-slate-900 block font-semibold mb-0.5">Quick Answers to Common Healthcare Questions</strong>
                  Click on any question below to see immediate step-by-step instructions or switch to the "Talk to Support" tab to submit a personalized query.
                </div>
              </div>

              <div className="space-y-2.5">
                {faqs.map(faq => {
                  const isOpen = expandedFaqId === faq.id;
                  const Icon = faq.icon;

                  return (
                    <div
                      key={faq.id}
                      className="border border-slate-200/90 rounded-2xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                        className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">{faq.question}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Still have questions?</span>
                <button
                  onClick={() => setActiveTab('TICKET')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send a Support Request</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TALK TO SUPPORT / TICKET */}
          {activeTab === 'TICKET' && (
            <div>
              {submittedTicketId ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Support Request Logged!</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Your query has been dispatched to our dedicated Healthcare Operations Desk. Reference ID:
                    </p>
                    <div className="font-mono text-base font-bold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-xl inline-block mt-2">
                      {submittedTicketId}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    An on-duty coordinator will review your case and reach out via your registered phone number ({currentPatient?.phone || 'on file'}).
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={handleResetForm}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Your Name</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.name}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Linked UHID</label>
                      <input
                        type="text"
                        disabled
                        value={currentPatient?.uhid || 'NA - Facility Account'}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Inquiry Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="APPOINTMENT">Appointments & Queue Tokens</option>
                        <option value="LAB_REPORT">Lab Reports & OCR Extraction</option>
                        <option value="CONSENT">Doctor Consent & Privacy Revocation</option>
                        <option value="PRESCRIPTION">Prescriptions & Medicine Schedules</option>
                        <option value="BLOOD_BANK">Blood Bank & Compatibility Inquiries</option>
                        <option value="TECHNICAL">App Performance & Technical Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Priority Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['NORMAL', 'URGENT', 'CRITICAL'] as const).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`py-2 px-1 text-center rounded-xl font-bold transition-all text-[11px] ${
                              priority === p
                                ? p === 'CRITICAL'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : p === 'URGENT'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your question or issue..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Describe your query in detail</label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please provide details (e.g., date of appointment, doctor name, lab report test name)..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Query</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: HELPLINES */}
          {activeTab === 'HELPLINES' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Emergency Assistance Notice</strong>
                  If you are experiencing severe chest pain, shortness of breath, acute trauma, or any life-threatening condition, immediately dial <strong className="font-mono text-rose-700">108</strong> or visit your nearest emergency room.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {helplines.map((hl, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{hl.name}</h4>
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                          {hl.timing}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{hl.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${hl.number}`}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Dial {hl.number}</span>
                      </a>
                      <button
                        onClick={() => handleCopyPhone(hl.number)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-[11px]"
                      >
                        {copiedPhone === hl.number ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
