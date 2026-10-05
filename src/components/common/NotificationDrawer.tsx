import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Smartphone,
  Shield,
  Clock,
  Calendar,
  Pill,
  FileText
} from 'lucide-react';
import { NotificationCategory } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConsentModal?: (consentId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenConsentModal
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'IN_APP' | 'SMS' | 'WHATSAPP'>('ALL');
  const [previewNotifId, setPreviewNotifId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoryIcons: Record<NotificationCategory, any> = {
    APPOINTMENT: Calendar,
    PRESCRIPTION: FileText,
    MEDICINE: Pill,
    LAB_REPORT: FileText,
    CONSENT: Shield,
    REFERRAL: Calendar,
    SYSTEM: Bell,
    EMERGENCY: Bell
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              <span>Unified Notification Center</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">In-app, SMS, and WhatsApp alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-teal-800 hover:text-teal-900 font-medium px-2 py-1 rounded hover:bg-teal-50 transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Filters */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs">
          <button
            onClick={() => setSelectedChannel('ALL')}
            className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
              selectedChannel === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setSelectedChannel('WHATSAPP')}
            className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
              selectedChannel === 'WHATSAPP' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            WhatsApp
          </button>
          <button
            onClick={() => setSelectedChannel('SMS')}
            className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
              selectedChannel === 'SMS' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3 h-3 text-blue-600" />
            SMS
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No notifications yet for this user.
            </div>
          ) : (
            notifications.map(notif => {
              const Icon = categoryIcons[notif.category] || Bell;
              const isSelected = previewNotifId === notif.id;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    setPreviewNotifId(isSelected ? null : notif.id);
                  }}
                  className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                    !notif.isRead
                      ? 'bg-teal-50/50 border-teal-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-teal-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-900 truncate">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-teal-800 shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(notif.sentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          {notif.channels.includes('WHATSAPP') && (
                            <span className="text-emerald-700 flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3" /> WA
                            </span>
                          )}
                          {notif.channels.includes('SMS') && (
                            <span className="text-blue-700 flex items-center gap-0.5">
                              <Smartphone className="w-3 h-3" /> SMS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Required: Consent Approval Button */}
                      {notif.category === 'CONSENT' && notif.metadata?.actionRequired && notif.metadata.consentId && (
                        <div className="mt-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenConsentModal && notif.metadata?.consentId) {
                                onOpenConsentModal(notif.metadata.consentId);
                                onClose();
                              }
                            }}
                            className="w-full py-1.5 px-3 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Review Consent Request
                          </button>
                        </div>
                      )}

                      {/* WhatsApp / SMS Preview Box */}
                      {isSelected && (notif.metadata?.whatsappPreview || notif.metadata?.smsPreview) && (
                        <div className="mt-3 p-2.5 bg-slate-900 text-slate-200 rounded-lg space-y-2 text-[11px] font-mono">
                          {notif.metadata.whatsappPreview && (
                            <div>
                              <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> WhatsApp Gateway Payload:
                              </div>
                              <div className="bg-slate-950 p-2 rounded text-slate-300 whitespace-pre-line border border-slate-800">
                                {notif.metadata.whatsappPreview}
                              </div>
                            </div>
                          )}
                          {notif.metadata.smsPreview && (
                            <div>
                              <div className="text-blue-400 font-semibold mb-1 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> SMS Gateway Payload:
                              </div>
                              <div className="bg-slate-950 p-2 rounded text-slate-300 border border-slate-800">
                                {notif.metadata.smsPreview}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
          Delivery status: Active · Telephony & WhatsApp API integrations mock enabled
        </div>
      </div>
    </div>
  );
};
