import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookingRecord, 
  BookingStatus, 
  InquiryRecord, 
  RoomUnit, 
  StaffAccount, 
  StaffRole, 
  StaffPermissions,
  BookingAddonItem,
  ChatSession,
  ChatMessage,
  PaxRateTier,
  PresetQA,
  DEFAULT_PRESET_QAS
} from '../types';
import { VillaLogo } from './VillaLogo';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Eye, 
  FileText, 
  Search, 
  Filter, 
  LogOut, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  MessageSquare,
  MessageCircle, 
  HelpCircle, 
  Check, 
  X, 
  Ban, 
  RotateCcw, 
  XCircle, 
  Info,
  CalendarCheck,
  Tag,
  UserCheck,
  ShieldAlert,
  UserPlus,
  KeyRound,
  Sparkles,
  Star,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckSquare,
  Edit2,
  Layers,
  Trash2,
  Headphones,
  Send,
  CheckCheck,
  FileCheck,
  LayoutGrid,
  List,
  Building2,
  Download,
  Award,
  History,
  MapPin,
  Bookmark,
  ChevronRight,
  Copy
} from 'lucide-react';

interface AdminDeskTabProps {
  bookings: BookingRecord[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus, notes?: string) => void;
  onRebookBooking?: (bookingId: string, updatedFields: Partial<BookingRecord>, note: string) => void;
  onEditBooking?: (updatedBooking: BookingRecord) => void;
  onDeleteBooking?: (bookingId: string) => void;
  inquiries?: InquiryRecord[];
  onEditInquiry?: (updatedInquiry: InquiryRecord) => void;
  onDeleteInquiry?: (inquiryId: string) => void;
  onOpenVoucher: (booking: BookingRecord) => void;
  onOpenSlipLightbox: (booking: BookingRecord) => void;
  onAddWalkinBooking: (booking: BookingRecord) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  rooms: RoomUnit[];
  onInventoryRoomsUpdate?: (rooms: RoomUnit[]) => void;
  availableAddons?: BookingAddonItem[];
  onCustomAddonsUpdate?: (addons: BookingAddonItem[]) => void;
}

const DEFAULT_SUPER_ADMIN_PERMISSIONS: StaffPermissions = {
  canApproveSlips: true,
  canRebook: true,
  canCancel: true,
  canWalkin: true,
  canManageStaff: true,
  canViewFinancials: true,
  canCheckInOut: true,
};

const DEFAULT_QUICK_REPLIES = [
  'Welcome to Diversion Vigan! How may we assist your reservation?',
  'Yes, this room unit is available for your requested dates!',
  'Standard check-in is 2:00 PM and check-out is 12:00 NN.',
  'Private Villa with Pool starts at ₱7,000 (Sun–Thu) & ₱8,000 (Fri–Sat).',
  'We are located along Diversion Rd, only 5-8 mins from Calle Crisologo.',
  'Our hourly stay rates are ₱1,500 (3 hrs), ₱2,000 (6 hrs), and ₱2,500 (12 hrs).',
  'We have sent your official booking voucher to your contact details.',
];

const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff-master-001',
    username: 'admin',
    password: 'apelin@123',
    fullName: 'Mark Benedict Apelin (Estate Manager)',
    role: 'Super Admin',
    email: 'admin@diversionvigan.ph',
    phone: '0917 888 1234',
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
    permissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
    createdBy: 'System Root',
  }
];

export const AdminDeskTab: React.FC<AdminDeskTabProps> = ({
  bookings,
  onUpdateBookingStatus,
  onRebookBooking,
  onEditBooking,
  onDeleteBooking,
  inquiries: propInquiries,
  onEditInquiry,
  onDeleteInquiry,
  onOpenVoucher,
  onOpenSlipLightbox,
  onAddWalkinBooking,
  isLoggedIn,
  setIsLoggedIn,
  rooms,
  onInventoryRoomsUpdate,
  availableAddons,
  onCustomAddonsUpdate,
}) => {
  // Login credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Staff accounts persistent state
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_staff_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(
            (a: StaffAccount) =>
              a.username !== 'frontdesk1' &&
              a.username !== 'reception_night' &&
              !a.fullName?.includes('Maria Santos') &&
              !a.fullName?.includes('Carlo Reyes')
          );
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_STAFF_ACCOUNTS;
  });

  // Current logged in user object
  const [currentUser, setCurrentUser] = useState<StaffAccount | null>(() => {
    try {
      const saved = localStorage.getItem('diversion_current_staff_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Sync staff accounts to storage
  useEffect(() => {
    localStorage.setItem('diversion_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  // Sync logged in user
  useEffect(() => {
    if (currentUser && isLoggedIn) {
      localStorage.setItem('diversion_current_staff_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('diversion_current_staff_user');
    }
  }, [currentUser, isLoggedIn]);

  // Clean-up session storage when user leaves the Front Desk section
  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem('diversion_admin_session');
        localStorage.removeItem('diversion_current_staff_user');
      } catch {
        // ignore
      }
    };
  }, []);

  // Admin filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'screening' | 'rebook' | 'inquiries' | 'chat' | 'walkin' | 'staff' | 'inventory' | 'guests'>('bookings');

  // Room Inventory State for Admin Desk Customization
  const [inventoryRooms, setInventoryRooms] = useState<RoomUnit[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_admin_inventory_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return rooms;
  });

  const onInventoryRoomsUpdateRef = useRef(onInventoryRoomsUpdate);
  useEffect(() => {
    onInventoryRoomsUpdateRef.current = onInventoryRoomsUpdate;
  }, [onInventoryRoomsUpdate]);

  const lastSyncedRoomsJsonRef = useRef<string>(JSON.stringify(rooms));

  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const incomingJson = JSON.stringify(rooms);
      if (incomingJson !== lastSyncedRoomsJsonRef.current) {
        lastSyncedRoomsJsonRef.current = incomingJson;
        setInventoryRooms(rooms);
      }
    }
  }, [rooms]);

  useEffect(() => {
    const currentJson = JSON.stringify(inventoryRooms);
    localStorage.setItem('diversion_admin_inventory_rooms', currentJson);
    if (currentJson !== lastSyncedRoomsJsonRef.current) {
      lastSyncedRoomsJsonRef.current = currentJson;
      if (onInventoryRoomsUpdateRef.current) {
        onInventoryRoomsUpdateRef.current(inventoryRooms);
      }
    }
  }, [inventoryRooms]);

  // Specific Date Rates: { [roomId: string]: { [dateStr: string]: number } }
  const [dateRates, setDateRates] = useState<{ [roomId: string]: { [dateStr: string]: number } }>(() => {
    try {
      const saved = localStorage.getItem('diversion_admin_date_rates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('diversion_admin_date_rates', JSON.stringify(dateRates));
  }, [dateRates]);

  // Custom Addons: BookingAddonItem[]
  const [customAddons, setCustomAddons] = useState<BookingAddonItem[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_admin_custom_addons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return availableAddons && availableAddons.length > 0 ? availableAddons : [
      { id: 'breakfast_set', name: 'Breakfast', price: 120, unitLabel: '₱120 per head', isPerNight: true, quantity: 0, description: 'Fresh hot breakfast set (garlic longganisa, fried egg, sinangag rice & native coffee)', paxCount: 1, pricingType: 'per_pax', category: 'breakfast', isActive: true },
      { id: 'extra_pad', name: 'Extra Mattress / Pad', price: 400, unitLabel: '₱400 / night', isPerNight: true, quantity: 0, description: 'Thick mattress with linens and pillow', paxCount: 1, pricingType: 'fixed_unit', category: 'extra_bed', isActive: true },
    ];
  });

  const onCustomAddonsUpdateRef = useRef(onCustomAddonsUpdate);
  useEffect(() => {
    onCustomAddonsUpdateRef.current = onCustomAddonsUpdate;
  }, [onCustomAddonsUpdate]);

  const lastSyncedAddonsJsonRef = useRef<string>(JSON.stringify(availableAddons));

  useEffect(() => {
    if (availableAddons && availableAddons.length > 0) {
      const incomingJson = JSON.stringify(availableAddons);
      if (incomingJson !== lastSyncedAddonsJsonRef.current) {
        lastSyncedAddonsJsonRef.current = incomingJson;
        setCustomAddons(availableAddons);
      }
    }
  }, [availableAddons]);

  useEffect(() => {
    const currentJson = JSON.stringify(customAddons);
    localStorage.setItem('diversion_admin_custom_addons', currentJson);
    if (currentJson !== lastSyncedAddonsJsonRef.current) {
      lastSyncedAddonsJsonRef.current = currentJson;
      if (onCustomAddonsUpdateRef.current) {
        onCustomAddonsUpdateRef.current(customAddons);
      }
    }
  }, [customAddons]);

  const [editingRoomId, setEditingRoomId] = useState<string>(rooms[0]?.id || '');
  const selectedInventoryRoom = useMemo(() => {
    return inventoryRooms.find((r) => r.id === editingRoomId) || inventoryRooms[0];
  }, [inventoryRooms, editingRoomId]);

  const [newRateDate, setNewRateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newRateAmount, setNewRateAmount] = useState<string>('1500');
  const [newRateLabel, setNewRateLabel] = useState<string>('Special Holiday Rate');
  const [newPaxLabel, setNewPaxLabel] = useState<string>('');
  const [newPaxCount, setNewPaxCount] = useState<string>('2');
  const [newPaxWeekdayRate, setNewPaxWeekdayRate] = useState<string>('1000');
  const [newPaxWeekendRate, setNewPaxWeekendRate] = useState<string>('1200');

  const [coverUrlInput, setCoverUrlInput] = useState<string>('');

  // Copy Rate Settings State
  const [showCopyRatesModal, setShowCopyRatesModal] = useState(false);
  const [copyTargetRoomIds, setCopyTargetRoomIds] = useState<string[]>([]);
  const [copyIncludeSpecialDates, setCopyIncludeSpecialDates] = useState(true);

  const handleCopyRatesToRooms = () => {
    if (!selectedInventoryRoom || copyTargetRoomIds.length === 0) return;

    const sourceRoom = selectedInventoryRoom;

    setInventoryRooms((prev) =>
      prev.map((r) => {
        if (copyTargetRoomIds.includes(r.id)) {
          return {
            ...r,
            pricing: { ...sourceRoom.pricing },
            paxRates: sourceRoom.paxRates ? JSON.parse(JSON.stringify(sourceRoom.paxRates)) : r.paxRates,
            capacity: { ...sourceRoom.capacity },
            extraPaxFee: sourceRoom.extraPaxFee,
            extraPadFee: sourceRoom.extraPadFee,
            weekdayRateDisplay: sourceRoom.weekdayRateDisplay,
            weekendRateDisplay: sourceRoom.weekendRateDisplay,
          };
        }
        return r;
      })
    );

    if (copyIncludeSpecialDates && dateRates[sourceRoom.id]) {
      const sourceDates = dateRates[sourceRoom.id];
      setDateRates((prev) => {
        const next = { ...prev };
        copyTargetRoomIds.forEach((targetId) => {
          next[targetId] = { ...(next[targetId] || {}), ...sourceDates };
        });
        return next;
      });
    }

    const copiedRoomNames = inventoryRooms
      .filter((r) => copyTargetRoomIds.includes(r.id))
      .map((r) => r.roomNumber || r.title)
      .join(', ');

    alert(`Rate settings from ${sourceRoom.roomNumber || sourceRoom.title} successfully copied to: ${copiedRoomNames}!`);
    setShowCopyRatesModal(false);
    setCopyTargetRoomIds([]);
  };

  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('150');
  const [newAddonPaxBasis, setNewAddonPaxBasis] = useState<'per_pax' | 'fixed_unit' | 'per_night'>('per_pax');
  const [newAddonPaxCount, setNewAddonPaxCount] = useState<number>(1);
  const [newAddonCategory, setNewAddonCategory] = useState<'breakfast' | 'extra_bed' | 'pool' | 'tour' | 'amenity' | 'custom'>('breakfast');
  const [newAddonIsPerNight, setNewAddonIsPerNight] = useState<boolean>(true);
  const [newAddonUnitLabel, setNewAddonUnitLabel] = useState('₱150 per pax');
  const [newAddonDesc, setNewAddonDesc] = useState('');
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonActionFeedback, setAddonActionFeedback] = useState<string | null>(null);

  // Grid and Table View Option States
  const [bookingsViewMode, setBookingsViewMode] = useState<'table' | 'grid'>('table');
  const [screeningViewMode, setScreeningViewMode] = useState<'grid' | 'table'>('grid');
  const [inquiriesViewMode, setInquiriesViewMode] = useState<'table' | 'grid'>('table');
  const [staffViewMode, setStaffViewMode] = useState<'table' | 'grid'>('table');
  const [walkinViewMode, setWalkinViewMode] = useState<'grid' | 'table'>('grid');
  const [rebookViewMode, setRebookViewMode] = useState<'table' | 'grid'>('table');

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState<BookingRecord | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>('Guest Requested Cancellation');
  const [cancelRefundNotes, setCancelRefundNotes] = useState<string>('');
  const [viewingCancellationBooking, setViewingCancellationBooking] = useState<BookingRecord | null>(null);

  // Review Screening Modal & State
  const [screeningBooking, setScreeningBooking] = useState<BookingRecord | null>(null);
  const [checkImageVerified, setCheckImageVerified] = useState(false);
  const [checkAmountVerified, setCheckAmountVerified] = useState(false);
  const [checkRefNumberVerified, setCheckRefNumberVerified] = useState(false);
  const [screeningStaffNotes, setScreeningStaffNotes] = useState('');

  // Rebooking State
  const [rebookRefInput, setRebookRefInput] = useState('');
  const [selectedRebookBooking, setSelectedRebookBooking] = useState<BookingRecord | null>(null);
  const [rebookRoomId, setRebookRoomId] = useState('');
  const [rebookCheckIn, setRebookCheckIn] = useState('');
  const [rebookCheckOut, setRebookCheckOut] = useState('');
  const [rebookHourlyDate, setRebookHourlyDate] = useState('');
  const [rebookHourlyTime, setRebookHourlyTime] = useState('14:00');
  const [rebookHourlyHours, setRebookHourlyHours] = useState(3);
  const [rebookAdults, setRebookAdults] = useState(2);
  const [rebookChildren, setRebookChildren] = useState(0);
  const [rebookReason, setRebookReason] = useState('Guest Requested Schedule Adjustment');
  const [rebookSuccessMsg, setRebookSuccessMsg] = useState('');

  // Create Staff Account Form State
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('Front Desk Officer');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPermissions, setNewStaffPermissions] = useState<StaffPermissions>({
    canApproveSlips: true,
    canRebook: true,
    canCancel: false,
    canWalkin: true,
    canManageStaff: false,
    canViewFinancials: false,
    canCheckInOut: true,
  });
  const [staffCreateSuccess, setStaffCreateSuccess] = useState(false);
  const [staffActionError, setStaffActionError] = useState('');

  // Custom Quick Replies State & Management
  const [quickReplies, setQuickReplies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_vigan_custom_quick_replies');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUICK_REPLIES;
  });

  const [isQuickRepliesModalOpen, setIsQuickRepliesModalOpen] = useState(false);
  const [newQuickReplyText, setNewQuickReplyText] = useState('');
  const [editingQuickReplyIndex, setEditingQuickReplyIndex] = useState<number | null>(null);
  const [editingQuickReplyText, setEditingQuickReplyText] = useState('');

  const handleSaveQuickReplies = (updated: string[]) => {
    setQuickReplies(updated);
    try {
      localStorage.setItem('diversion_vigan_custom_quick_replies', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving quick replies:', err);
    }
  };

  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newQuickReplyText.trim();
    if (!text) return;
    const updated = [...quickReplies, text];
    handleSaveQuickReplies(updated);
    setNewQuickReplyText('');
  };

  const handleUpdateQuickReply = (index: number) => {
    const text = editingQuickReplyText.trim();
    if (!text) return;
    const updated = [...quickReplies];
    updated[index] = text;
    handleSaveQuickReplies(updated);
    setEditingQuickReplyIndex(null);
    setEditingQuickReplyText('');
  };

  const handleDeleteQuickReply = (index: number) => {
    const updated = quickReplies.filter((_, i) => i !== index);
    handleSaveQuickReplies(updated);
    if (editingQuickReplyIndex === index) {
      setEditingQuickReplyIndex(null);
    }
  };

  const handleResetQuickReplies = () => {
    if (window.confirm('Reset quick replies to standard hotel response templates?')) {
      handleSaveQuickReplies(DEFAULT_QUICK_REPLIES);
      setEditingQuickReplyIndex(null);
    }
  };

  // Preset Questions & Automated Answers (FAQs) State & Management
  const [presetQAs, setPresetQAs] = useState<PresetQA[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_vigan_custom_preset_faqs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PRESET_QAS;
  });

  const [isPresetQAModalOpen, setIsPresetQAModalOpen] = useState(false);
  const [editingQAId, setEditingQAId] = useState<string | null>(null);

  // New QA Form State
  const [newQAQuestion, setNewQAQuestion] = useState('');
  const [newQAKeywords, setNewQAKeywords] = useState('');
  const [newQAAnswer, setNewQAAnswer] = useState('');
  const [newQAShowAsChip, setNewQAShowAsChip] = useState(true);

  // Edit QA Form State
  const [editQAQuestion, setEditQAQuestion] = useState('');
  const [editQAKeywords, setEditQAKeywords] = useState('');
  const [editQAAnswer, setEditQAAnswer] = useState('');
  const [editQAShowAsChip, setEditQAShowAsChip] = useState(true);

  const handleSavePresetQAs = (updated: PresetQA[]) => {
    setPresetQAs(updated);
    try {
      localStorage.setItem('diversion_vigan_custom_preset_faqs', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('diversion_preset_faqs_update'));
    } catch (err) {
      console.error('Error saving preset QAs:', err);
    }
  };

  const handleAddPresetQA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQAQuestion.trim() || !newQAAnswer.trim()) return;
    const newItem: PresetQA = {
      id: 'pqa-' + Date.now(),
      question: newQAQuestion.trim(),
      keywords: newQAKeywords.trim() || newQAQuestion.trim().toLowerCase(),
      answer: newQAAnswer.trim(),
      showAsChip: newQAShowAsChip,
    };
    const updated = [...presetQAs, newItem];
    handleSavePresetQAs(updated);
    setNewQAQuestion('');
    setNewQAKeywords('');
    setNewQAAnswer('');
    setNewQAShowAsChip(true);
  };

  const handleStartEditPresetQA = (item: PresetQA) => {
    setEditingQAId(item.id);
    setEditQAQuestion(item.question);
    setEditQAKeywords(item.keywords || '');
    setEditQAAnswer(item.answer);
    setEditQAShowAsChip(item.showAsChip !== false);
  };

  const handleUpdatePresetQA = (id: string) => {
    if (!editQAQuestion.trim() || !editQAAnswer.trim()) return;
    const updated = presetQAs.map((item) =>
      item.id === id
        ? {
            ...item,
            question: editQAQuestion.trim(),
            keywords: editQAKeywords.trim(),
            answer: editQAAnswer.trim(),
            showAsChip: editQAShowAsChip,
          }
        : item
    );
    handleSavePresetQAs(updated);
    setEditingQAId(null);
  };

  const handleDeletePresetQA = (id: string) => {
    const updated = presetQAs.filter((item) => item.id !== id);
    handleSavePresetQAs(updated);
    if (editingQAId === id) setEditingQAId(null);
  };

  const handleResetPresetQAs = () => {
    if (window.confirm('Reset all Preset Questions & Answers back to default?')) {
      handleSavePresetQAs(DEFAULT_PRESET_QAS);
      setEditingQAId(null);
    }
  };

  // Live Chat Sessions State for Front Desk
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('diversion_vigan_live_chat_sessions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [selectedChatSessionId, setSelectedChatSessionId] = useState<string | null>(null);
  const [adminChatInput, setAdminChatInput] = useState<string>('');
  const adminChatEndRef = useRef<HTMLDivElement>(null);

  const selectedChatSessionIdRef = useRef(selectedChatSessionId);
  useEffect(() => {
    selectedChatSessionIdRef.current = selectedChatSessionId;
  }, [selectedChatSessionId]);

  // Sync chat sessions with localStorage and cross-window events
  useEffect(() => {
    const syncChat = () => {
      try {
        const saved = localStorage.getItem('diversion_vigan_live_chat_sessions');
        if (saved) {
          const parsed: ChatSession[] = JSON.parse(saved);
          setChatSessions(parsed);
          if (!selectedChatSessionIdRef.current && parsed.length > 0) {
            setSelectedChatSessionId(parsed[0].id);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', syncChat);
    window.addEventListener('diversion_chat_update', syncChat);

    return () => {
      window.removeEventListener('storage', syncChat);
      window.removeEventListener('diversion_chat_update', syncChat);
    };
  }, []);

  // Set default selected session if none
  useEffect(() => {
    if (!selectedChatSessionId && chatSessions.length > 0) {
      setSelectedChatSessionId(chatSessions[0].id);
    }
  }, [chatSessions, selectedChatSessionId]);

  // Auto scroll in admin chat box
  useEffect(() => {
    if (activeSubTab === 'chat') {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSessions, selectedChatSessionId, activeSubTab]);

  const activeChatSession = useMemo(() => {
    return chatSessions.find((s) => s.id === selectedChatSessionId) || chatSessions[0] || null;
  }, [chatSessions, selectedChatSessionId]);

  const totalUnreadDeskChats = useMemo(() => {
    return chatSessions.reduce((sum, s) => sum + (s.unreadCountForDesk || 0), 0);
  }, [chatSessions]);

  // Handle Front Desk Sending a Reply
  const handleSendAdminReply = (textToSend?: string) => {
    const text = (textToSend || adminChatInput).trim();
    if (!text || !activeChatSession) return;

    const staffSender = currentUser?.fullName || 'Mark Benedict Apelin (Estate Manager)';
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: 'front_desk',
      senderName: staffSender,
      text,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    const updated = chatSessions.map((sess) => {
      if (sess.id === activeChatSession.id) {
        const msgs = [...sess.messages, newMsg];
        return {
          ...sess,
          unreadCountForDesk: 0,
          unreadCountForGuest: (sess.unreadCountForGuest || 0) + 1,
          lastMessage: text,
          lastTimestamp: newMsg.timestamp,
          messages: msgs,
        };
      }
      return sess;
    });

    setChatSessions(updated);
    localStorage.setItem('diversion_vigan_live_chat_sessions', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('diversion_chat_update', { detail: { sessionId: activeChatSession.id } }));
    setAdminChatInput('');
  };

  // Clear or Delete a chat session
  const handleDeleteChatSession = (sessionId: string) => {
    const updated = chatSessions.filter((s) => s.id !== sessionId);
    setChatSessions(updated);
    localStorage.setItem('diversion_vigan_live_chat_sessions', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('diversion_chat_update', { detail: { sessionId } }));
    if (selectedChatSessionId === sessionId) {
      setSelectedChatSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Inquiries from localStorage
  const inquiries: InquiryRecord[] = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('diversion_vigan_inquiries') || '[]');
    } catch {
      return [];
    }
  }, [activeSubTab]);


  // ==================== GUEST DATABASE CRM STATE & LOGIC ====================
  interface GuestProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    idType?: string;
    idNumber?: string;
    isVip: boolean;
    notes?: string;
    firstStayDate?: string;
    lastStayDate?: string;
    totalStays: number;
    totalSpend: number;
    bookings: BookingRecord[];
    inquiries: InquiryRecord[];
    source: "booking" | "inquiry" | "manual";
    createdAt: string;
  }

  const [customGuests, setCustomGuests] = useState<Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    idType?: string;
    idNumber?: string;
    isVip?: boolean;
    notes?: string;
    createdAt: string;
  }>>(() => {
    try {
      return JSON.parse(localStorage.getItem("diversion_vigan_custom_guests") || "[]");
    } catch {
      return [];
    }
  });

  const [guestOverrides, setGuestOverrides] = useState<Record<string, { fullName?: string; phone?: string; email?: string; address?: string; idType?: string; idNumber?: string; notes?: string; isVip?: boolean }>>(() => {
    try {
      return JSON.parse(localStorage.getItem("diversion_vigan_guest_overrides") || "{}");
    } catch {
      return {};
    }
  });

  const [deletedGuestIds, setDeletedGuestIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("diversion_deleted_guest_ids") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("diversion_deleted_guest_ids", JSON.stringify(deletedGuestIds));
  }, [deletedGuestIds]);

  // Section Modal States
  const [editingGuestProfile, setEditingGuestProfile] = useState<GuestProfile | null>(null);
  const [deletingGuestProfile, setDeletingGuestProfile] = useState<GuestProfile | null>(null);

  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<BookingRecord | null>(null);

  const [editingInquiry, setEditingInquiry] = useState<InquiryRecord | null>(null);
  const [deletingInquiry, setDeletingInquiry] = useState<InquiryRecord | null>(null);

  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [guestFilterStatus, setGuestFilterStatus] = useState<"all" | "vip" | "repeat" | "active" | "inquiry">("all");
  const [guestSortBy, setGuestSortBy] = useState<"recent" | "stays" | "spend" | "name">("recent");
  const [guestViewMode, setGuestViewMode] = useState<"table" | "grid">("table");
  const [selectedGuestDossier, setSelectedGuestDossier] = useState<GuestProfile | null>(null);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [editingGuestNotesId, setEditingGuestNotesId] = useState<string | null>(null);
  const [tempNotesInput, setTempNotesInput] = useState("");
  const [tempVipInput, setTempVipInput] = useState(false);
  const [guestToastMessage, setGuestToastMessage] = useState<string | null>(null);

  const [newGuestForm, setNewGuestForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    idType: "Driver’s License",
    idNumber: "",
    isVip: false,
    notes: "",
  });

  // Calculate Unified Guest Profiles
  const guestProfiles: GuestProfile[] = useMemo(() => {
    const map = new Map<string, GuestProfile>();

    // 1. Ingest Bookings
    bookings.forEach((b) => {
      const rawKey = (b.guestPhone || b.guestEmail || b.guestName || "").trim().toLowerCase();
      if (!rawKey) return;
      const key = rawKey;

      const isConfirmedStay = b.status === "Confirmed" || b.status === "Checked-In" || b.status === "Completed";
      const spend = isConfirmedStay ? (b.grandTotal || 0) : 0;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: key,
          fullName: b.guestName || "Guest",
          email: b.guestEmail || "",
          phone: b.guestPhone || "",
          address: "",
          idType: undefined,
          idNumber: undefined,
          isVip: false,
          notes: b.specialRequests || b.staffNotes || "",
          firstStayDate: b.checkInDate || b.hourlyDate,
          lastStayDate: b.checkInDate,
          totalStays: isConfirmedStay ? 1 : 0,
          totalSpend: spend,
          bookings: [b],
          inquiries: [],
          source: "booking",
          createdAt: b.createdAt || new Date().toISOString(),
        });
      } else {
        existing.bookings.push(b);
        if (isConfirmedStay) {
          existing.totalStays += 1;
          existing.totalSpend += spend;
        }
        const bDate = b.checkInDate || b.hourlyDate;
        if (bDate && (!existing.lastStayDate || new Date(bDate) > new Date(existing.lastStayDate))) {
          existing.lastStayDate = bDate;
        }
        if (bDate && (!existing.firstStayDate || new Date(bDate) < new Date(existing.firstStayDate))) {
          existing.firstStayDate = bDate;
        }
        if (!existing.email && b.guestEmail) existing.email = b.guestEmail;
        if (!existing.phone && b.guestPhone) existing.phone = b.guestPhone;
        if (!existing.notes && (b.specialRequests || b.staffNotes)) existing.notes = b.specialRequests || b.staffNotes;
      }
    });

    // 2. Ingest Inquiries
    inquiries.forEach((inq) => {
      const key = (inq.phone || inq.email || inq.fullName || "").trim().toLowerCase();
      if (!key) return;

      const existing = map.get(key);
      if (existing) {
        existing.inquiries.push(inq);
      } else {
        map.set(key, {
          id: key,
          fullName: inq.fullName || "Inquiry Lead",
          email: inq.email || "",
          phone: inq.phone || "",
          address: "",
          isVip: false,
          notes: `Inquiry interest: ${inq.roomInterest || "Accommodations"} • ${inq.message || ""}`,
          totalStays: 0,
          totalSpend: 0,
          bookings: [],
          inquiries: [inq],
          source: "inquiry",
          createdAt: inq.createdAt || new Date().toISOString(),
        });
      }
    });

    // 3. Ingest Manual Custom Guests
    customGuests.forEach((cg) => {
      const key = (cg.phone || cg.email || cg.fullName || cg.id).trim().toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (cg.address) existing.address = cg.address;
        if (cg.idType) existing.idType = cg.idType;
        if (cg.idNumber) existing.idNumber = cg.idNumber;
        if (cg.notes) existing.notes = cg.notes;
        if (cg.isVip) existing.isVip = true;
      } else {
        map.set(key, {
          id: key,
          fullName: cg.fullName,
          email: cg.email || "",
          phone: cg.phone || "",
          address: cg.address || "",
          idType: cg.idType,
          idNumber: cg.idNumber,
          isVip: !!cg.isVip,
          notes: cg.notes || "",
          totalStays: 0,
          totalSpend: 0,
          bookings: [],
          inquiries: [],
          source: "manual",
          createdAt: cg.createdAt || new Date().toISOString(),
        });
      }
    });

    // 4. Apply Overrides and Auto-VIP logic
    return Array.from(map.values())
      .filter((g) => !deletedGuestIds.includes(g.id))
      .map((g) => {
        const override = guestOverrides[g.id];
        const autoVip = g.totalStays >= 2 || g.totalSpend >= 5000;
        const isVip = override?.isVip !== undefined ? override.isVip : (g.isVip || autoVip);
        const notes = override?.notes !== undefined ? override.notes : g.notes;
        const fullName = override?.fullName || g.fullName;
        const phone = override?.phone || g.phone;
        const email = override?.email || g.email;
        const address = override?.address !== undefined ? override.address : g.address;
        const idType = override?.idType !== undefined ? override.idType : g.idType;
        const idNumber = override?.idNumber !== undefined ? override.idNumber : g.idNumber;

        return {
          ...g,
          fullName,
          phone,
          email,
          address,
          idType,
          idNumber,
          isVip,
          notes,
        };
      });
  }, [bookings, inquiries, customGuests, guestOverrides, deletedGuestIds]);

  const guestDatabaseAnalytics = useMemo(() => {
    const total = guestProfiles.length;
    const vip = guestProfiles.filter((g) => g.isVip).length;
    const totalStays = guestProfiles.reduce((acc, g) => acc + g.totalStays, 0);
    const totalSpend = guestProfiles.reduce((acc, g) => acc + g.totalSpend, 0);
    return { total, vip, totalStays, totalSpend };
  }, [guestProfiles]);

  const filteredGuestProfiles = useMemo(() => {
    return guestProfiles
      .filter((g) => {
        // Filter pills
        if (guestFilterStatus === "vip" && !g.isVip) return false;
        if (guestFilterStatus === "repeat" && g.totalStays < 2) return false;
        if (guestFilterStatus === "active") {
          const hasActiveStay = g.bookings.some((b) => b.status === "Checked-In");
          if (!hasActiveStay) return false;
        }
        if (guestFilterStatus === "inquiry") {
          if (g.bookings.length > 0 && g.totalStays > 0) return false;
        }

        // Search query
        if (guestSearchQuery.trim()) {
          const q = guestSearchQuery.toLowerCase().trim();
          const matchName = g.fullName.toLowerCase().includes(q);
          const matchEmail = g.email.toLowerCase().includes(q);
          const matchPhone = g.phone.toLowerCase().includes(q);
          const matchAddress = (g.address || "").toLowerCase().includes(q);
          const matchNotes = (g.notes || "").toLowerCase().includes(q);
          const matchIdNum = (g.idNumber || "").toLowerCase().includes(q);
          const matchBookings = g.bookings.some(
            (b) => b.id.toLowerCase().includes(q) || (b.roomId || "").toLowerCase().includes(q)
          );
          if (!matchName && !matchEmail && !matchPhone && !matchAddress && !matchNotes && !matchIdNum && !matchBookings) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (guestSortBy === "stays") {
          return b.totalStays - a.totalStays;
        }
        if (guestSortBy === "spend") {
          return b.totalSpend - a.totalSpend;
        }
        if (guestSortBy === "name") {
          return a.fullName.localeCompare(b.fullName);
        }
        // recent
        const dateA = a.lastStayDate ? new Date(a.lastStayDate).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.lastStayDate ? new Date(b.lastStayDate).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [guestProfiles, guestFilterStatus, guestSearchQuery, guestSortBy]);

  const handleSaveGuestOverride = (guestId: string, notes: string, isVip: boolean) => {
    const updated = {
      ...guestOverrides,
      [guestId]: { notes, isVip },
    };
    setGuestOverrides(updated);
    localStorage.setItem("diversion_vigan_guest_overrides", JSON.stringify(updated));
    setGuestToastMessage("Guest notes & VIP status updated successfully!");
    setTimeout(() => setGuestToastMessage(null), 3000);
    if (selectedGuestDossier && selectedGuestDossier.id === guestId) {
      setSelectedGuestDossier({ ...selectedGuestDossier, notes, isVip });
    }
  };

  const handleAddCustomGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestForm.fullName.trim() || !newGuestForm.phone.trim()) {
      alert("Please provide at least Guest Full Name and Phone Number.");
      return;
    }
    const newGuest = {
      ...newGuestForm,
      id: `guest-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newGuest, ...customGuests];
    setCustomGuests(updated);
    localStorage.setItem("diversion_vigan_custom_guests", JSON.stringify(updated));
    setNewGuestForm({
      fullName: "",
      phone: "",
      email: "",
      address: "",
      idType: "Driver’s License",
      idNumber: "",
      isVip: false,
      notes: "",
    });
    setIsAddGuestModalOpen(false);
    setGuestToastMessage("New guest record added to database!");
    setTimeout(() => setGuestToastMessage(null), 3000);
  };

  const handleInitiateWalkinForGuest = (guest: GuestProfile) => {
    setWalkinName(guest.fullName);
    setWalkinPhone(guest.phone);
    setActiveSubTab("walkin");
    setSelectedGuestDossier(null);
  };

  const exportGuestsToCSV = () => {
    const headers = [
      "Full Name",
      "Phone Number",
      "Email",
      "Address",
      "ID Type",
      "ID Number",
      "VIP Status",
      "Total Stays",
      "Total Spend (PHP)",
      "First Stay",
      "Last Stay",
      "Source",
      "Front Desk Notes",
    ];

    const rows = filteredGuestProfiles.map((g) => [
      `"${g.fullName.replace(/"/g, '""')}"`,
      `"${g.phone.replace(/"/g, '""')}"`,
      `"${g.email.replace(/"/g, '""')}"`,
      `"${(g.address || "").replace(/"/g, '""')}"`,
      `"${(g.idType || "").replace(/"/g, '""')}"`,
      `"${(g.idNumber || "").replace(/"/g, '""')}"`,
      g.isVip ? "VIP" : "Standard",
      g.totalStays,
      g.totalSpend,
      g.firstStayDate || "",
      g.lastStayDate || "",
      g.source,
      `"${(g.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Diversion_Vigan_Guest_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Walk-in form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinRoomId, setWalkinRoomId] = useState(rooms[0]?.id || '');
  const [walkinNights, setWalkinNights] = useState(1);
  const [walkinPaymentOption, setWalkinPaymentOption] = useState<'full' | 'partial_40'>('full');
  const [walkinSuccess, setWalkinSuccess] = useState(false);

  // Active permissions for current user (defaults to superadmin if legacy session)
  const currentPermissions = currentUser ? currentUser.permissions : DEFAULT_SUPER_ADMIN_PERMISSIONS;

  // Authentication submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const matched = staffAccounts.find(
      (acc) => acc.username.toLowerCase() === cleanUser && acc.password === password
    );

    // Also support root master fallback if not in list
    if (cleanUser === 'admin' && password === 'apelin@123') {
      const rootAcc: StaffAccount = staffAccounts.find(a => a.username === 'admin') || DEFAULT_STAFF_ACCOUNTS[0];
      setCurrentUser(rootAcc);
      setIsLoggedIn(true);
      setAuthError('');
      localStorage.setItem('diversion_admin_session', 'true');
      return;
    }

    if (matched) {
      if (!matched.isActive) {
        setAuthError('This staff account is deactivated. Contact estate manager.');
        return;
      }
      setCurrentUser(matched);
      setIsLoggedIn(true);
      setAuthError('');
      localStorage.setItem('diversion_admin_session', 'true');
    } else {
      setAuthError('Invalid username or password. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('diversion_admin_session');
    localStorage.removeItem('diversion_current_staff_user');
    setUsername('');
    setPassword('');
  };

  // Analytics Computation
  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
    const totalCollected = activeBookings.reduce((sum, b) => sum + (b.amountPaidNow || 0), 0);
    const totalPendingBalance = activeBookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
    const pendingSlips = bookings.filter((b) => b.status === 'Pending Slip Review').length;
    const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayCheckins = activeBookings.filter((b) => b.checkInDate === today || b.hourlyDate === today).length;

    return {
      totalBookings,
      totalCollected,
      totalPendingBalance,
      pendingSlips,
      todayCheckins,
      cancelledCount,
    };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'All' && b.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.guestName.toLowerCase().includes(q);
        const matchesPhone = b.guestPhone.includes(q);
        const matchesId = b.id.toLowerCase().includes(q);
        const matchesRoom = b.roomTitle.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId || matchesRoom;
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  // List of bookings requiring review screening
  const pendingScreeningBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'Pending Slip Review');
  }, [bookings]);

  // Open screening drawer/modal
  const handleStartScreening = (booking: BookingRecord) => {
    setScreeningBooking(booking);
    setCheckImageVerified(false);
    setCheckAmountVerified(false);
    setCheckRefNumberVerified(false);
    setScreeningStaffNotes(
      `Deposit verified by ${currentUser?.fullName || 'Front Desk'} on ${new Date().toLocaleDateString()}`
    );
  };

  // Approve slip via screening
  const handleApproveScreening = () => {
    if (!screeningBooking) return;
    onUpdateBookingStatus(screeningBooking.id, 'Confirmed', screeningStaffNotes || 'Deposit slip verified and approved.');
    setScreeningBooking(null);
  };

  // Reject slip via screening
  const handleRejectScreening = (reason: string) => {
    if (!screeningBooking) return;
    onUpdateBookingStatus(screeningBooking.id, 'Cancelled', `[SLIP REJECTED] ${reason}`);
    setScreeningBooking(null);
  };

  // Preset role permissions helper
  const applyRolePreset = (role: StaffRole) => {
    setNewStaffRole(role);
    switch (role) {
      case 'Super Admin':
        setNewStaffPermissions(DEFAULT_SUPER_ADMIN_PERMISSIONS);
        break;
      case 'Front Desk Supervisor':
        setNewStaffPermissions({
          canApproveSlips: true,
          canRebook: true,
          canCancel: true,
          canWalkin: true,
          canManageStaff: false,
          canViewFinancials: true,
          canCheckInOut: true,
        });
        break;
      case 'Front Desk Officer':
        setNewStaffPermissions({
          canApproveSlips: true,
          canRebook: true,
          canCancel: false,
          canWalkin: true,
          canManageStaff: false,
          canViewFinancials: true,
          canCheckInOut: true,
        });
        break;
      case 'Reservations Clerk':
        setNewStaffPermissions({
          canApproveSlips: true,
          canRebook: true,
          canCancel: false,
          canWalkin: false,
          canManageStaff: false,
          canViewFinancials: false,
          canCheckInOut: false,
        });
        break;
      case 'Night Auditor':
        setNewStaffPermissions({
          canApproveSlips: false,
          canRebook: false,
          canCancel: false,
          canWalkin: true,
          canManageStaff: false,
          canViewFinancials: false,
          canCheckInOut: true,
        });
        break;
    }
  };

  // Create staff account submit
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffActionError('');

    const cleanUsername = newStaffUsername.trim().toLowerCase();
    if (!cleanUsername || !newStaffPassword || !newStaffFullName) {
      setStaffActionError('Please fill in username, password, and full name.');
      return;
    }

    if (staffAccounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      setStaffActionError(`Username "${cleanUsername}" is already in use. Please choose another.`);
      return;
    }

    const newAcc: StaffAccount = {
      id: `staff-${Date.now()}`,
      username: cleanUsername,
      password: newStaffPassword,
      fullName: newStaffFullName,
      role: newStaffRole,
      email: newStaffEmail,
      phone: newStaffPhone,
      createdAt: new Date().toISOString(),
      isActive: true,
      permissions: newStaffPermissions,
      createdBy: currentUser?.username || 'admin',
    };

    setStaffAccounts((prev) => [...prev, newAcc]);
    setStaffCreateSuccess(true);
    setNewStaffUsername('');
    setNewStaffFullName('');
    setNewStaffPassword('');
    setNewStaffEmail('');
    setNewStaffPhone('');

    setTimeout(() => {
      setStaffCreateSuccess(false);
    }, 3000);
  };

  // Toggle staff active status
  const handleToggleStaffStatus = (id: string) => {
    const target = staffAccounts.find((a) => a.id === id);
    if (target?.username === 'admin') {
      setStaffActionError('The primary super admin account cannot be deactivated.');
      return;
    }
    setStaffAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  // Delete staff account
  const handleDeleteStaff = (id: string) => {
    const target = staffAccounts.find((a) => a.id === id);
    if (target?.username === 'admin') {
      setStaffActionError('The primary super admin account cannot be removed.');
      return;
    }
    if (confirm(`Remove staff account for ${target?.fullName}?`)) {
      setStaffAccounts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  // Handle Load Booking for Rebooking
  const handleLoadBookingForRebook = (booking: BookingRecord) => {
    setSelectedRebookBooking(booking);
    setRebookRefInput(booking.id);
    setRebookRoomId(booking.roomId);
    setRebookCheckIn(booking.checkInDate || new Date().toISOString().split('T')[0]);
    setRebookCheckOut(booking.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setRebookHourlyDate(booking.hourlyDate || new Date().toISOString().split('T')[0]);
    setRebookHourlyTime(booking.hourlyStartTime || '14:00');
    setRebookHourlyHours(booking.hourlyDurationHours || 3);
    setRebookAdults(booking.adultGuests || 2);
    setRebookChildren(booking.childGuests || 0);
    setRebookSuccessMsg('');
    setActiveSubTab('rebook');
  };

  // Search booking ref to rebook
  const handleSearchBookingToRebook = (e: React.FormEvent) => {
    e.preventDefault();
    const query = rebookRefInput.trim().toUpperCase();
    const found = bookings.find((b) => b.id.toUpperCase() === query || b.id.toUpperCase().includes(query));
    if (found) {
      handleLoadBookingForRebook(found);
    } else {
      alert(`No reservation found with reference "${rebookRefInput}". Please verify the booking ID.`);
    }
  };

  // Calculate new rebooking totals
  const rebookingCalculation = useMemo(() => {
    if (!selectedRebookBooking) return null;
    const targetRoom = rooms.find((r) => r.id === rebookRoomId) || rooms[0];

    let newStayTotal = 0;
    let nightsCount = 1;

    if (selectedRebookBooking.stayType === 'nightly') {
      if (rebookCheckIn && rebookCheckOut) {
        const start = new Date(rebookCheckIn).getTime();
        const end = new Date(rebookCheckOut).getTime();
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        nightsCount = diffDays;
        newStayTotal = targetRoom.pricing.nightly * diffDays;
      }
    } else {
      const baseHourRate = rebookHourlyHours === 3 ? (targetRoom.pricing.hourly3hr || 1500) :
        rebookHourlyHours === 6 ? (targetRoom.pricing.hourly6hr || 2500) : (targetRoom.pricing.hourly12hr || 4000);
      newStayTotal = baseHourRate;
    }

    const addonsCost = selectedRebookBooking.addonsTotal || 0;
    const discount = selectedRebookBooking.discountAmount || 0;
    const newGrandTotal = Math.max(0, newStayTotal + addonsCost - discount);
    const amountAlreadyPaid = selectedRebookBooking.amountPaidNow;
    const newRemainingBalance = Math.max(0, newGrandTotal - amountAlreadyPaid);
    const extraCharge = newGrandTotal > selectedRebookBooking.grandTotal ? newGrandTotal - selectedRebookBooking.grandTotal : 0;
    const creditAdjustment = newGrandTotal < selectedRebookBooking.grandTotal ? selectedRebookBooking.grandTotal - newGrandTotal : 0;

    return {
      targetRoom,
      nightsCount,
      newStayTotal,
      addonsCost,
      newGrandTotal,
      amountAlreadyPaid,
      newRemainingBalance,
      extraCharge,
      creditAdjustment,
    };
  }, [selectedRebookBooking, rebookRoomId, rebookCheckIn, rebookCheckOut, rebookHourlyHours, rooms]);

  // Execute Rebooking
  const handleExecuteRebooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRebookBooking || !onRebookBooking || !rebookingCalculation) return;

    const { targetRoom, nightsCount, newGrandTotal, newRemainingBalance, newStayTotal } = rebookingCalculation;

    const updatedFields: Partial<BookingRecord> = {
      roomId: targetRoom.id,
      roomTitle: targetRoom.title,
      checkInDate: selectedRebookBooking.stayType === 'nightly' ? rebookCheckIn : undefined,
      checkOutDate: selectedRebookBooking.stayType === 'nightly' ? rebookCheckOut : undefined,
      numberOfNights: selectedRebookBooking.stayType === 'nightly' ? nightsCount : undefined,
      hourlyDate: selectedRebookBooking.stayType === 'hourly' ? rebookHourlyDate : undefined,
      hourlyStartTime: selectedRebookBooking.stayType === 'hourly' ? rebookHourlyTime : undefined,
      hourlyDurationHours: selectedRebookBooking.stayType === 'hourly' ? rebookHourlyHours : undefined,
      adultGuests: rebookAdults,
      childGuests: rebookChildren,
      baseRatePerUnit: selectedRebookBooking.stayType === 'nightly' ? targetRoom.pricing.nightly : newStayTotal,
      baseStayTotal: newStayTotal,
      grandTotal: newGrandTotal,
      remainingBalance: newRemainingBalance,
      status: selectedRebookBooking.status === 'Cancelled' ? 'Confirmed' : selectedRebookBooking.status,
    };

    const note = `Rebooked by ${currentUser?.fullName || 'Staff'}: ${rebookReason}`;
    onRebookBooking(selectedRebookBooking.id, updatedFields, note);

    setRebookSuccessMsg(`Booking ${selectedRebookBooking.id} successfully updated to ${targetRoom.title}!`);
    setTimeout(() => {
      setSelectedRebookBooking(null);
      setActiveSubTab('bookings');
    }, 1500);
  };

  // Walk-in submit
  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName || !walkinPhone) return;

    const room = rooms.find((r) => r.id === walkinRoomId) || rooms[0];
    const total = room.pricing.nightly * walkinNights;
    const paid = walkinPaymentOption === 'full' ? total : Math.round(total * 0.4);
    const bal = total - paid;

    const walkinBooking: BookingRecord = {
      id: `DV-WALK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      roomId: room.id,
      roomTitle: room.title,
      stayType: 'nightly',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + walkinNights * 86400000).toISOString().split('T')[0],
      numberOfNights: walkinNights,
      adultGuests: 2,
      childGuests: 0,
      addons: [],
      baseRatePerUnit: room.pricing.nightly,
      baseStayTotal: total,
      addonsTotal: 0,
      discountAmount: 0,
      grandTotal: total,
      paymentOption: walkinPaymentOption,
      amountPaidNow: paid,
      remainingBalance: bal,
      paymentMethod: 'front_desk',
      guestName: walkinName,
      guestPhone: walkinPhone,
      status: 'Checked-In',
      staffNotes: `Front Desk Walk-in registered by ${currentUser?.fullName || 'Front Desk'} on-site.`,
    };

    onAddWalkinBooking(walkinBooking);
    setWalkinSuccess(true);
    setWalkinName('');
    setWalkinPhone('');
    setTimeout(() => {
      setWalkinSuccess(false);
      setActiveSubTab('bookings');
    }, 1500);
  };

  // If NOT Logged In: Show Frosted Glass Gate
  if (!isLoggedIn) {
    return (
      <div className="py-12 px-4 flex items-center justify-center">
        <div className="relative max-w-md w-full">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#EAA89B]/25 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#B76E79]/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-[#E6D7C3] shadow-2xl space-y-6 text-[#2C1E15]">
            
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <VillaLogo size={56} variant="rosegold" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#2C1E15]">Front Desk Console</h3>
              <p className="text-xs text-[#8A5A66] max-w-xs mx-auto">
                Authorized staff portal for Diversion Staycation & Events Place operations.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C1E15] uppercase tracking-wider mb-1.5">
                  Staff Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6D7C3] bg-[#FAF4F2] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#B76E79] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E15] uppercase tracking-wider mb-1.5">
                  Password Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6D7C3] bg-[#FAF4F2] text-sm text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#B76E79] transition-all"
                />
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#240F16] via-[#B76E79] to-[#240F16] text-white text-sm font-bold rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-[#FDE3DD]" />
                <span>Unlock Management Desk</span>
              </button>

              <p className="text-center text-[11px] text-[#8A5A66] pt-1">
                Restricted portal. Contact estate management if you need staff credentials.
              </p>
            </form>

          </div>
        </div>
      </div>
    );
  }

  // LOGGED-IN ADMIN DESK VIEW
  return (
    <div className="space-y-8">
      
      {/* Admin Top Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E6D7C3]/70 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <VillaLogo size={42} variant="rosegold" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-[#2C1E15]">Front Desk Management</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-300">
                Live Console
              </span>
            </div>
            <div className="text-xs text-[#8A5A66] flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>Logged in as:</span>
              <strong className="text-[#2C1E15]">{currentUser?.fullName || 'Admin Manager'}</strong>
              <span className="bg-[#FAF4F2] text-[#B76E79] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#E6D7C3]">
                {currentUser?.role || 'Super Admin'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Sub-tab navigation */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F5EBE6] p-1 rounded-2xl border border-[#E6D7C3]/60">
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'bookings' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              Bookings ({bookings.length})
            </button>

            {/* Review Screening Tab */}
            <button
              onClick={() => setActiveSubTab('screening')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'screening' 
                  ? 'bg-amber-800 text-white shadow-sm' 
                  : 'text-[#523A2A] hover:bg-white/60'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Review Screening</span>
              {analytics.pendingSlips > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {analytics.pendingSlips}
                </span>
              )}
            </button>

            {/* Rebook Under Ref Tab */}
            <button
              onClick={() => setActiveSubTab('rebook')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'rebook' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Rebook</span>
            </button>

            {/* Inquiries */}
            <button
              onClick={() => setActiveSubTab('inquiries')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'inquiries' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              Inquiries ({inquiries.length})
            </button>

            {/* Guest Database (Front Desk CRM) */}
            <button
              onClick={() => setActiveSubTab('guests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'guests' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A] hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Guest Database ({guestProfiles.length})</span>
              {guestDatabaseAnalytics.vip > 0 && (
                <span className="bg-amber-500 text-stone-900 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {guestDatabaseAnalytics.vip} VIP
                </span>
              )}
            </button>

            {/* Live Chat (Front Desk ⇄ Guest) */}
            <button
              onClick={() => {
                setActiveSubTab('chat');
                // Reset unread count for current session if viewed
                if (activeChatSession) {
                  const updated = chatSessions.map((s) =>
                    s.id === activeChatSession.id ? { ...s, unreadCountForDesk: 0 } : s
                  );
                  setChatSessions(updated);
                  localStorage.setItem('diversion_vigan_live_chat_sessions', JSON.stringify(updated));
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'chat' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Chat ({chatSessions.length})</span>
              {totalUnreadDeskChats > 0 && (
                <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                  {totalUnreadDeskChats}
                </span>
              )}
            </button>

            {/* Walk-in */}
            <button
              onClick={() => setActiveSubTab('walkin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'walkin' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              + Walk-In
            </button>

            {/* Room Inventory & Customization */}
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'inventory' ? 'bg-[#2C1E15] text-white shadow-sm' : 'text-[#523A2A]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Room Inventory &amp; Custom</span>
            </button>

            {/* Staff Accounts (Restricted Area) */}
            <button
              onClick={() => setActiveSubTab('staff')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'staff' 
                  ? 'bg-[#2C1E15] text-white shadow-sm' 
                  : 'text-[#523A2A] hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Accounts</span>
              {!currentPermissions.canManageStaff && (
                <Lock className="w-2.5 h-2.5 text-amber-700 ml-0.5" />
              )}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer ml-auto lg:ml-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Total Bookings</span>
            <Users className="w-4 h-4 text-[#2C1E15]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1E15]">
            {analytics.totalBookings}
          </div>
          <div className="text-[11px] text-[#786150]">All active & completed records</div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Collected Deposits</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">
            {currentPermissions.canViewFinancials ? (
              `₱${analytics.totalCollected.toLocaleString()}`
            ) : (
              <span className="text-gray-400 font-mono text-xl">•••••• [Restricted]</span>
            )}
          </div>
          <div className="text-[11px] text-[#786150]">Verified downpayments / full pays</div>
        </div>

        {/* Pending Balance to Collect */}
        <div className="bg-white p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Balance Due at Desk</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-900">
            {currentPermissions.canViewFinancials ? (
              `₱${analytics.totalPendingBalance.toLocaleString()}`
            ) : (
              <span className="text-gray-400 font-mono text-xl">•••••• [Restricted]</span>
            )}
          </div>
          <div className="text-[11px] text-[#786150]">Balance payable at check-in</div>
        </div>

        {/* Pending Slips Audit */}
        <button
          onClick={() => setActiveSubTab('screening')}
          className="bg-white hover:bg-amber-50/50 p-5 rounded-3xl border border-[#E6D7C3]/60 shadow-md space-y-2 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#786150] text-xs font-bold uppercase tracking-wider">
            <span>Review Screening</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-700 group-hover:scale-105 transition-transform origin-left">
            {analytics.pendingSlips}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold flex items-center justify-between">
            <span>Click to screen slips</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
          </div>
        </button>

      </div>

      {/* SUB-TAB: ROOM INVENTORY & CUSTOMIZATION */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6D7C3]/60 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F5EBE6] text-[#8B6B10] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-[#E6D7C3]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Inventory &amp; Rates Management</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#2C1E15]">
                Room Inventory &amp; Customization Console
              </h3>
              <p className="text-xs text-[#786150] mt-1">
                Customize room pricing by days, specific calendar dates, cover photos (upload/URL), and custom add-ons by pax and price.
              </p>
            </div>

            {/* Room Selector & Copy Rates Action */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-[#2C1E15] shrink-0">Select Room:</label>
              <select
                value={editingRoomId}
                onChange={(e) => setEditingRoomId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-bold text-[#2C1E15] outline-none focus:ring-2 focus:ring-[#B76E79]"
              >
                {inventoryRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.roomNumber || room.title} ({room.category})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setCopyTargetRoomIds([]);
                  setShowCopyRatesModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                title={`Copy rate breakdown & pricing settings from ${selectedInventoryRoom?.roomNumber || 'this room'} to other rooms`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Rate Setting to Another Room</span>
              </button>
            </div>
          </div>

          {selectedInventoryRoom && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Cover Photo & Basic Rates */}
              <div className="space-y-6">
                
                {/* Room Pictures & Gallery Section */}
                <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#E6D7C3] space-y-4">
                  <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8B6B10]" />
                    <span>Room Pictures &amp; Gallery ({selectedInventoryRoom.images.length})</span>
                  </h4>

                  {/* Thumbnail Gallery Grid with Delete & Set Cover */}
                  <div className="grid grid-cols-3 gap-2">
                    {selectedInventoryRoom.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden bg-stone-200 border border-[#E6D7C3] group">
                        <img src={imgUrl} alt={`Room photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Top Badge */}
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold z-10 ${
                          imgIdx === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs' : 'bg-black/60 text-white'
                        }`}>
                          {imgIdx === 0 ? '★ Cover' : `#${imgIdx + 1}`}
                        </div>

                        {/* Top Right Actions */}
                        <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                          {imgIdx !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedImage = selectedInventoryRoom.images[imgIdx];
                                const otherImages = selectedInventoryRoom.images.filter((_, idx) => idx !== imgIdx);
                                const updatedImages = [selectedImage, ...otherImages];
                                setInventoryRooms((prev) =>
                                  prev.map((r) =>
                                    r.id === selectedInventoryRoom.id ? { ...r, images: updatedImages } : r
                                  )
                                );
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white p-1 rounded-full text-xs shadow cursor-pointer transition-all active:scale-95"
                              title="Set as Cover Photo"
                            >
                              <Star className="w-3 h-3 fill-white text-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedInventoryRoom.images.length <= 1) {
                                alert('Room must have at least one photo.');
                                return;
                              }
                              const updatedImages = selectedInventoryRoom.images.filter((_, idx) => idx !== imgIdx);
                              setInventoryRooms((prev) =>
                                prev.map((r) =>
                                  r.id === selectedInventoryRoom.id ? { ...r, images: updatedImages } : r
                                )
                              );
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-xs shadow cursor-pointer transition-all active:scale-95"
                            title="Delete photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Bottom Hover Overlay Action */}
                        {imgIdx !== 0 && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center z-10">
                            <button
                              type="button"
                              onClick={() => {
                                const selectedImage = selectedInventoryRoom.images[imgIdx];
                                const otherImages = selectedInventoryRoom.images.filter((_, idx) => idx !== imgIdx);
                                const updatedImages = [selectedImage, ...otherImages];
                                setInventoryRooms((prev) =>
                                  prev.map((r) =>
                                    r.id === selectedInventoryRoom.id ? { ...r, images: updatedImages } : r
                                  )
                                );
                              }}
                              className="text-[9px] font-bold text-amber-200 bg-black/80 hover:bg-black px-2 py-0.5 rounded-full border border-amber-400/60 flex items-center gap-1 cursor-pointer transition-all shadow-md"
                            >
                              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                              <span>Set as Cover</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#E6D7C3]/60">
                    {/* Upload Multiple Pictures */}
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                        Upload Multiple Pictures
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          
                          const newBase64Images: string[] = [];
                          let loadedCount = 0;

                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              if (base64) {
                                newBase64Images.push(base64);
                              }
                              loadedCount++;
                              if (loadedCount === files.length) {
                                setInventoryRooms((prev) =>
                                  prev.map((r) =>
                                    r.id === selectedInventoryRoom.id
                                      ? { ...r, images: [...r.images, ...newBase64Images] }
                                      : r
                                  )
                                );
                                alert(`${newBase64Images.length} picture(s) uploaded successfully!`);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="w-full text-xs text-[#786150] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#2C1E15] file:text-white hover:file:bg-[#3D2616] cursor-pointer"
                      />
                    </div>

                    {/* Or URL */}
                    <div>
                      <label className="block text-xs font-bold text-[#2C1E15] mb-1">
                        Or Add Picture by Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          value={coverUrlInput}
                          onChange={(e) => setCoverUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!coverUrlInput.trim()) return;
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id
                                  ? { ...r, images: [...r.images, coverUrlInput.trim()] }
                                  : r
                              )
                            );
                            setCoverUrlInput('');
                            alert('Picture added via URL successfully!');
                          }}
                          className="px-4 py-2 bg-[#2C1E15] hover:bg-[#3D2616] text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Specific Date Rates & Custom Add-ons */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Custom Rate by Special Date / Holiday / Peak Events Console */}
                <div className="bg-[#FAF7F2] p-5 sm:p-6 rounded-3xl border border-[#E6D7C3] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6D7C3]/60 pb-3">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-[#8B6B10]" />
                        <span>Custom Rate by Special Date &amp; Holiday Overrides</span>
                      </h4>
                      <p className="text-[11px] text-[#786150] mt-0.5">
                        Set custom pricing for Holy Week, Viva Vigan Festival, long weekends, Christmas/New Year, and peak holiday dates for {selectedInventoryRoom.title}.
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap self-start">
                      Active Calendar
                    </span>
                  </div>

                  {/* Special Date Presets / Shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#523A2A] uppercase tracking-wider mr-1">
                      Event Presets:
                    </span>
                    {[
                      { label: 'Holy Week', rate: 3500 },
                      { label: 'Viva Vigan Festival', rate: 3200 },
                      { label: 'Christmas / New Year', rate: 4000 },
                      { label: 'Long Weekend Holiday', rate: 2800 },
                      { label: 'Town Fiesta', rate: 3000 },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setNewRateLabel(preset.label);
                          setNewRateAmount(preset.rate.toString());
                        }}
                        className="bg-white hover:bg-amber-50 text-[#523A2A] hover:text-[#2C1E15] border border-[#E6D7C3] hover:border-amber-400 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        {preset.label} (₱{preset.rate.toLocaleString()})
                      </button>
                    ))}
                  </div>

                  {/* Date Input Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-[#E6D7C3]">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-[#2C1E15] mb-1">
                        Target Special Date
                      </label>
                      <input
                        type="date"
                        value={newRateDate}
                        onChange={(e) => setNewRateDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-[#2C1E15] mb-1">
                        Holiday / Event Name (Tag)
                      </label>
                      <input
                        type="text"
                        value={newRateLabel}
                        onChange={(e) => setNewRateLabel(e.target.value)}
                        placeholder="e.g. Holy Week, Viva Vigan"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#2C1E15] mb-1">
                        Custom Rate (₱)
                      </label>
                      <input
                        type="number"
                        value={newRateAmount}
                        onChange={(e) => setNewRateAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newRateDate || !newRateAmount) return;
                          const amount = Number(newRateAmount);
                          setDateRates((prev) => ({
                            ...prev,
                            [selectedInventoryRoom.id]: {
                              ...(prev[selectedInventoryRoom.id] || {}),
                              [newRateDate]: amount,
                            },
                          }));
                          alert(`Special rate override of ₱${amount.toLocaleString()} for ${newRateDate} (${newRateLabel || 'Special Date'}) saved for ${selectedInventoryRoom.roomNumber || selectedInventoryRoom.title}!`);
                        }}
                        className="w-full h-[38px] bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center text-base active:scale-95"
                        title="Add Special Date Rate"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Saved Special Date Rates List */}
                  {dateRates[selectedInventoryRoom.id] && Object.keys(dateRates[selectedInventoryRoom.id]).length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#2C1E15] px-1">
                        <span>Configured Special Dates ({Object.keys(dateRates[selectedInventoryRoom.id]).length}):</span>
                        <span className="text-[10px] text-[#786150]">Overrides take priority during booking calculation</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {Object.entries(dateRates[selectedInventoryRoom.id]).map(([dt, rt]) => (
                          <div
                            key={dt}
                            className="p-3 bg-white rounded-2xl border border-[#E6D7C3] flex items-center justify-between gap-2 shadow-2xs hover:border-amber-400 transition-all"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-mono text-xs font-bold text-[#2C1E15]">{dt}</span>
                              <span className="text-[10px] text-[#8B6B10] font-semibold truncate">
                                Special Calendar Override
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <strong className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                ₱{Number(rt).toLocaleString()}
                              </strong>
                              <button
                                type="button"
                                onClick={() => {
                                  setDateRates((prev) => {
                                    const copy = { ...prev };
                                    if (copy[selectedInventoryRoom.id]) {
                                      delete copy[selectedInventoryRoom.id][dt];
                                    }
                                    return copy;
                                  });
                                }}
                                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                                title="Remove special date rate"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-500 italic bg-white p-3.5 rounded-2xl border border-[#E6D7C3] text-center">
                      No special date rate overrides configured yet for this room. Add dates above to override regular rates during peak events.
                    </div>
                  )}
                </div>

                {/* Editable Room Rate by Days, Breakdown of Pax & Hourly Stay */}
                <div className="bg-[#FAF7F2] p-5 sm:p-6 rounded-3xl border border-[#E6D7C3] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6D7C3]/60 pb-3">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-700" />
                        <span>Editable Room Rate by Days &amp; Pax Breakdown</span>
                      </h4>
                      <p className="text-[11px] text-[#786150] mt-0.5">
                        {selectedInventoryRoom.id === 'private-villa-pool' || (selectedInventoryRoom.roomNumber || selectedInventoryRoom.title).toLowerCase().includes('private villa')
                          ? 'Monday to Friday (Mon–Fri) ₱8,000 / night & Saturday to Sunday (Sat–Sun) ₱10,000 / night for Private Villa.'
                          : 'Configure pricing breakdown by days of the week (Mon–Thu vs Fri–Sun), hourly rates, and pax tiers.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setCopyTargetRoomIds([]);
                          setShowCopyRatesModal(true);
                        }}
                        className="flex items-center gap-1 bg-[#2C1E15] hover:bg-[#3D2616] text-amber-200 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all shadow-2xs active:scale-95"
                        title={`Copy rate breakdown & pricing settings from ${selectedInventoryRoom.roomNumber || selectedInventoryRoom.title} to another room`}
                      >
                        <Copy className="w-3 h-3 text-amber-300" />
                        <span>Copy Rate Setting to Another Room</span>
                      </button>
                      <span className="bg-amber-100/80 text-[#8B6B10] border border-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {selectedInventoryRoom.roomNumber || selectedInventoryRoom.title}
                      </span>
                    </div>
                  </div>

                  {/* 2. Breakdown of Pax (Pax Rate Matrix & Capacity) */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E6D7C3]/80">
                    <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-2">
                      <div>
                        <span className="text-xs font-bold text-[#2C1E15] uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#B8860B]" />
                          <span>Pax Rate Breakdown Matrix</span>
                        </span>
                        <p className="text-[10px] text-[#786150]">
                          Specific pricing tiers based on guest count and day of stay.
                        </p>
                      </div>
                    </div>

                    {/* Capacity & Extra Pax Fees */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E6D7C3]/60">
                      <div>
                        <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">Min Guests</label>
                        <input
                          type="number"
                          value={selectedInventoryRoom.capacity.minGuests}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id
                                  ? { ...r, capacity: { ...r.capacity, minGuests: val } }
                                  : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">Max Guests</label>
                        <input
                          type="number"
                          value={selectedInventoryRoom.capacity.maxGuests}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id
                                  ? { ...r, capacity: { ...r.capacity, maxGuests: val } }
                                  : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">
                          {selectedInventoryRoom.id === 'private-villa-pool' || (selectedInventoryRoom.roomNumber || selectedInventoryRoom.title).toLowerCase().includes('private villa')
                            ? 'Extra Adult (₱500)'
                            : 'Extra Pax Fee (₱)'}
                        </label>
                        <input
                          type="number"
                          value={selectedInventoryRoom.extraPaxFee !== undefined ? selectedInventoryRoom.extraPaxFee : (selectedInventoryRoom.id === 'private-villa-pool' ? 500 : 300)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id
                                  ? { ...r, extraPaxFee: val }
                                  : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] bg-white text-xs font-bold text-amber-900 outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">
                          {selectedInventoryRoom.id === 'private-villa-pool' || (selectedInventoryRoom.roomNumber || selectedInventoryRoom.title).toLowerCase().includes('private villa')
                            ? 'Extra Child (₱400/₱500)'
                            : 'Extra Bed Fee (₱)'}
                        </label>
                        <input
                          type="number"
                          value={selectedInventoryRoom.extraPadFee !== undefined ? selectedInventoryRoom.extraPadFee : 400}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setInventoryRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedInventoryRoom.id
                                  ? { ...r, extraPadFee: val }
                                  : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] bg-white text-xs font-bold text-amber-900 outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Pax Tiers Table */}
                    {(() => {
                      const isVilla = selectedInventoryRoom.id === 'private-villa-pool' || (selectedInventoryRoom.roomNumber || selectedInventoryRoom.title).toLowerCase().includes('private villa');
                      const weekdayHeader = isVilla ? 'Mon–Fri (₱)' : 'Rate (Thursday to Sunday) (₱)';
                      const weekendHeader = isVilla ? 'Sat–Sun (₱)' : 'Rate (Friday to Sunday) (₱)';

                      const recomputeRateDisplay = (tiers: PaxRateTier[]) => {
                        if (!tiers || tiers.length === 0) return {};
                        const wDayMin = Math.min(...tiers.map((t) => t.weekdayRate));
                        const wDayMax = Math.max(...tiers.map((t) => t.weekdayRate));
                        const wEndMin = Math.min(...tiers.map((t) => t.weekendRate));
                        const wEndMax = Math.max(...tiers.map((t) => t.weekendRate));
                        return {
                          weekdayRateDisplay: wDayMin === wDayMax ? `₱${wDayMin.toLocaleString()}` : `₱${wDayMin.toLocaleString()} – ₱${wDayMax.toLocaleString()}`,
                          weekendRateDisplay: wEndMin === wEndMax ? `₱${wEndMin.toLocaleString()}` : `₱${wEndMin.toLocaleString()} – ₱${wEndMax.toLocaleString()}`,
                        };
                      };

                      return (
                        <div className="space-y-2">
                          <div className="overflow-x-auto rounded-xl border border-[#E6D7C3]">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-[#FAF7F2] text-[#2C1E15] font-bold border-b border-[#E6D7C3]">
                                <tr>
                                  <th className="py-2 px-3">Pax Tier</th>
                                  <th className="py-2 px-3">Guests</th>
                                  <th className="py-2 px-3">{weekdayHeader}</th>
                                  <th className="py-2 px-3">{weekendHeader}</th>
                                  <th className="py-2 px-2 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E6D7C3]/50 bg-white">
                                {(selectedInventoryRoom.paxRates && selectedInventoryRoom.paxRates.length > 0
                                  ? selectedInventoryRoom.paxRates
                                  : [
                                      { paxLabel: `1-${selectedInventoryRoom.capacity.minGuests} pax`, pax: selectedInventoryRoom.capacity.minGuests, weekdayRate: selectedInventoryRoom.pricing.nightly, weekendRate: selectedInventoryRoom.pricing.nightly + 200 }
                                    ]
                                ).map((tier, tierIdx) => (
                                  <tr key={tierIdx} className="hover:bg-amber-50/40 transition-colors">
                                    <td className="py-1.5 px-3">
                                      <input
                                        type="text"
                                        value={tier.paxLabel}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setInventoryRooms((prev) =>
                                            prev.map((r) => {
                                              if (r.id !== selectedInventoryRoom.id) return r;
                                              const currentTiers = [...(r.paxRates || [])];
                                              if (currentTiers[tierIdx]) {
                                                currentTiers[tierIdx] = { ...currentTiers[tierIdx], paxLabel: val };
                                              }
                                              const rateDisplays = recomputeRateDisplay(currentTiers);
                                              return { ...r, paxRates: currentTiers, ...rateDisplays };
                                            })
                                          );
                                        }}
                                        className="w-24 px-2 py-1 rounded border border-[#E6D7C3] text-xs font-medium outline-none"
                                      />
                                    </td>
                                    <td className="py-1.5 px-3">
                                      <input
                                        type="number"
                                        value={tier.pax}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setInventoryRooms((prev) =>
                                            prev.map((r) => {
                                              if (r.id !== selectedInventoryRoom.id) return r;
                                              const currentTiers = [...(r.paxRates || [])];
                                              if (currentTiers[tierIdx]) {
                                                currentTiers[tierIdx] = { ...currentTiers[tierIdx], pax: val };
                                              }
                                              const rateDisplays = recomputeRateDisplay(currentTiers);
                                              return { ...r, paxRates: currentTiers, ...rateDisplays };
                                            })
                                          );
                                        }}
                                        className="w-14 px-2 py-1 rounded border border-[#E6D7C3] text-xs font-bold text-center outline-none"
                                      />
                                    </td>
                                    <td className="py-1.5 px-3">
                                      <input
                                        type="number"
                                        value={tier.weekdayRate}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setInventoryRooms((prev) =>
                                            prev.map((r) => {
                                              if (r.id !== selectedInventoryRoom.id) return r;
                                              const currentTiers = [...(r.paxRates || [])];
                                              if (currentTiers[tierIdx]) {
                                                currentTiers[tierIdx] = { ...currentTiers[tierIdx], weekdayRate: val };
                                              }
                                              const rateDisplays = recomputeRateDisplay(currentTiers);
                                              return { ...r, paxRates: currentTiers, ...rateDisplays };
                                            })
                                          );
                                        }}
                                        className="w-20 px-2 py-1 rounded border border-[#E6D7C3] text-xs font-bold text-emerald-800 outline-none"
                                      />
                                    </td>
                                    <td className="py-1.5 px-3">
                                      <input
                                        type="number"
                                        value={tier.weekendRate}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setInventoryRooms((prev) =>
                                            prev.map((r) => {
                                              if (r.id !== selectedInventoryRoom.id) return r;
                                              const currentTiers = [...(r.paxRates || [])];
                                              if (currentTiers[tierIdx]) {
                                                currentTiers[tierIdx] = { ...currentTiers[tierIdx], weekendRate: val };
                                              }
                                              const rateDisplays = recomputeRateDisplay(currentTiers);
                                              return { ...r, paxRates: currentTiers, ...rateDisplays };
                                            })
                                          );
                                        }}
                                        className="w-20 px-2 py-1 rounded border border-[#E6D7C3] text-xs font-bold text-amber-900 outline-none"
                                      />
                                    </td>
                                    <td className="py-1.5 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInventoryRooms((prev) =>
                                            prev.map((r) => {
                                              if (r.id !== selectedInventoryRoom.id) return r;
                                              const currentTiers = (r.paxRates || []).filter((_, i) => i !== tierIdx);
                                              const rateDisplays = recomputeRateDisplay(currentTiers);
                                              return { ...r, paxRates: currentTiers, ...rateDisplays };
                                            })
                                          );
                                        }}
                                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        title="Delete this pax tier"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Add New Pax Tier Form */}
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="e.g. 1-10 pax"
                              value={newPaxLabel}
                              onChange={(e) => setNewPaxLabel(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] text-xs w-24 outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Max Pax"
                              value={newPaxCount}
                              onChange={(e) => setNewPaxCount(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] text-xs w-16 outline-none"
                            />
                            <input
                              type="number"
                              placeholder={isVilla ? "Mon–Fri (₱)" : "Mon–Thu (₱)"}
                              value={newPaxWeekdayRate}
                              onChange={(e) => setNewPaxWeekdayRate(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] text-xs w-24 outline-none"
                            />
                            <input
                              type="number"
                              placeholder={isVilla ? "Sat–Sun (₱)" : "Fri–Sun (₱)"}
                              value={newPaxWeekendRate}
                              onChange={(e) => setNewPaxWeekendRate(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E6D7C3] text-xs w-24 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newPaxLabel.trim()) return;
                                const newTier: PaxRateTier = {
                                  paxLabel: newPaxLabel.trim(),
                                  pax: Number(newPaxCount) || 10,
                                  weekdayRate: Number(newPaxWeekdayRate) || (isVilla ? 8000 : 1000),
                                  weekendRate: Number(newPaxWeekendRate) || (isVilla ? 10000 : 1200),
                                };
                                setInventoryRooms((prev) =>
                                  prev.map((r) => {
                                    if (r.id !== selectedInventoryRoom.id) return r;
                                    const currentTiers = [...(r.paxRates || []), newTier];
                                    const rateDisplays = recomputeRateDisplay(currentTiers);
                                    return { ...r, paxRates: currentTiers, ...rateDisplays };
                                  })
                                );
                                setNewPaxLabel('');
                              }}
                              className="w-full h-[32px] bg-[#2C1E15] hover:bg-[#1A1009] text-white rounded-lg font-black transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
                              title="Add Pax Tier"
                            >
                              <Plus className="w-4 h-4 text-[#E5C158] stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Additional Pax Policy Status */}
                          <div className="mt-3 p-3 bg-white/90 rounded-xl border border-[#E6D7C3] flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              {isVilla ? (
                                <>
                                  <span className="font-bold text-[#2C1E15] flex items-center gap-1.5">
                                    <span>🏡 Private Villa Pax Policy (Good for 10 Pax):</span>
                                  </span>
                                  <span className="text-[11px] text-[#786150] block">
                                    • <strong className="text-emerald-700">Mon–Fri:</strong> 1–10 Pax Base ₱8,000 | Extra Adult ₱500 | Extra Child ₱400<br />
                                    • <strong className="text-amber-900">Sat–Sun:</strong> 1–10 Pax Base ₱10,000 | Extra Adult ₱500 | Extra Child ₱500<br />
                                    • <strong className="text-emerald-700">3 yrs &amp; below:</strong> Free of charge (sneak-in)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-[#2C1E15] flex items-center gap-1.5">
                                    <span>👶 Additional Pax Policy (Room 0 to 13 &amp; 14 to 16):</span>
                                  </span>
                                  <span className="text-[11px] text-[#786150] block">
                                    • <strong className="text-emerald-700">1–5 yrs:</strong> Free (₱0) &nbsp;|&nbsp; • <strong className="text-amber-900">6–10 yrs:</strong> ₱200/pax (Mon–Thu) &amp; ₱250/pax (Fri–Sun)
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              Active Policy
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Custom Add-ons by Pax and Price */}
                <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E6D7C3] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/60 pb-3">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#8B6B10]" />
                        <span>Custom Add-ons by Pax and Price</span>
                      </h4>
                      <p className="text-xs text-[#786150]">
                        Configure guest add-ons, breakfast packages, extra beds/pads, and amenities with pax-based or unit pricing.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2C1E15] bg-white px-2.5 py-1 rounded-full border border-[#E6D7C3]">
                        {customAddons.filter((a) => a.isActive !== false).length} Active Catalogue Items
                      </span>
                    </div>
                  </div>

                  {/* Notification Feedback Toast Banner */}
                  {addonActionFeedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{addonActionFeedback}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddonActionFeedback(null)}
                        className="text-emerald-700 hover:text-emerald-950 font-bold text-sm ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Quick 1-Click Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#786150] uppercase tracking-wider block">
                      Quick 1-Click Add-on Presets:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddonName('Breakfast');
                          setNewAddonPrice('120');
                          setNewAddonPaxBasis('per_pax');
                          setNewAddonPaxCount(1);
                          setNewAddonCategory('breakfast');
                          setNewAddonIsPerNight(true);
                          setNewAddonUnitLabel('₱120 per head');
                          setNewAddonDesc('Fresh hot breakfast set (garlic longganisa, fried egg, sinangag rice & native coffee)');
                          setEditingAddonId(null);
                        }}
                        className="text-[11px] font-bold text-[#2C1E15] bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#8B6B10]" />
                        <span>Breakfast (₱120/pax)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddonName('Extra Mattress / Bed');
                          setNewAddonPrice('400');
                          setNewAddonPaxBasis('fixed_unit');
                          setNewAddonPaxCount(1);
                          setNewAddonCategory('extra_bed');
                          setNewAddonIsPerNight(true);
                          setNewAddonUnitLabel('₱400 / extra bed / night');
                          setNewAddonDesc('Thick comfortable mattress with complete fresh linens and pillow');
                          setEditingAddonId(null);
                        }}
                        className="text-[11px] font-bold text-[#2C1E15] bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#8B6B10]" />
                        <span>Extra Bed / Pad (₱400/night)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddonName('Swimming Pool Day Pass');
                          setNewAddonPrice('150');
                          setNewAddonPaxBasis('per_pax');
                          setNewAddonPaxCount(1);
                          setNewAddonCategory('pool');
                          setNewAddonIsPerNight(false);
                          setNewAddonUnitLabel('₱150 per pax');
                          setNewAddonDesc('Day swimming pool access with clean poolside lounge and shower pass');
                          setEditingAddonId(null);
                        }}
                        className="text-[11px] font-bold text-[#2C1E15] bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#8B6B10]" />
                        <span>Pool Pass (₱150/pax)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddonName('Extra Pax Adult (Private Villa)');
                          setNewAddonPrice('500');
                          setNewAddonPaxBasis('per_pax');
                          setNewAddonPaxCount(1);
                          setNewAddonCategory('custom');
                          setNewAddonIsPerNight(true);
                          setNewAddonUnitLabel('₱500 / adult / night');
                          setNewAddonDesc('Private Villa Extra Pax (Adult): Monday to Friday ₱500 / night, Saturday to Sunday ₱500 / night');
                          setEditingAddonId(null);
                        }}
                        className="text-[11px] font-bold text-[#2C1E15] bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#8B6B10]" />
                        <span>Villa Extra Adult (₱500)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddonName('Extra Pax Child (Private Villa)');
                          setNewAddonPrice('400');
                          setNewAddonPaxBasis('per_pax');
                          setNewAddonPaxCount(1);
                          setNewAddonCategory('custom');
                          setNewAddonIsPerNight(true);
                          setNewAddonUnitLabel('Mon–Fri ₱400 • Sat–Sun ₱500');
                          setNewAddonDesc('Private Villa Extra Pax (Child): Monday to Friday ₱400 / night, Saturday to Sunday ₱500 / night');
                          setEditingAddonId(null);
                        }}
                        className="text-[11px] font-bold text-[#2C1E15] bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#8B6B10]" />
                        <span>Villa Extra Child (₱400/₱500)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAddonName('Extra Pax 3 yrs & below (Private Villa)');
                          setNewAddonPrice('0');
                          setNewAddonPaxBasis('per_pax');
                          setNewAddonPaxCount(1);
                          setNewAddonCategory('custom');
                          setNewAddonIsPerNight(false);
                          setNewAddonUnitLabel('FREE (sneak-in)');
                          setNewAddonDesc('Private Villa Extra Pax (3 years old & below): Free of charge (sneak-in)');
                          setEditingAddonId(null);
                        }}
                        className="text-[11px] font-bold text-[#2C1E15] bg-white hover:bg-amber-50 px-2.5 py-1.5 rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-[#8B6B10]" />
                        <span>Villa Extra 3 yrs & below (Free)</span>
                      </button>
                    </div>
                  </div>

                  {/* Add / Edit Add-on Form */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E6D7C3] shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#8B6B10]" />
                        <span className="font-bold text-xs text-[#2C1E15] uppercase tracking-wider">
                          {editingAddonId ? 'Edit Configured Add-On' : 'Create Custom Add-on by Pax & Price'}
                        </span>
                      </div>
                      {editingAddonId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddonId(null);
                            setNewAddonName('');
                            setNewAddonPrice('150');
                            setNewAddonUnitLabel('₱150 per pax');
                            setNewAddonDesc('');
                          }}
                          className="text-xs text-[#786150] hover:text-[#2C1E15] font-bold underline cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-[#2C1E15] mb-1">Add-on Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Breakfast Set"
                          value={newAddonName}
                          onChange={(e) => setNewAddonName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs font-semibold text-[#2C1E15] outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-xs font-bold text-[#2C1E15] mb-1">Price (₱)</label>
                        <input
                          type="number"
                          placeholder="150"
                          value={newAddonPrice}
                          onChange={(e) => {
                            const p = e.target.value;
                            setNewAddonPrice(p);
                            if (newAddonPaxBasis === 'per_pax') {
                              setNewAddonUnitLabel(`₱${p} per head`);
                            } else if (newAddonPaxBasis === 'fixed_unit') {
                              setNewAddonUnitLabel(`₱${p} per item${newAddonIsPerNight ? ' / night' : ''}`);
                            } else {
                              setNewAddonUnitLabel(`₱${p} flat rate`);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs font-bold text-[#2C1E15] outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Pricing Basis by Pax */}
                      <div>
                        <label className="block text-xs font-bold text-[#2C1E15] mb-1">Pricing Basis</label>
                        <select
                          value={newAddonPaxBasis}
                          onChange={(e) => {
                            const basis = e.target.value as 'per_pax' | 'fixed_unit' | 'per_night';
                            setNewAddonPaxBasis(basis);
                            if (basis === 'per_pax') {
                              setNewAddonUnitLabel(`₱${newAddonPrice || 120} per head`);
                            } else if (basis === 'fixed_unit') {
                              setNewAddonUnitLabel(`₱${newAddonPrice || 400} per item${newAddonIsPerNight ? ' / night' : ''}`);
                            } else {
                              setNewAddonUnitLabel(`₱${newAddonPrice || 500} flat rate`);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs font-semibold text-[#2C1E15] bg-[#FDFBF7] outline-none cursor-pointer"
                        >
                          <option value="per_pax">Per Pax / Head (Guest Count)</option>
                          <option value="fixed_unit">Per Bed / Unit / Item</option>
                          <option value="per_night">Per Night / Stay Flat</option>
                        </select>
                      </div>

                      {/* Category Tag */}
                      <div>
                        <label className="block text-xs font-bold text-[#2C1E15] mb-1">Category</label>
                        <select
                          value={newAddonCategory}
                          onChange={(e) => setNewAddonCategory(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs font-semibold text-[#2C1E15] bg-[#FDFBF7] outline-none cursor-pointer"
                        >
                          <option value="breakfast">Breakfast & Meals</option>
                          <option value="extra_bed">Extra Bed & Mattress</option>
                          <option value="pool">Pool & Resort Access</option>
                          <option value="tour">Tours & Shuttle</option>
                          <option value="amenity">Games & Amenities</option>
                          <option value="custom">Other Custom Add-on</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
                      {/* Unit / Pax Display Label */}
                      <div>
                        <label className="block text-xs font-bold text-[#2C1E15] mb-1">Unit Display Label</label>
                        <input
                          type="text"
                          placeholder="e.g. ₱120 per head"
                          value={newAddonUnitLabel}
                          onChange={(e) => setNewAddonUnitLabel(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-[#2C1E15] mb-1">Description / Inclusions</label>
                        <input
                          type="text"
                          placeholder="e.g. Fresh longganisa breakfast with coffee"
                          value={newAddonDesc}
                          onChange={(e) => setNewAddonDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Actions and Per-Night Switch */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E6D7C3]/40">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newAddonIsPerNight}
                          onChange={(e) => setNewAddonIsPerNight(e.target.checked)}
                          className="rounded text-amber-700 w-4 h-4 cursor-pointer"
                        />
                        <span>Charge per night of stay (multiplied by stay duration)</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAddonName.trim() || !newAddonPrice) {
                              setAddonActionFeedback('Please enter an add-on name and price.');
                              setTimeout(() => setAddonActionFeedback(null), 3500);
                              return;
                            }
                            const priceVal = Math.max(0, Number(newAddonPrice) || 0);

                            if (editingAddonId) {
                              const updated = customAddons.map((a) =>
                                a.id === editingAddonId
                                  ? {
                                      ...a,
                                      name: newAddonName.trim(),
                                      price: priceVal,
                                      unitLabel: newAddonUnitLabel.trim() || `₱${priceVal} per pax`,
                                      isPerNight: newAddonIsPerNight,
                                      description: newAddonDesc.trim() || newAddonName.trim(),
                                      pricingType: newAddonPaxBasis,
                                      paxCount: newAddonPaxCount,
                                      category: newAddonCategory,
                                      isActive: true,
                                    }
                                  : a
                              );
                              setCustomAddons(updated);
                              if (onCustomAddonsUpdateRef.current) {
                                onCustomAddonsUpdateRef.current(updated);
                              }
                              setAddonActionFeedback(`Updated "${newAddonName.trim()}" in active add-ons catalogue!`);
                              setEditingAddonId(null);
                            } else {
                              const newAddon: BookingAddonItem = {
                                id: `addon_${Date.now()}`,
                                name: newAddonName.trim(),
                                price: priceVal,
                                unitLabel: newAddonUnitLabel.trim() || (newAddonPaxBasis === 'per_pax' ? `₱${priceVal} per head` : `₱${priceVal} per unit`),
                                isPerNight: newAddonIsPerNight,
                                quantity: 0,
                                description: newAddonDesc.trim() || newAddonName.trim(),
                                pricingType: newAddonPaxBasis,
                                paxCount: newAddonPaxCount,
                                category: newAddonCategory,
                                isActive: true,
                              };
                              const updated = [...customAddons, newAddon];
                              setCustomAddons(updated);
                              if (onCustomAddonsUpdateRef.current) {
                                onCustomAddonsUpdateRef.current(updated);
                              }
                              setAddonActionFeedback(`Successfully added "${newAddonName.trim()}" (₱${priceVal.toLocaleString()}) to active add-ons catalogue!`);
                            }

                            setNewAddonName('');
                            setNewAddonPrice('150');
                            setNewAddonUnitLabel('₱150 per pax');
                            setNewAddonDesc('');
                            setTimeout(() => setAddonActionFeedback(null), 4000);
                          }}
                          className="px-5 py-2.5 bg-[#2C1E15] hover:bg-[#3D2616] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4 text-[#E5C158]" />
                          <span>{editingAddonId ? 'Save to Active Catalogue' : 'Add to Active Add-ons Catalogue'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Configured Add-ons Catalogue Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2C1E15] uppercase tracking-wider">
                        Active Add-Ons Catalogue ({customAddons.length} Configured)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {customAddons.map((addon) => {
                        const isCurrentEditing = editingAddonId === addon.id;
                        const isAddonActive = addon.isActive !== false;

                        return (
                          <div
                            key={addon.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              isCurrentEditing
                                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/40'
                                : isAddonActive
                                ? 'bg-white border-[#E6D7C3]'
                                : 'bg-stone-50 border-stone-200 opacity-60'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-xs text-[#2C1E15] flex items-center gap-1.5">
                                    <span>{addon.name}</span>
                                    {addon.category && (
                                      <span className="text-[9px] font-bold text-amber-900 bg-amber-100/60 px-1.5 py-0.5 rounded uppercase">
                                        {addon.category.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#786150] font-medium mt-0.5">
                                    {addon.unitLabel}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = customAddons.map((a) =>
                                      a.id === addon.id ? { ...a, isActive: !isAddonActive } : a
                                    );
                                    setCustomAddons(updated);
                                    if (onCustomAddonsUpdateRef.current) {
                                      onCustomAddonsUpdateRef.current(updated);
                                    }
                                    setAddonActionFeedback(
                                      isAddonActive
                                        ? `Deactivated "${addon.name}" from public engine.`
                                        : `Activated "${addon.name}" in public engine!`
                                    );
                                    setTimeout(() => setAddonActionFeedback(null), 3500);
                                  }}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                                    isAddonActive
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-stone-100 text-stone-500 border-stone-300'
                                  }`}
                                  title="Click to toggle active status"
                                >
                                  {isAddonActive ? '● Active' : '○ Inactive'}
                                </button>
                              </div>

                              <p className="text-[11px] text-[#786150] line-clamp-2">
                                {addon.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#E6D7C3]/50">
                              <div className="flex items-center gap-1.5">
                                <strong className="text-emerald-700 text-sm font-mono font-bold">
                                  ₱{addon.price.toLocaleString()}
                                </strong>
                                <span className="text-[10px] text-[#786150]">
                                  {addon.isPerNight ? '/ night' : '/ stay'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAddonId(addon.id);
                                    setNewAddonName(addon.name);
                                    setNewAddonPrice(addon.price.toString());
                                    setNewAddonUnitLabel(addon.unitLabel);
                                    setNewAddonDesc(addon.description);
                                    setNewAddonPaxBasis(addon.pricingType || (addon.unitLabel.includes('pax') ? 'per_pax' : 'fixed_unit'));
                                    setNewAddonIsPerNight(addon.isPerNight !== false);
                                    setNewAddonCategory(addon.category || 'custom');
                                    window.scrollTo({ top: 1200, behavior: 'smooth' });
                                  }}
                                  className="text-[#2C1E15] hover:text-amber-800 bg-[#FAF7F2] hover:bg-amber-100 p-1.5 rounded-lg border border-[#E6D7C3] transition-colors cursor-pointer"
                                  title="Edit pricing and pax"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = customAddons.filter((a) => a.id !== addon.id);
                                    setCustomAddons(updated);
                                    if (onCustomAddonsUpdateRef.current) {
                                      onCustomAddonsUpdateRef.current(updated);
                                    }
                                    setAddonActionFeedback(`Removed add-on "${addon.name}".`);
                                    setTimeout(() => setAddonActionFeedback(null), 3500);
                                  }}
                                  className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                  title="Remove add-on"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
          {/* Copy Rate Settings Modal */}
          {showCopyRatesModal && selectedInventoryRoom && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-[#E6D7C3] shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-auto">
                
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-[#E6D7C3]/60 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-amber-100/80 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5">
                      <Copy className="w-3 h-3 text-[#B8860B]" />
                      <span>Copy Rate Settings</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#2C1E15]">
                      Copy Rates from {selectedInventoryRoom.roomNumber || selectedInventoryRoom.title}
                    </h3>
                    <p className="text-xs text-[#786150] mt-0.5">
                      Select target rooms below to duplicate the exact pax rate breakdown matrix, capacity, and pricing parameters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCopyRatesModal(false)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Source Room Configuration Summary */}
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E6D7C3] space-y-2">
                  <span className="text-[11px] font-bold text-[#2C1E15] uppercase tracking-wider block">
                    Source Room Configuration Summary:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-[#E6D7C3]/70">
                      <span className="text-[10px] text-[#786150] block">Weekday Rate</span>
                      <strong className="text-[#2C1E15] font-bold">{selectedInventoryRoom.weekdayRateDisplay || `₱${selectedInventoryRoom.pricing.nightly}`}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#E6D7C3]/70">
                      <span className="text-[10px] text-[#786150] block">Weekend Rate</span>
                      <strong className="text-amber-800 font-bold">{selectedInventoryRoom.weekendRateDisplay || `₱${selectedInventoryRoom.pricing.nightly + 200}`}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#E6D7C3]/70">
                      <span className="text-[10px] text-[#786150] block">Capacity</span>
                      <strong className="text-[#2C1E15] font-bold">{selectedInventoryRoom.capacity.recommended} ({selectedInventoryRoom.capacity.minGuests}–{selectedInventoryRoom.capacity.maxGuests} Pax)</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#E6D7C3]/70">
                      <span className="text-[10px] text-[#786150] block">Pax Tiers</span>
                      <strong className="text-emerald-800 font-bold">{selectedInventoryRoom.paxRates?.length || 0} Tier(s)</strong>
                    </div>
                  </div>
                </div>

                {/* Target Room Selection Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-[#2C1E15]">
                      Select Target Rooms ({copyTargetRoomIds.length} Selected):
                    </label>
                    {/* Quick Selection Shortcuts */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allOthers = inventoryRooms
                            .filter((r) => r.id !== selectedInventoryRoom.id)
                            .map((r) => r.id);
                          setCopyTargetRoomIds(allOthers);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100/70 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const standards = inventoryRooms
                            .filter((r) => r.id !== selectedInventoryRoom.id && (r.category === 'Standard Rooms' || ['room-8','room-9','room-10','room-11'].includes(r.id)))
                            .map((r) => r.id);
                          setCopyTargetRoomIds(standards);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#523A2A] border border-[#E6D7C3] transition-colors cursor-pointer"
                      >
                        Standard Rooms (8-11)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const families = inventoryRooms
                            .filter((r) => r.id !== selectedInventoryRoom.id && (r.category === 'Family Rooms' || ['room-14','room-15','room-16'].includes(r.id)))
                            .map((r) => r.id);
                          setCopyTargetRoomIds(families);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#523A2A] border border-[#E6D7C3] transition-colors cursor-pointer"
                      >
                        Family Rooms (14-16)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCopyTargetRoomIds([])}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Checkboxes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6D7C3]">
                    {inventoryRooms
                      .filter((r) => r.id !== selectedInventoryRoom.id)
                      .map((room) => {
                        const isChecked = copyTargetRoomIds.includes(room.id);
                        return (
                          <label
                            key={room.id}
                            onClick={() => {
                              if (isChecked) {
                                setCopyTargetRoomIds((prev) => prev.filter((id) => id !== room.id));
                              } else {
                                setCopyTargetRoomIds((prev) => [...prev, room.id]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all select-none ${
                              isChecked
                                ? 'bg-[#2C1E15] text-white border-[#2C1E15] shadow-2xs'
                                : 'bg-white text-[#2C1E15] border-[#E6D7C3] hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isChecked ? 'bg-amber-400 text-[#2C1E15]' : 'border border-[#C8B29E] bg-[#FDFBF7]'
                              }`}>
                                {isChecked ? '✓' : ''}
                              </span>
                              <span className="text-xs font-bold truncate">
                                {room.roomNumber || room.title}
                              </span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                              isChecked ? 'bg-amber-900/80 text-amber-200' : 'bg-stone-100 text-[#786150]'
                            }`}>
                              {room.category}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Include Special Date Rates Toggle */}
                <div className="pt-2 border-t border-[#E6D7C3]/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#2C1E15] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyIncludeSpecialDates}
                      onChange={(e) => setCopyIncludeSpecialDates(e.target.checked)}
                      className="w-4 h-4 rounded border-[#C8B29E] text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Include Special Date &amp; Holiday Rate Overrides</span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6D7C3]/60">
                  <button
                    type="button"
                    onClick={() => setShowCopyRatesModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyRatesToRooms}
                    disabled={copyTargetRoomIds.length === 0}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      copyTargetRoomIds.length > 0
                        ? 'bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white shadow-md active:scale-95'
                        : 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy &amp; Apply Rates ({copyTargetRoomIds.length} Room{copyTargetRoomIds.length === 1 ? '' : 's'})</span>
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 1: RESERVATIONS TABLE */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl overflow-hidden space-y-4">
          
          {/* Table / Grid Header Filter Toolbar */}
          <div className="p-5 border-b border-[#E6D7C3]/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F5EBE6] p-1.5 rounded-2xl border border-[#E6D7C3]/60">
              {(['All', 'Pending Slip Review', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-[#786150] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest, phone, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs text-[#2C1E15] font-medium outline-none focus:ring-2 focus:ring-[#2C1E15]"
                />
              </div>

              {/* View Mode Toggle: Table vs Grid */}
              <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setBookingsViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bookingsViewMode === 'table'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingsViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    bookingsViewMode === 'grid'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>

          </div>

          {/* Table / Grid Content */}
          {bookingsViewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[11px]">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Guest Info</th>
                  <th className="py-3 px-4">Room / Unit</th>
                  <th className="py-3 px-4">Stay Schedule</th>
                  <th className="py-3 px-4">Financials (Paid / Bal)</th>
                  <th className="py-3 px-4">Deposit Slip</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D7C3]/40">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                    
                    {/* Booking ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2C1E15]">
                      {b.id}
                      <span className="block text-[10px] text-[#786150] font-sans">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                      {b.rebookedAt && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-sans text-[9px] font-bold border border-amber-300">
                          Rebooked
                        </span>
                      )}
                    </td>

                    {/* Guest Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#2C1E15] text-sm">{b.guestName}</div>
                      <div className="font-mono text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{b.guestPhone}</span>
                      </div>
                      {b.guestEmail && (
                        <div className="text-[10px] text-[#786150]">{b.guestEmail}</div>
                      )}
                    </td>

                    {/* Room */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#2C1E15]">{b.roomTitle}</div>
                      <div className="text-[10px] text-[#786150]">
                        {b.adultGuests} Adults {b.childGuests > 0 ? `, ${b.childGuests} Kids` : ''}
                      </div>
                    </td>

                    {/* Stay Schedule */}
                    <td className="py-3.5 px-4">
                      {b.stayType === 'nightly' ? (
                        <div>
                          <div className="font-semibold text-[#2C1E15]">{b.checkInDate} to {b.checkOutDate}</div>
                          <div className="text-[10px] text-amber-800 font-bold">{b.numberOfNights} Night(s)</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-[#2C1E15]">{b.hourlyDate} at {b.hourlyStartTime}</div>
                          <div className="text-[10px] text-emerald-800 font-bold">{b.hourlyDurationHours} Hours Block</div>
                        </div>
                      )}
                    </td>

                    {/* Financials */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-[#786150]">Total: <strong>₱{b.grandTotal.toLocaleString()}</strong></div>
                      <div className="text-emerald-700 font-bold">
                        Paid: ₱{b.amountPaidNow.toLocaleString()}{' '}
                        <span className="text-[10px] font-normal">
                          ({b.paymentOption === 'partial_40' ? '40%' : '100%'})
                        </span>
                      </div>
                      <div className="text-amber-900 font-semibold text-[11px]">
                        Bal: ₱{b.remainingBalance.toLocaleString()}
                      </div>
                    </td>

                    {/* Deposit Slip Thumbnail */}
                    <td className="py-3.5 px-4">
                      {b.paymentSlipUrl ? (
                        <button
                          onClick={() => onOpenSlipLightbox(b)}
                          className="group relative block rounded-xl overflow-hidden border border-[#E6D7C3] hover:border-[#2C1E15] shadow-xs cursor-pointer"
                          title="Click to zoom slip"
                        >
                          <img
                            src={b.paymentSlipUrl}
                            alt="Slip thumbnail"
                            className="w-12 h-12 object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#786150]">No file</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : b.status === 'Checked-In'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : b.status === 'Pending Slip Review'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : b.status === 'Completed'
                            ? 'bg-gray-100 text-gray-700 border border-gray-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                        }`}>
                          {b.status}
                        </span>
                        {b.status === 'Cancelled' && (b.cancellationReason || b.staffNotes) && (
                          <button
                            onClick={() => setViewingCancellationBooking(b)}
                            className="text-rose-600 hover:text-rose-800 p-0.5 rounded cursor-pointer"
                            title="View cancellation details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Review Screening Action Button */}
                        {b.status === 'Pending Slip Review' && (
                          <button
                            onClick={() => handleStartScreening(b)}
                            disabled={!currentPermissions.canApproveSlips}
                            className={`flex items-center gap-1 px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm ${
                              currentPermissions.canApproveSlips 
                                ? 'bg-amber-700 hover:bg-amber-800' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={currentPermissions.canApproveSlips ? 'Screen & Verify Deposit Slip' : 'Permission restricted'}
                          >
                            <FileCheck className="w-3 h-3" />
                            <span>Screen</span>
                          </button>
                        )}

                        {/* Rebook Button under reference */}
                        {b.status !== 'Completed' && (
                          <button
                            onClick={() => handleLoadBookingForRebook(b)}
                            disabled={!currentPermissions.canRebook}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              currentPermissions.canRebook
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                            title={currentPermissions.canRebook ? `Rebook ref ${b.id}` : 'Rebooking permission restricted'}
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Check-In */}
                        {b.status === 'Confirmed' && currentPermissions.canCheckInOut && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'Checked-In', `Guest checked in by ${currentUser?.fullName || 'Staff'}.`)}
                            className="px-2 py-1 bg-[#2C1E15] hover:bg-[#523A2A] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Check-In
                          </button>
                        )}

                        {/* Complete Stay */}
                        {b.status === 'Checked-In' && currentPermissions.canCheckInOut && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'Completed', `Stay completed & key returned.`)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}

                        {/* Cancel Booking Button */}
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              if (!currentPermissions.canCancel) {
                                alert('Restricted: You do not have permission to cancel bookings. Contact manager.');
                                return;
                              }
                              setBookingToCancel(b);
                              setCancelReasonPreset('Guest Requested Cancellation');
                              setCancelRefundNotes(
                                b.paymentOption === 'partial_40' 
                                  ? '40% downpayment forfeited as per policy' 
                                  : 'Refund processed as per terms'
                              );
                            }}
                            disabled={!currentPermissions.canCancel}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              currentPermissions.canCancel
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                            }`}
                            title={currentPermissions.canCancel ? 'Cancel Reservation' : 'Cancellation restricted'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Re-instate / Reopen button for Cancelled bookings */}
                        {b.status === 'Cancelled' && currentPermissions.canCancel && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, 'Confirmed', 'Reinstated and re-confirmed by front desk.')}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            title="Re-open / Reinstate reservation"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                        )}

                        {/* Edit Booking */}
                        <button
                          onClick={() => setEditingBooking(b)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit Booking Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Booking */}
                        <button
                          onClick={() => setDeletingBooking(b)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete Booking Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Master Voucher */}
                        <button
                          onClick={() => onOpenVoucher(b)}
                          className="p-1.5 bg-[#F5EBE6] hover:bg-[#E6D7C3] text-[#2C1E15] rounded-lg transition-colors cursor-pointer"
                          title="Print Official Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            /* Content: Grid View */
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className={`bg-[#FDFBF7] rounded-2xl border p-4 shadow-sm space-y-3.5 transition-all flex flex-col justify-between hover:shadow-md ${
                    b.status === 'Cancelled'
                      ? 'border-rose-300 bg-rose-50/20'
                      : b.status === 'Pending Slip Review'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-[#E6D7C3]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Ref, Date, and Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#E6D7C3]/50 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#2C1E15] bg-[#F5EBE6] px-2 py-0.5 rounded border border-[#E6D7C3]">
                            {b.id}
                          </span>
                          {b.rebookedAt && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-bold border border-amber-300">
                              Rebooked
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#786150] block mt-1">
                          Booked: {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : b.status === 'Pending Slip Review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                            : b.status === 'Checked-In'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : b.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}>
                          {b.status}
                        </span>
                        {b.status === 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => setViewingCancellationBooking(b)}
                            className="block mt-0.5 text-[9px] text-rose-700 underline font-semibold ml-auto cursor-pointer"
                          >
                            View Reason
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Guest & Room Details */}
                    <div>
                      <h4 className="font-bold text-sm text-[#2C1E15]">{b.guestName}</h4>
                      <div className="font-mono text-emerald-800 text-xs font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{b.guestPhone}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#523A2A] mt-1 flex items-center justify-between">
                        <span>{b.roomTitle}</span>
                        <span className="text-[11px] text-[#786150] font-normal">
                          {b.adultGuests} Adults {b.childGuests > 0 ? `, ${b.childGuests} Kids` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Schedule Box */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6D7C3]/60 text-xs space-y-1">
                      <div className="text-[#786150] text-[10px] uppercase font-bold tracking-wider">Stay Schedule</div>
                      {b.stayType === 'nightly' ? (
                        <div className="flex justify-between items-center text-xs font-semibold text-[#2C1E15]">
                          <span>{b.checkInDate} → {b.checkOutDate}</span>
                          <span className="text-amber-800 font-bold font-mono">{b.numberOfNights}N</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs font-semibold text-[#2C1E15]">
                          <span>{b.hourlyDate} ({b.hourlyStartTime})</span>
                          <span className="text-emerald-800 font-bold font-mono">{b.hourlyDurationHours}h</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6D7C3]/60 text-xs space-y-1">
                      <div className="flex justify-between text-[#786150]">
                        <span>Grand Total:</span>
                        <strong className="text-[#2C1E15]">₱{b.grandTotal.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Paid Deposit:</span>
                        <span>₱{b.amountPaidNow.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#E6D7C3]/40 pt-1 text-xs">
                        <span className="text-[#786150]">Balance Due:</span>
                        {b.remainingBalance > 0 ? (
                          <strong className="text-amber-900 font-mono">₱{b.remainingBalance.toLocaleString()}</strong>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">Fully Paid</span>
                        )}
                      </div>
                    </div>

                    {/* Slip Thumbnail if present */}
                    {b.paymentSlipUrl && (
                      <div className="flex items-center justify-between p-2 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                        <div className="flex items-center gap-2">
                          <img 
                            src={b.paymentSlipUrl} 
                            alt="Slip" 
                            className="w-8 h-8 rounded-lg object-cover border border-amber-300"
                          />
                          <span className="text-[11px] font-semibold text-amber-900">Receipt Attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenSlipLightbox(b)}
                          className="px-2 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-[#E6D7C3]/50 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {/* Review Slip */}
                      {b.status === 'Pending Slip Review' && currentPermissions.canApproveSlips && (
                        <button
                          onClick={() => handleStartScreening(b)}
                          className="px-2.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Screen</span>
                        </button>
                      )}

                      {/* Check-In */}
                      {b.status === 'Confirmed' && currentPermissions.canCheckInOut && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'Checked-In', `Guest checked in by ${currentUser?.fullName || 'Staff'}.`)}
                          className="px-2.5 py-1.5 bg-[#2C1E15] hover:bg-[#523A2A] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Check-In
                        </button>
                      )}

                      {/* Complete Stay */}
                      {b.status === 'Checked-In' && currentPermissions.canCheckInOut && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'Completed', `Stay completed & key returned.`)}
                          className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      {/* Reopen */}
                      {b.status === 'Cancelled' && currentPermissions.canCancel && (
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'Confirmed', 'Reinstated and re-confirmed by front desk.')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Rebook */}
                      {b.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            if (!currentPermissions.canRebook) {
                              alert('Restricted: You do not have permission to rebook. Contact manager.');
                              return;
                            }
                            handleLoadBookingForRebook(b);
                          }}
                          disabled={!currentPermissions.canRebook}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            currentPermissions.canRebook
                              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                          }`}
                          title="Rebook"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Cancel */}
                      {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            if (!currentPermissions.canCancel) {
                              alert('Restricted: You do not have permission to cancel bookings. Contact manager.');
                              return;
                            }
                            setBookingToCancel(b);
                            setCancelReasonPreset('Guest Requested Cancellation');
                            setCancelRefundNotes(
                              b.paymentOption === 'partial_40' 
                                ? '40% downpayment forfeited as per policy' 
                                : 'Refund processed as per terms'
                            );
                          }}
                          disabled={!currentPermissions.canCancel}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            currentPermissions.canCancel
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                          }`}
                          title="Cancel"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => setEditingBooking(b)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                        title="Edit Booking Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeletingBooking(b)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Delete Booking Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Voucher */}
                      <button
                        onClick={() => onOpenVoucher(b)}
                        className="p-1.5 bg-[#F5EBE6] hover:bg-[#E6D7C3] text-[#2C1E15] rounded-lg transition-colors cursor-pointer"
                        title="Print Official Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {filteredBookings.length === 0 && (
            <div className="p-8 text-center text-xs text-[#786150]">
              No reservations found matching the current search or status filter.
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB: REVIEW SCREENING CONSOLE */}
      {activeSubTab === 'screening' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6D7C3]/40 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-amber-800" />
                <h3 className="font-serif font-bold text-xl text-[#2C1E15]">
                  Deposit Slip Review Screening
                </h3>
              </div>
              <p className="text-xs text-[#786150] mt-0.5">
                Audit pending GCash and bank transfer receipts, run verification checklist, and approve reservations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold font-mono">
                {pendingScreeningBookings.length} Pending Approval
              </span>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                <button
                  type="button"
                  onClick={() => setScreeningViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    screeningViewMode === 'grid'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreeningViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    screeningViewMode === 'table'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {pendingScreeningBookings.length === 0 ? (
            <div className="p-12 text-center bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E6D7C3] space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-serif font-bold text-base text-[#2C1E15]">All Deposit Slips Cleared!</h4>
              <p className="text-xs text-[#786150] max-w-md mx-auto">
                There are no pending deposit slips awaiting review screening at this time.
              </p>
              <button
                onClick={() => setActiveSubTab('bookings')}
                className="px-4 py-2 bg-[#2C1E15] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
              >
                Return to Bookings Table
              </button>
            </div>
          ) : screeningViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingScreeningBookings.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-[#FDFBF7] border border-[#E6D7C3] rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        {b.id}
                      </span>
                      <span className="text-[11px] text-[#786150]">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-[#2C1E15]">{b.guestName}</div>
                      <div className="text-xs text-emerald-800 font-mono font-semibold">{b.guestPhone}</div>
                      <div className="text-xs text-[#786150]">{b.roomTitle}</div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-3 bg-white rounded-xl border border-[#E6D7C3]/60 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#786150]">Total Rate:</span>
                        <strong className="text-[#2C1E15]">₱{b.grandTotal.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786150]">Deposit Required:</span>
                        <strong className="text-emerald-700 font-bold">
                          ₱{b.amountPaidNow.toLocaleString()} ({b.paymentOption === 'partial_40' ? '40%' : '100%'})
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786150]">Payment Method:</span>
                        <span className="font-semibold uppercase text-xs">{b.paymentMethod}</span>
                      </div>
                    </div>

                    {/* Deposit Slip Preview Box */}
                    {b.paymentSlipUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#E6D7C3] bg-black/5 aspect-video flex items-center justify-center group">
                        <img 
                          src={b.paymentSlipUrl} 
                          alt="Slip" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <button
                          onClick={() => onOpenSlipLightbox(b)}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Inspect Full Slip</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center">
                        No slip image attached
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleStartScreening(b)}
                      disabled={!currentPermissions.canApproveSlips}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        currentPermissions.canApproveSlips
                          ? 'bg-amber-800 hover:bg-amber-900 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Screen & Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Screening: Table View */
            <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[11px]">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Guest Details</th>
                    <th className="py-3 px-4">Reserved Room</th>
                    <th className="py-3 px-4">Deposit Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Deposit Slip</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                  {pendingScreeningBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-950">
                        {b.id}
                        <span className="block text-[10px] text-[#786150] font-sans">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2C1E15]">{b.guestName}</div>
                        <div className="font-mono text-emerald-800 text-xs font-semibold">{b.guestPhone}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#2C1E15]">
                        {b.roomTitle}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-800 font-mono">
                          ₱{b.amountPaidNow.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#786150]">
                          of ₱{b.grandTotal.toLocaleString()} ({b.paymentOption === 'partial_40' ? '40% DP' : '100% Full'})
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold uppercase text-xs px-2 py-0.5 bg-[#F5EBE6] text-[#2C1E15] rounded-md border border-[#E6D7C3]">
                          {b.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {b.paymentSlipUrl ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={b.paymentSlipUrl} 
                              alt="Slip" 
                              className="w-9 h-9 object-cover rounded-lg border border-[#E6D7C3]"
                            />
                            <button
                              type="button"
                              onClick={() => onOpenSlipLightbox(b)}
                              className="px-2 py-1 bg-white hover:bg-gray-100 text-[#2C1E15] border border-[#E6D7C3] rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Zoom</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-rose-600 italic text-[11px]">Missing</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleStartScreening(b)}
                          disabled={!currentPermissions.canApproveSlips}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            currentPermissions.canApproveSlips
                              ? 'bg-amber-800 hover:bg-amber-900 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Screen & Approve</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: REBOOK UNDER BOOKING REFERENCE */}
      {activeSubTab === 'rebook' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-[#E6D7C3]/40 pb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-[#8B6B10]" />
              <h3 className="font-serif font-bold text-xl text-[#2C1E15]">
                Rebook Under Booking Reference
              </h3>
            </div>
            <p className="text-xs text-[#786150] mt-0.5">
              Change room, reschedule stay dates, and adjust pax under an existing reservation reference.
            </p>
          </div>

          {/* Reference Search Box */}
          <form onSubmit={handleSearchBookingToRebook} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Booking Ref (e.g. DV-2026-8941)"
              value={rebookRefInput}
              onChange={(e) => setRebookRefInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-mono font-bold text-[#2C1E15] uppercase outline-none focus:ring-2 focus:ring-[#B8860B]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#2C1E15] hover:bg-[#1A1009] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Load Booking</span>
            </button>
          </form>

          {rebookSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rebookSuccessMsg}</span>
            </div>
          )}

          {/* If Booking is Loaded */}
          {selectedRebookBooking && rebookingCalculation && (
            <form onSubmit={handleExecuteRebooking} className="space-y-5 bg-[#FDFBF7] p-5 sm:p-6 rounded-2xl border border-[#E6D7C3]">
              
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/60 pb-3">
                <div>
                  <span className="text-[11px] text-[#786150]">Active Reference:</span>
                  <div className="font-mono font-bold text-sm text-[#2C1E15]">{selectedRebookBooking.id}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#786150]">Guest:</span>
                  <div className="font-bold text-xs text-[#2C1E15]">{selectedRebookBooking.guestName}</div>
                </div>
              </div>

              {/* Room Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1.5">
                  Select Room / Villa Unit
                </label>
                <select
                  value={rebookRoomId}
                  onChange={(e) => setRebookRoomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} — ₱{r.pricing.nightly.toLocaleString()}/night ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nightly Dates vs Hourly */}
              {selectedRebookBooking.stayType === 'nightly' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">New Check-In Date</label>
                    <input
                      type="date"
                      required
                      value={rebookCheckIn}
                      onChange={(e) => setRebookCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">New Check-Out Date</label>
                    <input
                      type="date"
                      required
                      value={rebookCheckOut}
                      onChange={(e) => setRebookCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">Stay Date</label>
                    <input
                      type="date"
                      required
                      value={rebookHourlyDate}
                      onChange={(e) => setRebookHourlyDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={rebookHourlyTime}
                      onChange={(e) => setRebookHourlyTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2C1E15] mb-1">Duration</label>
                    <select
                      value={rebookHourlyHours}
                      onChange={(e) => setRebookHourlyHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none"
                    >
                      <option value={3}>3 Hours Block</option>
                      <option value={6}>6 Hours Block</option>
                      <option value={12}>12 Hours Block</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Guests Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">Adult Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={rebookAdults}
                    onChange={(e) => setRebookAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1E15] mb-1">Child Guests</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={rebookChildren}
                    onChange={(e) => setRebookChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                  />
                </div>
              </div>

              {/* Financial Recalculation Card */}
              <div className="bg-white p-4 rounded-xl border border-[#E6D7C3] space-y-2 text-xs">
                <div className="font-bold text-[#2C1E15] flex items-center justify-between border-b border-[#E6D7C3]/40 pb-1.5">
                  <span>Rate Recalculation</span>
                  <span className="text-[11px] text-indigo-700 font-sans">
                    {rebookingCalculation.nightsCount} Night(s) Stay
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">Previous Total:</span>
                  <span className="font-medium">₱{selectedRebookBooking.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">New Grand Total:</span>
                  <strong className="text-[#2C1E15]">₱{rebookingCalculation.newGrandTotal.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Already Paid Deposit:</span>
                  <strong className="font-mono font-bold">- ₱{rebookingCalculation.amountAlreadyPaid.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E6D7C3]/40 text-amber-900 font-bold">
                  <span>Adjusted Remaining Balance:</span>
                  <span className="font-mono">₱{rebookingCalculation.newRemainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1">Rebooking Reason / Remarks</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guest requested schedule adjustment due to flight change"
                  value={rebookReason}
                  onChange={(e) => setRebookReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRebookBooking(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#2C1E15] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2C1E15] hover:bg-[#1A1009] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CalendarCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Confirm & Save Rebooking</span>
                </button>
              </div>

            </form>
          )}

          {/* If No Booking is Loaded: Quick Selection Directory with Grid & Table View */}
          {!selectedRebookBooking && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/40 pb-2">
                <span className="text-xs font-bold text-[#2C1E15]">Or Select Active Reservation to Rebook:</span>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                  <button
                    type="button"
                    onClick={() => setRebookViewMode('table')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      rebookViewMode === 'table'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRebookViewMode('grid')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      rebookViewMode === 'grid'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                </div>
              </div>

              {rebookViewMode === 'table' ? (
                <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60 max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px] sticky top-0">
                        <th className="py-2.5 px-3">Ref</th>
                        <th className="py-2.5 px-3">Guest</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3">Schedule</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                      {bookings.filter(b => b.status !== 'Completed').map((b) => (
                        <tr key={b.id} className="hover:bg-[#FDFBF7] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2C1E15]">{b.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#2C1E15]">{b.guestName}</td>
                          <td className="py-2.5 px-3 text-[#523A2A]">{b.roomTitle}</td>
                          <td className="py-2.5 px-3 text-[#786150]">
                            {b.stayType === 'nightly' ? `${b.checkInDate} to ${b.checkOutDate}` : `${b.hourlyDate}`}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleLoadBookingForRebook(b)}
                              className="px-2.5 py-1 bg-[#2C1E15] hover:bg-[#1A1009] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {bookings.filter(b => b.status !== 'Completed').map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleLoadBookingForRebook(b)}
                      className="p-3 bg-[#FDFBF7] border border-[#E6D7C3] hover:border-[#B8860B] rounded-2xl cursor-pointer transition-all space-y-1.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#2C1E15] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E6D7C3]">
                            {b.id}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800">
                            ₱{b.grandTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#2C1E15] mt-1">{b.guestName}</div>
                        <div className="text-[11px] text-[#523A2A]">{b.roomTitle}</div>
                        <div className="text-[10px] text-[#786150]">
                          {b.stayType === 'nightly' ? `${b.checkInDate} to ${b.checkOutDate}` : `${b.hourlyDate} (${b.hourlyDurationHours}h)`}
                        </div>
                      </div>
                      <div className="pt-1 border-t border-[#E6D7C3]/40 flex justify-end">
                        <span className="text-[10px] font-bold text-[#8B6B10] flex items-center gap-1">
                          <span>Rebook This</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: STAFF ACCOUNTS MANAGEMENT (RESTRICTED AREA) */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          
          {/* Permission Gate Check */}
          {!currentPermissions.canManageStaff ? (
            <div className="bg-white rounded-3xl border border-rose-300 shadow-xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-rose-900">Restricted Admin Area</h3>
              <p className="text-xs text-[#786150] leading-relaxed">
                Staff Account Management is restricted to <strong>Super Admin</strong> authorization. Your current role (<strong>{currentUser?.role || 'Staff'}</strong>) does not hold credentials to create or modify staff accounts.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveSubTab('bookings')}
                  className="px-5 py-2.5 bg-[#2C1E15] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Back to Bookings Console
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Create Staff Account Form */}
              <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-5 lg:col-span-1">
                <div className="border-b border-[#E6D7C3]/40 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#8B6B10]" />
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Create Staff Account</h3>
                  </div>
                  <p className="text-[11px] text-[#786150]">Add desk personnel with granular access controls.</p>
                </div>

                {staffCreateSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Staff account created successfully!</span>
                  </div>
                )}

                {staffActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{staffActionError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Full Staff Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan dela Cruz"
                      value={newStaffFullName}
                      onChange={(e) => setNewStaffFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-medium outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Username</label>
                      <input
                        type="text"
                        required
                        placeholder="juan_desk"
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Role Assignment</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => applyRolePreset(e.target.value as StaffRole)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] font-semibold text-[#2C1E15] outline-none"
                    >
                      <option value="Super Admin">Super Admin (All Access)</option>
                      <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                      <option value="Front Desk Officer">Front Desk Officer</option>
                      <option value="Reservations Clerk">Reservations Clerk</option>
                      <option value="Night Auditor">Night Auditor</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="0917 000 0000"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2C1E15] mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="staff@vigan.ph"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] outline-none"
                      />
                    </div>
                  </div>

                  {/* Permissions Checklist Area */}
                  <div className="pt-2 space-y-2 border-t border-[#E6D7C3]/40">
                    <label className="block font-bold text-[#2C1E15] uppercase text-[10px] tracking-wider">
                      Restricted Area Permissions
                    </label>
                    
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canApproveSlips}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canApproveSlips: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Review & Approve Slips</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canRebook}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canRebook: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Rebook Reservations</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canCancel}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canCancel: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Cancel Bookings & Void Slips</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canWalkin}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canWalkin: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>Walk-in On-site Check-in</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#2C1E15]">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canViewFinancials}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canViewFinancials: e.target.checked }))}
                          className="rounded text-amber-800"
                        />
                        <span>View Financial Totals & Reports</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-rose-800">
                        <input
                          type="checkbox"
                          checked={newStaffPermissions.canManageStaff}
                          onChange={(e) => setNewStaffPermissions(p => ({ ...p, canManageStaff: e.target.checked }))}
                          className="rounded text-rose-800"
                        />
                        <span>Manage Staff Accounts (Restricted)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#2C1E15] hover:bg-[#1A1009] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                    <span>Create Staff Account</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Staff Accounts Directory */}
              <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-4 lg:col-span-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/40 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Active Staff Accounts</h3>
                    <p className="text-xs text-[#786150]">Manage authorized front desk and estate operations accounts.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#F5EBE6] text-[#2C1E15] rounded-full text-xs font-bold border border-[#E6D7C3]">
                      {staffAccounts.length} Registered
                    </span>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                      <button
                        type="button"
                        onClick={() => setStaffViewMode('table')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          staffViewMode === 'table'
                            ? 'bg-[#2C1E15] text-white shadow-sm'
                            : 'text-[#523A2A] hover:bg-white/60'
                        }`}
                        title="Table View"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffViewMode('grid')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          staffViewMode === 'grid'
                            ? 'bg-[#2C1E15] text-white shadow-sm'
                            : 'text-[#523A2A] hover:bg-white/60'
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                    </div>
                  </div>
                </div>

                {staffViewMode === 'table' ? (
                  <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px]">
                          <th className="py-2.5 px-3">Staff Name & User</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Contact Details</th>
                          <th className="py-2.5 px-3">Granted Permissions</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                        {staffAccounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-[#FDFBF7] transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-[#2C1E15]">{acc.fullName}</div>
                              <div className="font-mono text-[11px] text-[#786150]">@{acc.username}</div>
                            </td>

                            <td className="py-3 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                acc.role === 'Super Admin'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : acc.role === 'Front Desk Supervisor'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}>
                                {acc.role}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-[11px] text-[#523A2A]">
                              {acc.phone && <div className="font-mono">{acc.phone}</div>}
                              {acc.email && <div className="text-[#786150] text-[10px]">{acc.email}</div>}
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {acc.permissions.canApproveSlips && (
                                  <span className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                                    Slips
                                  </span>
                                )}
                                {acc.permissions.canRebook && (
                                  <span className="text-[9px] bg-[#FAF7F2] text-[#2C1E15] border border-[#E6D7C3] px-1.5 py-0.2 rounded font-medium">
                                    Rebook
                                  </span>
                                )}
                                {acc.permissions.canCancel && (
                                  <span className="text-[9px] bg-rose-50 text-rose-900 border border-rose-200 px-1.5 py-0.2 rounded">
                                    Cancel
                                  </span>
                                )}
                                {acc.permissions.canWalkin && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded">
                                    Walkin
                                  </span>
                                )}
                                {acc.permissions.canManageStaff && (
                                  <span className="text-[9px] bg-[#F5EDE0] text-[#3D2616] border border-[#D9C5B0] px-1.5 py-0.2 rounded font-bold">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              {acc.isActive ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                  Active
                                </span>
                              ) : (
                                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold border border-rose-200">
                                  Deactivated
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {acc.username !== 'admin' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleStaffStatus(acc.id)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                      acc.isActive
                                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                    }`}
                                  >
                                    {acc.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(acc.id)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete account"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-[#786150] px-2 py-0.5 bg-gray-100 rounded-md">
                                  Root
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {staffAccounts.map((acc) => (
                      <div 
                        key={acc.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          acc.isActive ? 'bg-[#FDFBF7] border-[#E6D7C3]' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-sm text-[#2C1E15] block">{acc.fullName}</strong>
                              <span className="font-mono text-xs font-bold text-[#786150]">@{acc.username}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              acc.role === 'Super Admin'
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : acc.role === 'Front Desk Supervisor'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}>
                              {acc.role}
                            </span>
                          </div>

                          <div className="text-xs text-[#786150] space-y-0.5">
                            {acc.phone && <div className="flex items-center gap-1 font-mono text-[11px]"><Phone className="w-3 h-3 text-[#2C1E15]" /> {acc.phone}</div>}
                            {acc.email && <div className="flex items-center gap-1 text-[11px]"><Mail className="w-3 h-3 text-[#2C1E15]" /> {acc.email}</div>}
                          </div>

                          {/* Granted permissions badges */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {acc.permissions.canApproveSlips && (
                              <span className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                                Approve Slips
                              </span>
                            )}
                            {acc.permissions.canRebook && (
                              <span className="text-[9px] bg-[#FAF7F2] text-[#2C1E15] border border-[#E6D7C3] px-1.5 py-0.2 rounded font-medium">
                                Rebook
                              </span>
                            )}
                            {acc.permissions.canCancel && (
                              <span className="text-[9px] bg-rose-50 text-rose-900 border border-rose-200 px-1.5 py-0.2 rounded">
                                Cancel
                              </span>
                            )}
                            {acc.permissions.canWalkin && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded">
                                Walkin
                              </span>
                            )}
                            {acc.permissions.canManageStaff && (
                              <span className="text-[9px] bg-[#F5EDE0] text-[#3D2616] border border-[#D9C5B0] px-1.5 py-0.2 rounded font-bold">
                                Staff Admin
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E6D7C3]/40">
                          <div>
                            {acc.isActive ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                                Deactivated
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {acc.username !== 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleToggleStaffStatus(acc.id)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                    acc.isActive
                                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  {acc.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(acc.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                  title="Delete account"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold text-[#786150] px-2 py-0.5 bg-white rounded-lg border border-[#E6D7C3]">
                                Primary Root
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: INQUIRIES LOG */}
      {activeSubTab === 'inquiries' && (
        <div className="bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/40 pb-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Direct Website Inquiries</h3>
              <p className="text-xs text-[#786150]">Submissions from the "Contact Us" form</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-[#F5EBE6] text-[#2C1E15] px-3 py-1 rounded-full border border-[#E6D7C3]">
                {inquiries.length} Total Messages
              </span>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                <button
                  type="button"
                  onClick={() => setInquiriesViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    inquiriesViewMode === 'table'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInquiriesViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    inquiriesViewMode === 'grid'
                      ? 'bg-[#2C1E15] text-white shadow-sm'
                      : 'text-[#523A2A] hover:bg-white/60'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#786150]">
              No group inquiries submitted yet. Guest inquiries from the Contact tab will show up here.
            </div>
          ) : inquiriesViewMode === 'table' ? (
            <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px]">
                    <th className="py-3 px-4">Timestamp & Date</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Room Interest & Dates</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3 px-4 text-[11px] text-[#786150] whitespace-nowrap">
                        <div className="font-semibold text-[#2C1E15] flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          <span>{new Date(inq.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="text-[10px] text-amber-900 font-mono flex items-center gap-1 mt-0.5 font-semibold">
                          <Clock className="w-3 h-3 text-amber-700 inline" />
                          <span>{new Date(inq.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-[#2C1E15]">
                        {inq.fullName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-emerald-800 font-semibold">{inq.phone}</div>
                        {inq.email && <div className="text-[10px] text-[#786150]">{inq.email}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-amber-900 block">{inq.roomInterest}</span>
                        {inq.targetDates && (
                          <span className="text-[10px] text-[#786150]">Dates: {inq.targetDates}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-xs text-[#523A2A]">
                          "{inq.message || 'No extra message provided.'}"
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingInquiry(inq)}
                            className="p-1.5 rounded-lg border border-[#E6D7C3] bg-[#FAF7F2] hover:bg-amber-100 text-[#8B6B10] transition-all cursor-pointer"
                            title="Edit Inquiry Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingInquiry(inq)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                            title="Delete Inquiry Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${inq.phone}`}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${inq.phone.replace(/[\s-]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-[#25D366] hover:brightness-105 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                          >
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E6D7C3]/70 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[#2C1E15]">{inq.fullName}</strong>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-[#2C1E15] block">
                          {new Date(inq.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-amber-900 font-mono flex items-center justify-end gap-1 font-semibold">
                          <Clock className="w-2.5 h-2.5 text-amber-700 inline" />
                          <span>{new Date(inq.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-emerald-800 font-mono font-semibold flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{inq.phone}</span>
                      {inq.email && <span className="text-gray-500 font-sans text-[11px]">({inq.email})</span>}
                    </div>

                    <div className="text-xs font-semibold text-amber-800 bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      Interest: {inq.roomInterest} {inq.targetDates ? `• ${inq.targetDates}` : ''}
                    </div>

                    <p className="text-xs text-[#523A2A] bg-white p-3 rounded-xl border border-[#E6D7C3]/40 leading-relaxed">
                      "{inq.message || 'No extra message provided.'}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#E6D7C3]/40">
                    <button
                      type="button"
                      onClick={() => setEditingInquiry(inq)}
                      className="px-2.5 py-1.5 bg-[#FAF7F2] hover:bg-amber-100 border border-[#E6D7C3] text-[#8B6B10] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Edit Inquiry Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingInquiry(inq)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Delete Inquiry Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Del</span>
                    </button>
                    <a
                      href={`tel:${inq.phone}`}
                      className="flex-1 text-center py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Call Guest
                    </a>
                    <a
                      href={`https://wa.me/${inq.phone.replace(/[\s-]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-1.5 bg-[#25D366] hover:brightness-105 text-white rounded-xl text-xs font-bold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ========================================================================= */}
      {/* SUB-TAB: GUEST DATABASE & CRM (FRONT DESK) */}
      {/* ========================================================================= */}
      {activeSubTab === "guests" && (
        <div className="space-y-6">
          {/* Toast Notification */}
          {guestToastMessage && (
            <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{guestToastMessage}</span>
              </div>
              <button onClick={() => setGuestToastMessage(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] p-5 sm:p-6 rounded-3xl border border-[#E6D7C3]">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2C1E15] flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#B8860B]" />
                  <span>Front Desk Guest Database</span>
                </h3>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  CRM & Stay Records
                </span>
              </div>
              <p className="text-xs text-[#786150] mt-1 max-w-2xl leading-relaxed">
                Complete directory of registered guests, booking histories, contact profiles, ID verification, lifetime spend, and front desk VIP notes.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={exportGuestsToCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-[#2C1E15] hover:bg-[#FAF7F2] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Download CSV database of all guests"
              >
                <Download className="w-3.5 h-3.5 text-[#8B6B10]" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setIsAddGuestModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#A67908] hover:from-[#A67908] hover:to-[#B8860B] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Guest Record</span>
              </button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6D7C3]/80 shadow-xs">
              <div className="text-[11px] font-bold text-[#786150] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Guests</span>
                <Users className="w-4 h-4 text-[#B8860B]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#2C1E15]">
                {guestDatabaseAnalytics.total}
              </div>
              <div className="text-[10px] text-[#8A5A66] mt-0.5">Recorded across all stays</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6D7C3]/80 shadow-xs">
              <div className="text-[11px] font-bold text-[#786150] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>VIP & Repeat</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-700">
                {guestDatabaseAnalytics.vip}
              </div>
              <div className="text-[10px] text-[#8A5A66] mt-0.5">Priority VIP profiles</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6D7C3]/80 shadow-xs">
              <div className="text-[11px] font-bold text-[#786150] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Stays Completed</span>
                <History className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-800">
                {guestDatabaseAnalytics.totalStays}
              </div>
              <div className="text-[10px] text-[#8A5A66] mt-0.5">Confirmed check-ins</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6D7C3]/80 shadow-xs">
              <div className="text-[11px] font-bold text-[#786150] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Guest Spend</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-[#8B6B10]">
                ₱{guestDatabaseAnalytics.totalSpend.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#8A5A66] mt-0.5">Captured guest revenue</div>
            </div>
          </div>

          {/* Search, Filter & Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6D7C3]/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#786150] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest by name, phone, email, ID number, address, or booking ID..."
                  value={guestSearchQuery}
                  onChange={(e) => setGuestSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white"
                />
                {guestSearchQuery && (
                  <button
                    onClick={() => setGuestSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode & Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <select
                    value={guestSortBy}
                    onChange={(e) => setGuestSortBy(e.target.value as any)}
                    className="bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-bold text-[#523A2A] focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                  >
                    <option value="recent">Sort: Most Recent Stay</option>
                    <option value="stays">Sort: Most Stays</option>
                    <option value="spend">Sort: Highest Spend</option>
                    <option value="name">Sort: Name (A-Z)</option>
                  </select>
                </div>

                <div className="flex items-center bg-[#FAF7F2] p-0.5 rounded-xl border border-[#E6D7C3]">
                  <button
                    onClick={() => setGuestViewMode("table")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      guestViewMode === "table" ? "bg-[#2C1E15] text-white shadow-xs" : "text-[#786150] hover:text-[#2C1E15]"
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGuestViewMode("grid")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      guestViewMode === "grid" ? "bg-[#2C1E15] text-white shadow-xs" : "text-[#786150] hover:text-[#2C1E15]"
                    }`}
                    title="Card Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E6D7C3]/40">
              <button
                onClick={() => setGuestFilterStatus("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guestFilterStatus === "all"
                    ? "bg-[#2C1E15] text-white"
                    : "bg-[#FAF7F2] text-[#523A2A] hover:bg-stone-200"
                }`}
              >
                All Guests ({guestProfiles.length})
              </button>
              <button
                onClick={() => setGuestFilterStatus("vip")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guestFilterStatus === "vip"
                    ? "bg-amber-800 text-white"
                    : "bg-[#FAF7F2] text-[#523A2A] hover:bg-stone-200"
                }`}
              >
                <Award className="w-3 h-3 text-amber-500" />
                <span>VIP Guests ({guestDatabaseAnalytics.vip})</span>
              </button>
              <button
                onClick={() => setGuestFilterStatus("repeat")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guestFilterStatus === "repeat"
                    ? "bg-amber-800 text-white"
                    : "bg-[#FAF7F2] text-[#523A2A] hover:bg-stone-200"
                }`}
              >
                Repeat Stayers (2+ Stays) ({guestProfiles.filter(g => g.totalStays >= 2).length})
              </button>
              <button
                onClick={() => setGuestFilterStatus("active")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guestFilterStatus === "active"
                    ? "bg-emerald-800 text-white"
                    : "bg-[#FAF7F2] text-[#523A2A] hover:bg-stone-200"
                }`}
              >
                Currently Checked-In ({guestProfiles.filter(g => g.bookings.some(b => b.status === "Checked-In")).length})
              </button>
              <button
                onClick={() => setGuestFilterStatus("inquiry")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guestFilterStatus === "inquiry"
                    ? "bg-[#2C1E15] text-white"
                    : "bg-[#FAF7F2] text-[#523A2A] hover:bg-stone-200"
                }`}
              >
                Inquiry Leads ({guestProfiles.filter(g => g.source === "inquiry" || g.totalStays === 0).length})
              </button>
            </div>
          </div>

          {/* Directory Content (Table or Grid) */}
          {filteredGuestProfiles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E6D7C3] space-y-3">
              <Users className="w-12 h-12 text-[#C8B29E] mx-auto opacity-60" />
              <h4 className="font-serif font-bold text-lg text-[#2C1E15]">No Guest Records Found</h4>
              <p className="text-xs text-[#786150] max-w-md mx-auto">
                No guest matches the selected filter or search query "{guestSearchQuery}".
              </p>
              <button
                onClick={() => {
                  setGuestSearchQuery("");
                  setGuestFilterStatus("all");
                }}
                className="px-4 py-2 bg-[#2C1E15] text-white text-xs font-bold rounded-xl hover:bg-[#3D2B1F] transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : guestViewMode === "table" ? (
            /* TABLE VIEW */
            <div className="bg-white rounded-3xl border border-[#E6D7C3]/80 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#E6D7C3] text-[10px] uppercase font-bold text-[#786150] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Guest Profile</th>
                      <th className="py-3.5 px-4">Contact Details</th>
                      <th className="py-3.5 px-4">ID Verification</th>
                      <th className="py-3.5 px-4">Stays & Spend</th>
                      <th className="py-3.5 px-4">Last Stay Date</th>
                      <th className="py-3.5 px-4">Front Desk Notes</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6D7C3]/40">
                    {filteredGuestProfiles.map((guest) => {
                      const initials = guest.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "G";

                      return (
                        <tr key={guest.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  guest.isVip ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[#FAF7F2] text-[#523A2A] border border-[#E6D7C3]"
                                }`}>
                                  {initials}
                                </div>
                                {guest.isVip && (
                                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-2xs" title="VIP Guest">
                                    <Award className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-[#2C1E15] flex items-center gap-1.5">
                                  <span>{guest.fullName}</span>
                                  {guest.isVip && (
                                    <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase border border-amber-300">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                {guest.address && (
                                  <div className="text-[10px] text-[#786150] flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-[#B8860B]" />
                                    <span className="truncate max-w-[150px]">{guest.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {guest.phone ? (
                                <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-semibold text-[11px]">
                                  <Phone className="w-3 h-3 text-emerald-700" />
                                  <a href={`tel:${guest.phone}`} className="hover:underline">{guest.phone}</a>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-[10px]">No phone</span>
                              )}
                              {guest.email ? (
                                <div className="flex items-center gap-1.5 text-[#786150] text-[11px]">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <a href={`mailto:${guest.email}`} className="hover:underline truncate max-w-[180px]">{guest.email}</a>
                                </div>
                              ) : null}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {guest.idType && guest.idNumber ? (
                              <div>
                                <div className="text-[11px] font-semibold text-[#2C1E15]">{guest.idType}</div>
                                <div className="text-[10px] font-mono text-[#786150]">{guest.idNumber}</div>
                              </div>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">
                                Pending Check-In
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <div className="font-bold text-[#B8860B] text-xs">
                                ₱{guest.totalSpend.toLocaleString()}
                              </div>
                              <span className="inline-block bg-[#FAF7F2] text-[#523A2A] border border-[#E6D7C3] px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5">
                                {guest.totalStays} {guest.totalStays === 1 ? "Stay" : "Stays"}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {guest.lastStayDate ? (
                              <div className="text-[11px] font-medium text-[#2C1E15]">
                                {new Date(guest.lastStayDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">Inquiry Lead</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-[200px]">
                            {guest.notes ? (
                              <p className="text-[11px] text-[#523A2A] truncate bg-[#FAF7F2] px-2 py-1 rounded-lg border border-[#E6D7C3]/50" title={guest.notes}>
                                {guest.notes}
                              </p>
                            ) : (
                              <span className="text-gray-400 italic text-[10px]">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedGuestDossier(guest)}
                                className="px-2 py-1.5 rounded-lg border border-[#E6D7C3] bg-[#FAF7F2] hover:bg-stone-200 text-[#2C1E15] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="View Dossier & Stay History"
                              >
                                <Eye className="w-3 h-3 text-[#B8860B]" />
                                <span>Profile</span>
                              </button>

                              <button
                                onClick={() => setEditingGuestProfile(guest)}
                                className="p-1.5 rounded-lg border border-[#E6D7C3] bg-[#FAF7F2] hover:bg-amber-100 text-[#8B6B10] transition-all cursor-pointer"
                                title="Edit Guest Profile"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeletingGuestProfile(guest)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                                title="Delete Guest Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleInitiateWalkinForGuest(guest)}
                                className="px-2 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Walk-In Registration for this Guest"
                              >
                                <span>+ Walk-In</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGuestProfiles.map((guest) => {
                const initials = guest.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "G";

                return (
                  <div
                    key={guest.id}
                    className="bg-white rounded-3xl border border-[#E6D7C3]/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                            guest.isVip ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[#FAF7F2] text-[#523A2A] border border-[#E6D7C3]"
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-serif font-bold text-base text-[#2C1E15] flex items-center gap-1.5">
                              <span>{guest.fullName}</span>
                              {guest.isVip && (
                                <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase border border-amber-300">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#786150] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#B8860B]" />
                              <span>{guest.address || "Address on file"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-[#B8860B]">
                            ₱{guest.totalSpend.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-[#786150]">
                            {guest.totalStays} {guest.totalStays === 1 ? "Stay" : "Stays"}
                          </span>
                        </div>
                      </div>

                      {/* Contact Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#E6D7C3]/50">
                        {guest.phone && (
                          <a
                            href={`tel:${guest.phone}`}
                            className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                          >
                            <Phone className="w-2.5 h-2.5 text-emerald-700" />
                            <span>{guest.phone}</span>
                          </a>
                        )}
                        {guest.email && (
                          <a
                            href={`mailto:${guest.email}`}
                            className="flex items-center gap-1 text-[10px] text-[#786150] bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-[#E6D7C3] truncate max-w-[180px] hover:bg-stone-200"
                          >
                            <Mail className="w-2.5 h-2.5 text-gray-400" />
                            <span className="truncate">{guest.email}</span>
                          </a>
                        )}
                      </div>

                      {/* Notes Box */}
                      {guest.notes && (
                        <div className="mt-3 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E6D7C3]/60 text-[11px] text-[#523A2A]">
                          <span className="font-bold text-[#8B6B10] block text-[9px] uppercase tracking-wider mb-0.5">Front Desk Notes:</span>
                          <p className="line-clamp-2">{guest.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[#E6D7C3]/40">
                      <button
                        onClick={() => setSelectedGuestDossier(guest)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] hover:bg-stone-200 text-[#2C1E15] text-[11px] font-bold transition-all cursor-pointer"
                        title="View Dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#B8860B]" />
                        <span className="hidden sm:inline">Dossier</span>
                      </button>

                      <button
                        onClick={() => setEditingGuestProfile(guest)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] hover:bg-amber-100 text-[#8B6B10] text-[11px] font-bold transition-all cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingGuestProfile(guest)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Del</span>
                      </button>

                      <button
                        onClick={() => handleInitiateWalkinForGuest(guest)}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                        title="Walk-In Registration"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Walkin</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= GUEST DOSSIER MODAL ================= */}
          {selectedGuestDossier && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#E6D7C3] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#E6D7C3] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                      selectedGuestDossier.isVip ? "bg-amber-200 text-amber-950 border border-amber-400" : "bg-white text-[#523A2A] border border-[#E6D7C3]"
                    }`}>
                      {selectedGuestDossier.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2C1E15]">
                          {selectedGuestDossier.fullName}
                        </h3>
                        {selectedGuestDossier.isVip && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            VIP Guest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#786150] mt-0.5">
                        Guest ID: <span className="font-mono text-[#523A2A]">{selectedGuestDossier.id}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGuestDossier(null)}
                    className="w-9 h-9 rounded-full bg-white border border-[#E6D7C3] flex items-center justify-center text-[#786150] hover:text-[#2C1E15] hover:bg-stone-100 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                  {/* Lifetime Stat Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E6D7C3]/70">
                    <div>
                      <span className="text-[10px] font-bold text-[#786150] uppercase tracking-wider block">Total Spent</span>
                      <span className="text-lg font-bold font-serif text-[#B8860B]">₱{selectedGuestDossier.totalSpend.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#786150] uppercase tracking-wider block">Total Stays</span>
                      <span className="text-lg font-bold text-[#2C1E15]">{selectedGuestDossier.totalStays} Confirmed</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#786150] uppercase tracking-wider block">Bookings Count</span>
                      <span className="text-lg font-bold text-[#2C1E15]">{selectedGuestDossier.bookings.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#786150] uppercase tracking-wider block">Inquiries</span>
                      <span className="text-lg font-bold text-[#2C1E15]">{selectedGuestDossier.inquiries.length}</span>
                    </div>
                  </div>

                  {/* Profile & ID Information */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E6D7C3]/60 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#2C1E15] border-b border-[#E6D7C3]/40 pb-2 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#B8860B]" />
                      <span>Contact & Identification</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#786150] block font-semibold">Mobile Phone:</span>
                        <span className="font-mono text-emerald-800 font-bold">{selectedGuestDossier.phone || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#786150] block font-semibold">Email Address:</span>
                        <span className="text-[#2C1E15] font-medium">{selectedGuestDossier.email || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#786150] block font-semibold">Home Address / Origin:</span>
                        <span className="text-[#2C1E15]">{selectedGuestDossier.address || "Address not listed"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#786150] block font-semibold">Gov ID Verification:</span>
                        <span className="text-[#2C1E15] font-medium">
                          {selectedGuestDossier.idType ? `${selectedGuestDossier.idType} (${selectedGuestDossier.idNumber || "Verified"})` : "No ID presented yet"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Front Desk Notes & VIP Setting */}
                  <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-sm text-[#2C1E15] flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-amber-700" />
                        <span>Front Desk Notes & VIP Setting</span>
                      </h4>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-[#523A2A] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGuestNotesId === selectedGuestDossier.id ? tempVipInput : selectedGuestDossier.isVip}
                          onChange={(e) => {
                            if (editingGuestNotesId !== selectedGuestDossier.id) {
                              setEditingGuestNotesId(selectedGuestDossier.id);
                              setTempNotesInput(selectedGuestDossier.notes || "");
                            }
                            setTempVipInput(e.target.checked);
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                        <span>VIP Status</span>
                      </label>
                    </div>

                    <textarea
                      rows={2}
                      value={editingGuestNotesId === selectedGuestDossier.id ? tempNotesInput : (selectedGuestDossier.notes || "")}
                      onFocus={() => {
                        if (editingGuestNotesId !== selectedGuestDossier.id) {
                          setEditingGuestNotesId(selectedGuestDossier.id);
                          setTempNotesInput(selectedGuestDossier.notes || "");
                          setTempVipInput(selectedGuestDossier.isVip);
                        }
                      }}
                      onChange={(e) => setTempNotesInput(e.target.value)}
                      placeholder="Enter front desk internal notes (e.g. VIP guest, requested quiet room, pet details, breakfast preference)..."
                      className="w-full bg-white border border-[#E6D7C3] rounded-xl p-2.5 text-xs text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />

                    {editingGuestNotesId === selectedGuestDossier.id && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingGuestNotesId(null)}
                          className="px-3 py-1.5 rounded-xl border border-[#E6D7C3] text-xs font-bold text-[#523A2A] hover:bg-stone-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            handleSaveGuestOverride(selectedGuestDossier.id, tempNotesInput, tempVipInput);
                            setEditingGuestNotesId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Save Notes & VIP
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stay History Table */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#2C1E15] flex items-center justify-between border-b border-[#E6D7C3]/50 pb-2">
                      <span className="flex items-center gap-1.5">
                        <History className="w-4 h-4 text-[#B8860B]" />
                        <span>Stay & Reservation History ({selectedGuestDossier.bookings.length})</span>
                      </span>
                    </h4>

                    {selectedGuestDossier.bookings.length === 0 ? (
                      <div className="bg-[#FAF7F2] p-4 rounded-xl text-center text-xs text-[#786150] italic border border-[#E6D7C3]/50">
                        No bookings completed yet. This guest submitted an inquiry lead.
                      </div>
                    ) : (
                      <div className="border border-[#E6D7C3] rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF7F2] text-[10px] uppercase font-bold text-[#786150] border-b border-[#E6D7C3]">
                            <tr>
                              <th className="py-2.5 px-3">Ref ID</th>
                              <th className="py-2.5 px-3">Dates</th>
                              <th className="py-2.5 px-3">Unit</th>
                              <th className="py-2.5 px-3">Pax</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6D7C3]/40">
                            {selectedGuestDossier.bookings.map((b) => (
                              <tr key={b.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#2C1E15]">{b.id}</td>
                                <td className="py-2.5 px-3 text-[11px] text-[#523A2A]">
                                  {b.checkInDate} → {b.checkOutDate}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] font-semibold text-[#8B6B10]">
                                  {b.roomTitle || b.roomId}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-[#523A2A]">{(b.adultGuests || 0) + (b.childGuests || 0)} Pax</td>
                                <td className="py-2.5 px-3 font-bold text-xs text-[#B8860B]">₱{(b.grandTotal || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    b.status === "Confirmed" || b.status === "Checked-In"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : b.status === "Completed"
                                      ? "bg-stone-200 text-stone-800"
                                      : b.status === "Cancelled"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedGuestDossier(null);
                                      onOpenVoucher(b);
                                    }}
                                    className="px-2 py-1 rounded bg-[#FAF7F2] border border-[#E6D7C3] hover:bg-stone-200 text-[#2C1E15] text-[10px] font-bold cursor-pointer"
                                  >
                                    Voucher
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 bg-[#FAF7F2] border-t border-[#E6D7C3] flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleInitiateWalkinForGuest(selectedGuestDossier)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Walk-In for this Guest</span>
                  </button>

                  <button
                    onClick={() => setSelectedGuestDossier(null)}
                    className="px-4 py-2 rounded-xl border border-[#E6D7C3] bg-white text-[#2C1E15] hover:bg-[#FAF7F2] text-xs font-bold cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADD GUEST MODAL ================= */}
          {isAddGuestModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E6D7C3] shadow-2xl overflow-hidden my-auto">
                <div className="p-5 bg-[#FAF7F2] border-b border-[#E6D7C3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#B8860B]" />
                    <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Add Guest to Database</h3>
                  </div>
                  <button
                    onClick={() => setIsAddGuestModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white border border-[#E6D7C3] flex items-center justify-center text-gray-500 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddCustomGuest} className="p-5 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                      Guest Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={newGuestForm.fullName}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, fullName: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0917 123 4567"
                        value={newGuestForm.phone}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. maria@gmail.com"
                        value={newGuestForm.email}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                      City / Home Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Quezon City, Metro Manila"
                      value={newGuestForm.address}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, address: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                        ID Type
                      </label>
                      <select
                        value={newGuestForm.idType}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, idType: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                      >
                        <option value="Driver’s License">Driver’s License</option>
                        <option value="Passport">Passport</option>
                        <option value="UMID">UMID</option>
                        <option value="National ID">National ID (PhilSys)</option>
                        <option value="SSS / GSIS">SSS / GSIS</option>
                        <option value="Voter’s ID">Voter’s ID</option>
                        <option value="Senior Citizen ID">Senior Citizen ID</option>
                        <option value="Company / School ID">Company / School ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                        ID Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. N02-12-345678"
                        value={newGuestForm.idNumber}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, idNumber: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#523A2A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newGuestForm.isVip}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, isVip: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Mark as VIP Guest</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#523A2A] uppercase tracking-wider mb-1">
                      Initial Front Desk Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special requests, corporate affiliation, room preferences..."
                      value={newGuestForm.notes}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, notes: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#E6D7C3] rounded-xl p-2.5 text-xs text-[#2C1E15] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6D7C3]/60">
                    <button
                      type="button"
                      onClick={() => setIsAddGuestModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[#E6D7C3] text-xs font-bold text-[#523A2A] hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#A67908] hover:from-[#A67908] hover:to-[#B8860B] text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Save Guest to Database
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: LIVE CHAT (FRONT DESK ⇄ GUEST) */}
      {activeSubTab === 'chat' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-5 rounded-3xl border border-[#E6D7C3]">
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2C1E15] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#B8860B]" />
                <span>Front Desk Live Chat Center</span>
              </h3>
              <p className="text-xs text-[#786150] mt-0.5">
                Real-time two-way guest communication channel for reservations, inquiries, and assistance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsPresetQAModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                title="Add, edit, or customize guest preset questions and automated answers"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
                <span>Preset Q&amp;A / Auto-Replies ({presetQAs.length})</span>
              </button>

              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Front Desk Online (24/7)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Chat Sessions List */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6D7C3] shadow-md p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E6D7C3]/50 pb-2.5 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2C1E15]">
                  Guest Conversations ({chatSessions.length})
                </span>
                {totalUnreadDeskChats > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    {totalUnreadDeskChats} New
                  </span>
                )}
              </div>

              {chatSessions.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#786150] space-y-2">
                  <MessageCircle className="w-8 h-8 text-[#C8B29E] mx-auto" />
                  <p className="font-semibold">No active guest chat sessions yet.</p>
                  <p className="text-[11px] text-[#A08875]">
                    When visitors open the Live Chat widget, their messages will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {chatSessions.map((session) => {
                    const isSelected = activeChatSession?.id === session.id;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setSelectedChatSessionId(session.id);
                          // Mark as read
                          const updated = chatSessions.map((s) =>
                            s.id === session.id ? { ...s, unreadCountForDesk: 0 } : s
                          );
                          setChatSessions(updated);
                          localStorage.setItem('diversion_vigan_live_chat_sessions', JSON.stringify(updated));
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-[#1F140C] text-white border-[#1F140C] shadow-md'
                            : 'bg-[#FAF7F2] text-[#2C1E15] border-[#E6D7C3] hover:border-amber-400 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <strong className="text-xs truncate font-bold">
                              {session.guestName || 'Website Guest'}
                            </strong>
                          </div>
                          <span
                            className={`text-[9.5px] whitespace-nowrap ${
                              isSelected ? 'text-[#E5C158]' : 'text-[#786150]'
                            }`}
                          >
                            {session.lastTimestamp
                              ? new Date(session.lastTimestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>

                        {session.guestPhone && (
                          <span
                            className={`text-[10px] font-mono ${
                              isSelected ? 'text-emerald-300' : 'text-emerald-800'
                            }`}
                          >
                            {session.guestPhone}
                          </span>
                        )}

                        <p
                          className={`text-xs truncate ${
                            isSelected ? 'text-[#E6D7C3]' : 'text-[#523A2A]'
                          }`}
                        >
                          {session.lastMessage || 'Active conversation'}
                        </p>

                        {session.unreadCountForDesk > 0 && (
                          <div className="flex justify-end mt-0.5">
                            <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              {session.unreadCountForDesk} new
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 8 Cols: Active Chat Room */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E6D7C3] shadow-md flex flex-col h-[600px] overflow-hidden">
              {activeChatSession ? (
                <>
                  {/* Chat Room Header */}
                  <div className="bg-[#1F140C] text-white p-4 px-5 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-900/50 border border-[#D4AF37]/40 flex items-center justify-center text-[#E5C158] font-bold text-sm">
                        {activeChatSession.guestName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#FFF2CC]">
                            {activeChatSession.guestName}
                          </h4>
                          <span className="bg-emerald-800/80 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-600/50">
                            Guest Online
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#E6D7C3]/80">
                          {activeChatSession.guestPhone && (
                            <span className="font-mono">{activeChatSession.guestPhone}</span>
                          )}
                          <span>• ID: {activeChatSession.id}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete conversation history for ${activeChatSession.guestName}?`)) {
                          handleDeleteChatSession(activeChatSession.id);
                        }
                      }}
                      className="p-2 text-[#E6D7C3] hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FAF7F2]">
                    <div className="text-center py-1">
                      <span className="text-[10px] text-[#786150] bg-white px-3 py-1 rounded-full border border-[#E6D7C3] shadow-2xs">
                        Direct Desk Transcript • {activeChatSession.guestName}
                      </span>
                    </div>

                    {activeChatSession.messages.map((msg) => {
                      const isDesk = msg.sender === 'front_desk';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isDesk ? 'items-end' : 'items-start'} space-y-0.5`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-[#786150] px-1">
                            {isDesk ? (
                              <>
                                <Headphones className="w-2.5 h-2.5 text-[#B8860B]" />
                                <span className="font-semibold text-amber-950">{msg.senderName} (You)</span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-[#2C1E15]">{activeChatSession.guestName}</span>
                              </>
                            )}
                          </div>

                          <div
                            className={`max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isDesk
                                ? 'bg-[#1F140C] text-[#FFFDF7] rounded-tr-xs border border-[#180F09]'
                                : 'bg-white text-[#2C1E15] rounded-tl-xs border border-[#E6D7C3]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>

                          <div className="flex items-center gap-1 text-[9px] text-[#A08875] px-1">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isDesk && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={adminChatEndRef} />
                  </div>

                  {/* Front Desk Dynamic Custom Quick Responses Bar */}
                  <div className="p-2 px-4 bg-[#F5EBE6] border-t border-[#E6D7C3] overflow-x-auto flex items-center gap-2 shrink-0 no-scrollbar">
                    <span className="text-[10px] font-bold text-[#523A2A] self-center shrink-0 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#B8860B]" />
                      <span>Quick Replies:</span>
                    </span>

                    {/* Manage Preset Q&A Button */}
                    <button
                      type="button"
                      onClick={() => setIsPresetQAModalOpen(true)}
                      className="whitespace-nowrap bg-gradient-to-r from-[#B8860B] to-[#997A15] hover:brightness-110 text-white border border-[#D4AF37]/50 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                      title="Manage guest preset questions and automated replies"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-200" />
                      <span>Preset Q&amp;A ({presetQAs.length})</span>
                    </button>

                    {/* Manage Custom Quick Replies Button */}
                    <button
                      type="button"
                      onClick={() => setIsQuickRepliesModalOpen(true)}
                      className="whitespace-nowrap bg-[#2C1E15] hover:bg-[#1A1009] text-[#FFF2CC] border border-[#D4AF37]/50 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                      title="Add, edit, or customize quick reply templates"
                    >
                      <Sliders className="w-3 h-3 text-[#E5C158]" />
                      <span>Custom Templates ({quickReplies.length})</span>
                    </button>

                    {/* Custom Quick Reply Chips */}
                    {quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendAdminReply(reply)}
                        className="whitespace-nowrap bg-white hover:bg-amber-50 text-[#523A2A] hover:text-[#2C1E15] border border-[#E6D7C3] hover:border-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                        title="Click to send this response immediately"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  {/* Reply Input Bar */}
                  <div className="p-4 bg-white border-t border-[#E6D7C3] shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAdminReply();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        placeholder={`Reply as ${currentUser?.fullName || 'Front Desk'}...`}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600"
                      />
                      <button
                        type="submit"
                        disabled={!adminChatInput.trim()}
                        className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#786150] space-y-3">
                  <MessageCircle className="w-12 h-12 text-[#C8B29E]" />
                  <h4 className="font-serif font-bold text-base text-[#2C1E15]">Select a Guest Conversation</h4>
                  <p className="text-xs text-[#786150] max-w-sm">
                    Choose an active guest chat on the left panel to begin replying as Front Desk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: QUICK WALK-IN REGISTRATION & ROOM MATRIX */}
      {activeSubTab === 'walkin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Walk-in Registration Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 sm:p-7 space-y-5">
              <div className="border-b border-[#E6D7C3]/40 pb-3">
                <h3 className="font-serif font-bold text-xl text-[#2C1E15]">
                  Fast Walk-in Registration
                </h3>
                <p className="text-xs text-[#786150]">
                  Register instant road transit arrivals and generate their key voucher.
                </p>
              </div>

              {walkinSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Walk-in guest successfully registered and checked in!</span>
                </div>
              )}

              <form onSubmit={handleCreateWalkin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Walk-in guest name"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-medium text-[#2C1E15] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    required
                    placeholder="0917 000 0000"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-medium text-[#2C1E15] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Room Assignment</label>
                  <select
                    value={walkinRoomId}
                    onChange={(e) => setWalkinRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-semibold text-[#2C1E15] outline-none"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — ₱{r.pricing.nightly.toLocaleString()}/night ({r.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Nights</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={walkinNights}
                      onChange={(e) => setWalkinNights(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-bold text-[#2C1E15] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2C1E15] mb-1">Payment</label>
                    <select
                      value={walkinPaymentOption}
                      onChange={(e) => setWalkinPaymentOption(e.target.value as 'full' | 'partial_40')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-[#FDFBF7] text-xs font-semibold text-[#2C1E15] outline-none"
                    >
                      <option value="full">100% Full Cash</option>
                      <option value="partial_40">40% Downpayment</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!currentPermissions.canWalkin}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                    currentPermissions.canWalkin
                      ? 'bg-[#2C1E15] hover:bg-[#523A2A] text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm Walk-In & Check-In
                </button>
              </form>
            </div>

            {/* Room Availability Matrix with Grid & Table View Option */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E6D7C3]/70 shadow-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E6D7C3]/40 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Room Inventory Matrix</h3>
                  <p className="text-xs text-[#786150]">Click any unit to auto-assign into the walk-in registration</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-[#F5EBE6] p-1 rounded-xl border border-[#E6D7C3]/60">
                  <button
                    type="button"
                    onClick={() => setWalkinViewMode('grid')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      walkinViewMode === 'grid'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkinViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      walkinViewMode === 'table'
                        ? 'bg-[#2C1E15] text-white shadow-sm'
                        : 'text-[#523A2A] hover:bg-white/60'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>
              </div>

              {walkinViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                  {rooms.map((r) => {
                    const isSelected = walkinRoomId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setWalkinRoomId(r.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-600/30'
                            : 'bg-[#FDFBF7] border-[#E6D7C3] hover:border-amber-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              {r.category}
                            </span>
                            <span className="font-mono font-bold text-xs text-emerald-800">
                              ₱{r.pricing.nightly.toLocaleString()}/night
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-[#2C1E15] leading-snug">{r.title}</h4>
                          <p className="text-[11px] text-[#786150] line-clamp-1">{r.beds}</p>
                          <div className="text-[10px] text-[#786150]">
                            Max {r.capacity.maxGuests} Guests • {r.capacity.recommended}
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between border-t border-[#E6D7C3]/40">
                          <span className="text-[11px] font-semibold text-emerald-700">Available Instant Key</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            isSelected ? 'bg-amber-600 text-white' : 'bg-white text-[#2C1E15] border border-[#E6D7C3]'
                          }`}>
                            {isSelected ? 'Selected' : 'Select Unit'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#E6D7C3]/60 max-h-[520px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F5EBE6] text-[#2C1E15] font-bold uppercase tracking-wider border-b border-[#E6D7C3]/60 text-[10px] sticky top-0">
                        <th className="py-2.5 px-3">Room / Unit</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Capacity</th>
                        <th className="py-2.5 px-3">Nightly Rate</th>
                        <th className="py-2.5 px-3 text-right">Assign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6D7C3]/40 bg-white">
                      {rooms.map((r) => {
                        const isSelected = walkinRoomId === r.id;
                        return (
                          <tr
                            key={r.id}
                            onClick={() => setWalkinRoomId(r.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-50/80 font-bold' : 'hover:bg-[#FDFBF7]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#2C1E15]">{r.title}</div>
                              <div className="text-[10px] text-[#786150] font-normal">{r.beds}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] bg-[#F5EBE6] text-[#2C1E15] px-2 py-0.5 rounded font-semibold">
                                {r.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#786150]">
                              Max {r.capacity.maxGuests} pax
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                              ₱{r.pricing.nightly.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWalkinRoomId(r.id);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  isSelected
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-[#F5EBE6] hover:bg-[#E6D7C3] text-[#2C1E15]'
                                }`}
                              >
                                {isSelected ? 'Assigned' : 'Assign'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REVIEW SCREENING MODAL */}
      {screeningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-3xl w-full border-2 border-amber-500 shadow-2xl overflow-hidden flex flex-col my-auto text-[#2C211A] max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-900 to-[#2C1E15] text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-amber-300" />
                <div>
                  <span className="font-serif font-bold text-base block">Deposit Slip Screening Verification</span>
                  <span className="text-[11px] text-amber-200 font-mono">Ref: {screeningBooking.id}</span>
                </div>
              </div>
              <button
                onClick={() => setScreeningBooking(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Split: Slip Preview on Left, Verification on Right */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Left: Slip Preview */}
              <div className="space-y-3">
                <label className="block font-bold text-[#2C1E15] uppercase text-[10px] tracking-wider">
                  Uploaded Payment Slip Image
                </label>
                {screeningBooking.paymentSlipUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E6D7C3] bg-black/10 aspect-[3/4] flex items-center justify-center group">
                    <img 
                      src={screeningBooking.paymentSlipUrl} 
                      alt="Slip Zoom" 
                      className="w-full h-full object-contain" 
                    />
                    <button
                      type="button"
                      onClick={() => onOpenSlipLightbox(screeningBooking)}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom View</span>
                    </button>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                    No image file uploaded
                  </div>
                )}
              </div>

              {/* Right: Verification Checklist */}
              <div className="space-y-4">
                
                {/* Booking Snapshot */}
                <div className="bg-white p-4 rounded-2xl border border-[#E6D7C3] space-y-2">
                  <div className="font-bold text-sm text-[#2C1E15] border-b border-[#E6D7C3]/50 pb-1.5">
                    {screeningBooking.guestName}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786150]">Phone Contact:</span>
                    <strong className="font-mono text-[#2C1E15]">{screeningBooking.guestPhone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786150]">Reserved Room:</span>
                    <span className="font-semibold text-[#2C1E15]">{screeningBooking.roomTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786150]">Total Stay Cost:</span>
                    <strong className="text-[#2C1E15]">₱{screeningBooking.grandTotal.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <span className="text-emerald-900 font-bold">Deposit to Verify:</span>
                    <strong className="text-emerald-900 font-mono text-sm font-bold">
                      ₱{screeningBooking.amountPaidNow.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Screening Verification Checklist */}
                <div className="space-y-2.5">
                  <label className="block font-bold text-[#2C1E15] uppercase text-[10px] tracking-wider">
                    Staff Verification Checks
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E6D7C3] bg-white hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkImageVerified}
                      onChange={(e) => setCheckImageVerified(e.target.checked)}
                      className="mt-0.5 rounded text-amber-800"
                    />
                    <div>
                      <span className="font-bold text-[#2C1E15] block text-[11px]">Legitimate & Clear Slip</span>
                      <span className="text-[10px] text-[#786150]">Confirmed transaction receipt timestamp & merchant details.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E6D7C3] bg-white hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAmountVerified}
                      onChange={(e) => setCheckAmountVerified(e.target.checked)}
                      className="mt-0.5 rounded text-amber-800"
                    />
                    <div>
                      <span className="font-bold text-[#2C1E15] block text-[11px]">Deposit Amount Matches (₱{screeningBooking.amountPaidNow.toLocaleString()})</span>
                      <span className="text-[10px] text-[#786150]">Correct downpayment or full payment received.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E6D7C3] bg-white hover:bg-amber-50/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkRefNumberVerified}
                      onChange={(e) => setCheckRefNumberVerified(e.target.checked)}
                      className="mt-0.5 rounded text-amber-800"
                    />
                    <div>
                      <span className="font-bold text-[#2C1E15] block text-[11px]">Ref / Trans ID Match</span>
                      <span className="text-[10px] text-[#786150]">Cross-checked with GCash or bank merchant notifications.</span>
                    </div>
                  </label>
                </div>

                {/* Staff Confirmation Remarks */}
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Approval Notes / Receipt Log</label>
                  <input
                    type="text"
                    value={screeningStaffNotes}
                    onChange={(e) => setScreeningStaffNotes(e.target.value)}
                    placeholder="e.g. GCash Ref verified, 40% downpayment posted"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                  />
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#F5EBE6] p-4 px-6 border-t border-[#E6D7C3] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleRejectScreening('Deposit slip rejected during screening verification.')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject & Void</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreeningBooking(null)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleApproveScreening}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Confirm Booking</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-lg w-full border-2 border-rose-300 shadow-2xl overflow-hidden flex flex-col my-auto text-[#2C211A]">
            
            <div className="bg-rose-700 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-200" />
                <span className="font-serif font-bold text-base">Cancel Reservation</span>
              </div>
              <button
                onClick={() => setBookingToCancel(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Release Dates & Void Reservation</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Cancelling booking <strong className="font-mono">{bookingToCancel.id}</strong> ({bookingToCancel.guestName}) will void this voucher and immediately open the reserved dates for other guests on the availability calendar.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E6D7C3] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#786150]">Reserved Room:</span>
                  <strong className="text-[#2C1E15]">{bookingToCancel.roomTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">Dates:</span>
                  <span className="font-medium text-[#2C1E15]">
                    {bookingToCancel.stayType === 'nightly'
                      ? `${bookingToCancel.checkInDate} to ${bookingToCancel.checkOutDate}`
                      : `${bookingToCancel.hourlyDate} (${bookingToCancel.hourlyDurationHours} hrs)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786150]">Paid Amount:</span>
                  <strong className="text-emerald-700">₱{bookingToCancel.amountPaidNow.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1.5">
                  Cancellation Reason
                </label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-semibold text-[#2C1E15] outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Guest Requested Cancellation">Guest Requested Cancellation</option>
                  <option value="Deposit Slip Rejected / Unverified">Deposit Slip Rejected / Unverified</option>
                  <option value="Guest No-Show">Guest No-Show / Did Not Arrive</option>
                  <option value="Rescheduled / Date Changed">Rescheduled / Date Changed</option>
                  <option value="Severe Weather / Force Majeure">Severe Weather / Force Majeure</option>
                  <option value="Duplicate Reservation">Duplicate Reservation</option>
                  <option value="Other Operational Reason">Other Operational Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E15] mb-1.5">
                  Refund Status & Policy Remarks
                </label>
                <textarea
                  rows={2}
                  value={cancelRefundNotes}
                  onChange={(e) => setCancelRefundNotes(e.target.value)}
                  placeholder="e.g. 40% downpayment forfeited as per policy, or refund processed via GCash #..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="bg-[#F5EBE6] p-4 px-6 border-t border-[#E6D7C3] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => {
                  const combinedNote = `[CANCELLED] ${cancelReasonPreset}${cancelRefundNotes ? ` — ${cancelRefundNotes}` : ''}`;
                  onUpdateBookingStatus(bookingToCancel.id, 'Cancelled', combinedNote);
                  setBookingToCancel(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Cancellation</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW CANCELLATION DETAILS MODAL */}
      {viewingCancellationBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-md w-full border border-rose-300 shadow-2xl overflow-hidden flex flex-col my-auto text-[#2C211A]">
            <div className="bg-rose-800 text-white p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-300" />
                <span className="font-serif font-bold text-base">Cancellation Audit Log</span>
              </div>
              <button
                onClick={() => setViewingCancellationBooking(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E6D7C3] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#786150]">Booking Reference:</span>
                  <strong className="font-mono text-[#2C1E15]">{viewingCancellationBooking.id}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#786150]">Guest:</span>
                  <strong className="text-[#2C1E15]">{viewingCancellationBooking.guestName}</strong>
                </div>
                {viewingCancellationBooking.cancelledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#786150]">Cancelled On:</span>
                    <span className="text-[#2C1E15]">{new Date(viewingCancellationBooking.cancelledAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#786150] uppercase tracking-wider block">
                  Recorded Cancellation Reason & Remarks
                </label>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs leading-relaxed font-medium">
                  {viewingCancellationBooking.cancellationReason || viewingCancellationBooking.staffNotes || 'No specific reason recorded.'}
                </div>
              </div>
            </div>

            <div className="bg-[#F5EBE6] p-4 px-6 border-t border-[#E6D7C3] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onUpdateBookingStatus(viewingCancellationBooking.id, 'Confirmed', 'Reinstated and re-confirmed by front desk.');
                  setViewingCancellationBooking(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Booking</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingCancellationBooking(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-[#2C1E15] text-xs font-bold rounded-xl border border-[#E6D7C3] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM LIVE CHAT QUICK REPLIES MANAGER */}
      {isQuickRepliesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-xl w-full border-2 border-[#E6D7C3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#1F140C] text-white p-4 px-6 flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#E5C158]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#FFF2CC]">
                    Custom Live Chat Quick Replies
                  </h3>
                  <p className="text-[11px] text-[#E6D7C3]/80">
                    Create, edit, and organize front desk response shortcuts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsQuickRepliesModalOpen(false);
                  setEditingQuickReplyIndex(null);
                }}
                className="p-1.5 text-[#E6D7C3] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Add New Quick Reply Form */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6D7C3] shadow-xs space-y-2.5">
                <label className="block text-xs font-bold text-[#2C1E15]">
                  + Add New Quick Reply Template
                </label>
                <form onSubmit={handleAddQuickReply} className="flex gap-2">
                  <input
                    type="text"
                    value={newQuickReplyText}
                    onChange={(e) => setNewQuickReplyText(e.target.value)}
                    placeholder="e.g., Free high-speed WiFi is available throughout the property."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="submit"
                    disabled={!newQuickReplyText.trim()}
                    className="bg-[#2C1E15] hover:bg-[#1A1009] disabled:opacity-40 text-[#FFF2CC] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#E5C158]" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* List of Current Quick Replies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2C1E15]">
                    Active Templates ({quickReplies.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetQuickReplies}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                    title="Restore default front desk templates"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>

                {quickReplies.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#786150] bg-white rounded-2xl border border-[#E6D7C3]">
                    No custom quick replies yet. Add one above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {quickReplies.map((reply, idx) => {
                      const isEditing = editingQuickReplyIndex === idx;

                      if (isEditing) {
                        return (
                          <div
                            key={idx}
                            className="bg-amber-50/60 p-3 rounded-2xl border border-amber-300 space-y-2"
                          >
                            <input
                              type="text"
                              value={editingQuickReplyText}
                              onChange={(e) => setEditingQuickReplyText(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-[#2C1E15] outline-none"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingQuickReplyIndex(null)}
                                className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuickReply(idx)}
                                className="px-3 py-1 bg-[#2C1E15] text-[#FFF2CC] rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="p-3 px-3.5 rounded-2xl bg-white border border-[#E6D7C3] flex items-center justify-between gap-3 group hover:border-amber-400 transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E6D7C3] flex items-center justify-center text-[10px] font-bold text-[#786150] shrink-0 font-mono">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-[#2C1E15] font-medium truncate">
                              {reply}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuickReplyIndex(idx);
                                setEditingQuickReplyText(reply);
                              }}
                              className="p-1.5 text-[#786150] hover:text-[#2C1E15] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
                              title="Edit reply"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuickReply(idx)}
                              className="p-1.5 text-[#786150] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF7F2] p-4 px-6 border-t border-[#E6D7C3] flex items-center justify-between">
              <span className="text-[11px] text-[#786150]">
                Changes save automatically to Front Desk storage.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsQuickRepliesModalOpen(false);
                  setEditingQuickReplyIndex(null);
                }}
                className="bg-[#2C1E15] hover:bg-[#1A1009] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Questions & Automated Answers Modal */}
      {isPresetQAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E6D7C3] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 my-auto overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#1F140C] text-white p-5 px-6 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#E5C158]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#FFF2CC]">
                    Custom Preset Q&amp;A &amp; Auto-Replies
                  </h3>
                  <p className="text-xs text-[#E6D7C3]/80">
                    Customize guest quick suggestion chips and automated Front Desk answers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPresetQAModalOpen(false);
                  setEditingQAId(null);
                }}
                className="p-1.5 text-[#E6D7C3] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FAF7F2]">
              
              {/* Add New Preset Q&A Form */}
              <div className="bg-white p-5 rounded-2xl border border-[#E6D7C3] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E6D7C3]/60 pb-2">
                  <span className="text-xs font-bold text-[#2C1E15] flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#B8860B]" />
                    <span>Add New Custom Preset Question &amp; Automated Answer</span>
                  </span>
                  <span className="text-[10px] text-[#786150] font-medium">Front Desk Auto-Responder</span>
                </div>

                <form onSubmit={handleAddPresetQA} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#2C1E15] mb-1">
                        Preset Question / Chip Label <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newQAQuestion}
                        onChange={(e) => setNewQAQuestion(e.target.value)}
                        placeholder="e.g. Do you have free Wi-Fi?"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#2C1E15] mb-1">
                        Trigger Keywords <span className="text-[#786150] font-normal">(Comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={newQAKeywords}
                        onChange={(e) => setNewQAKeywords(e.target.value)}
                        placeholder="e.g. wifi, internet, password, connection"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2C1E15] mb-1">
                      Automated Front Desk Answer <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={newQAAnswer}
                      onChange={(e) => setNewQAAnswer(e.target.value)}
                      placeholder="e.g. Yes! High-speed Fiber Wi-Fi is complimentary for all guests across the property."
                      className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs text-[#2C1E15] outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#2C1E15]">
                      <input
                        type="checkbox"
                        checked={newQAShowAsChip}
                        onChange={(e) => setNewQAShowAsChip(e.target.checked)}
                        className="w-4 h-4 rounded border-[#C8B29E] text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>Show as Quick Suggestion Chip in Guest Live Chat Widget</span>
                    </label>

                    <button
                      type="submit"
                      disabled={!newQAQuestion.trim() || !newQAAnswer.trim()}
                      className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Preset Q&amp;A</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of Active Preset Q&As */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2C1E15]">
                    Active Preset Questions &amp; Auto-Answers ({presetQAs.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetPresetQAs}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                    title="Restore default hotel FAQs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>

                {presetQAs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#786150] bg-white rounded-2xl border border-[#E6D7C3]">
                    No preset questions added yet. Add one above!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {presetQAs.map((item) => {
                      const isEditing = editingQAId === item.id;

                      if (isEditing) {
                        return (
                          <div
                            key={item.id}
                            className="bg-amber-50/70 p-4 rounded-2xl border border-amber-300 space-y-3 shadow-2xs"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">
                                  Question / Chip Label
                                </label>
                                <input
                                  type="text"
                                  value={editQAQuestion}
                                  onChange={(e) => setEditQAQuestion(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">
                                  Trigger Keywords
                                </label>
                                <input
                                  type="text"
                                  value={editQAKeywords}
                                  onChange={(e) => setEditQAKeywords(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#2C1E15] mb-0.5">
                                Automated Front Desk Answer
                              </label>
                              <textarea
                                rows={2}
                                value={editQAAnswer}
                                onChange={(e) => setEditQAAnswer(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs text-[#2C1E15] outline-none resize-none"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#2C1E15]">
                                <input
                                  type="checkbox"
                                  checked={editQAShowAsChip}
                                  onChange={(e) => setEditQAShowAsChip(e.target.checked)}
                                  className="w-4 h-4 rounded border-[#C8B29E] text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>Show as Quick Chip</span>
                              </label>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingQAId(null)}
                                  className="px-3 py-1 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePresetQA(item.id)}
                                  className="bg-[#2C1E15] hover:bg-[#1A1009] text-white px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          className="bg-white p-3.5 rounded-2xl border border-[#E6D7C3] hover:border-amber-400/80 transition-all shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#2C1E15]">
                                  {item.question}
                                </span>
                                {item.showAsChip ? (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider">
                                    Quick Chip
                                  </span>
                                ) : (
                                  <span className="bg-stone-100 text-stone-600 border border-stone-200 text-[9px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider">
                                    Trigger Keyword
                                  </span>
                                )}
                              </div>
                              {item.keywords && (
                                <p className="text-[10px] text-[#786150]">
                                  <strong className="font-semibold text-[#523A2A]">Keywords:</strong> {item.keywords}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditPresetQA(item)}
                                className="p-1.5 text-[#786150] hover:text-[#2C1E15] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer"
                                title="Edit Preset Q&A"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePresetQA(item.id)}
                                className="p-1.5 text-[#786150] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Preset Q&A"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E6D7C3]/60 text-xs text-[#3D2616] leading-relaxed whitespace-pre-wrap">
                            {item.answer}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF7F2] p-4 px-6 border-t border-[#E6D7C3] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#786150]">
                Changes sync automatically to guest live chat in real time.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsPresetQAModalOpen(false);
                  setEditingQAId(null);
                }}
                className="bg-[#2C1E15] hover:bg-[#1A1009] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. EDIT GUEST PROFILE MODAL */}
      {/* ========================================================================= */}
      {editingGuestProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E6D7C3] shadow-2xl overflow-hidden my-auto">
            <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#E6D7C3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-[#B8860B]" />
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2C1E15]">
                  Edit Guest Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuestProfile(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setGuestOverrides((prev) => ({
                  ...prev,
                  [editingGuestProfile.id]: {
                    fullName: editingGuestProfile.fullName,
                    phone: editingGuestProfile.phone,
                    email: editingGuestProfile.email,
                    address: editingGuestProfile.address,
                    idType: editingGuestProfile.idType,
                    idNumber: editingGuestProfile.idNumber,
                    isVip: editingGuestProfile.isVip,
                    notes: editingGuestProfile.notes,
                  },
                }));
                setGuestToastMessage(`Guest profile for ${editingGuestProfile.fullName} updated.`);
                setEditingGuestProfile(null);
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Full Guest Name *</label>
                  <input
                    type="text"
                    required
                    value={editingGuestProfile.fullName}
                    onChange={(e) =>
                      setEditingGuestProfile({ ...editingGuestProfile, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingGuestProfile.phone}
                    onChange={(e) =>
                      setEditingGuestProfile({ ...editingGuestProfile, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingGuestProfile.email || ''}
                    onChange={(e) =>
                      setEditingGuestProfile({ ...editingGuestProfile, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Home / Office Address</label>
                  <input
                    type="text"
                    value={editingGuestProfile.address || ''}
                    onChange={(e) =>
                      setEditingGuestProfile({ ...editingGuestProfile, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Valid Identification Type</label>
                  <select
                    value={editingGuestProfile.idType || "Driver’s License"}
                    onChange={(e) =>
                      setEditingGuestProfile({ ...editingGuestProfile, idType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="Driver’s License">Driver’s License</option>
                    <option value="Passport">Passport</option>
                    <option value="SSS / UMID">SSS / UMID</option>
                    <option value="National ID (PhilSys)">National ID (PhilSys)</option>
                    <option value="Voter’s ID">Voter’s ID</option>
                    <option value="PRC License">PRC License</option>
                    <option value="Company / Student ID">Company / Student ID</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">ID Card Number</label>
                  <input
                    type="text"
                    value={editingGuestProfile.idNumber || ''}
                    onChange={(e) =>
                      setEditingGuestProfile({ ...editingGuestProfile, idNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block text-xs">Priority VIP Guest</span>
                  <span className="text-[10px] text-amber-700">Grants priority guest status on Front Desk dashboard</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!editingGuestProfile.isVip}
                  onChange={(e) =>
                    setEditingGuestProfile({ ...editingGuestProfile, isVip: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2C1E15] mb-1">Front Desk VIP / CRM Notes</label>
                <textarea
                  rows={3}
                  value={editingGuestProfile.notes || ''}
                  onChange={(e) =>
                    setEditingGuestProfile({ ...editingGuestProfile, notes: e.target.value })
                  }
                  placeholder="Preferences, special requests, remarks..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6D7C3]">
                <button
                  type="button"
                  onClick={() => setEditingGuestProfile(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DELETE GUEST PROFILE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingGuestProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 text-center space-y-4 my-auto">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Delete Guest Profile?</h3>
              <p className="text-xs text-[#786150] mt-1 leading-relaxed">
                Are you sure you want to remove <strong className="text-[#2C1E15]">{deletingGuestProfile.fullName}</strong> ({deletingGuestProfile.phone}) from the Front Desk Guest Directory?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGuestProfile(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeletedGuestIds((prev) => [...prev, deletingGuestProfile.id]);
                  setGuestToastMessage(`Guest record for ${deletingGuestProfile.fullName} deleted.`);
                  setDeletingGuestProfile(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT BOOKING RECORD MODAL */}
      {/* ========================================================================= */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E6D7C3] shadow-2xl overflow-hidden my-auto">
            <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#E6D7C3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-[#B8860B]" />
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2C1E15]">
                    Edit Reservation Record
                  </h3>
                  <span className="font-mono text-xs font-bold text-[#8B6B10]">
                    Ref: {editingBooking.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onEditBooking) {
                  onEditBooking(editingBooking);
                } else {
                  onUpdateBookingStatus(editingBooking.id, editingBooking.status, editingBooking.staffNotes);
                }
                setEditingBooking(null);
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs"
            >
              {/* Guest Details */}
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6D7C3]/60 space-y-3">
                <span className="font-bold text-[#8B6B10] uppercase tracking-wider text-[10px] block">Guest Contact Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Guest Name *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.guestName}
                      onChange={(e) => setEditingBooking({ ...editingBooking, guestName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Guest Phone *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.guestPhone}
                      onChange={(e) => setEditingBooking({ ...editingBooking, guestPhone: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Guest Email</label>
                    <input
                      type="email"
                      value={editingBooking.guestEmail || ''}
                      onChange={(e) => setEditingBooking({ ...editingBooking, guestEmail: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Room & Stay Dates */}
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6D7C3]/60 space-y-3">
                <span className="font-bold text-[#8B6B10] uppercase tracking-wider text-[10px] block">Accommodation &amp; Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Room / Unit Title *</label>
                    <input
                      type="text"
                      required
                      value={editingBooking.roomTitle}
                      onChange={(e) => setEditingBooking({ ...editingBooking, roomTitle: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Booking Status *</label>
                    <select
                      value={editingBooking.status}
                      onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value as BookingStatus })}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-[#2C1E15] outline-none"
                    >
                      <option value="Pending Slip Review">Pending Slip Review</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Checked-In">Checked-In</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {editingBooking.stayType === 'nightly' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[#2C1E15] mb-1">Check-In Date</label>
                      <input
                        type="date"
                        value={editingBooking.checkInDate || ''}
                        onChange={(e) => setEditingBooking({ ...editingBooking, checkInDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#2C1E15] mb-1">Check-Out Date</label>
                      <input
                        type="date"
                        value={editingBooking.checkOutDate || ''}
                        onChange={(e) => setEditingBooking({ ...editingBooking, checkOutDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#2C1E15] mb-1">Nights Count</label>
                      <input
                        type="number"
                        min={1}
                        value={editingBooking.numberOfNights || 1}
                        onChange={(e) => setEditingBooking({ ...editingBooking, numberOfNights: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#2C1E15] mb-1">Hourly Date</label>
                      <input
                        type="date"
                        value={editingBooking.hourlyDate || ''}
                        onChange={(e) => setEditingBooking({ ...editingBooking, hourlyDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#2C1E15] mb-1">Start Time</label>
                      <input
                        type="text"
                        value={editingBooking.hourlyStartTime || ''}
                        onChange={(e) => setEditingBooking({ ...editingBooking, hourlyStartTime: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Financials & Amounts */}
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6D7C3]/60 space-y-3">
                <span className="font-bold text-[#8B6B10] uppercase tracking-wider text-[10px] block">Financial Breakdown</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Grand Total (₱)</label>
                    <input
                      type="number"
                      value={editingBooking.grandTotal}
                      onChange={(e) => {
                        const gt = Number(e.target.value);
                        const rem = Math.max(0, gt - (editingBooking.amountPaidNow || 0));
                        setEditingBooking({ ...editingBooking, grandTotal: gt, remainingBalance: rem });
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Amount Paid Now (₱)</label>
                    <input
                      type="number"
                      value={editingBooking.amountPaidNow}
                      onChange={(e) => {
                        const paid = Number(e.target.value);
                        const rem = Math.max(0, (editingBooking.grandTotal || 0) - paid);
                        setEditingBooking({ ...editingBooking, amountPaidNow: paid, remainingBalance: rem });
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-emerald-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#2C1E15] mb-1">Remaining Balance (₱)</label>
                    <input
                      type="number"
                      value={editingBooking.remainingBalance}
                      onChange={(e) => setEditingBooking({ ...editingBooking, remainingBalance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E6D7C3] bg-white text-xs font-bold text-amber-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2C1E15] mb-1">Staff Notes &amp; Remarks</label>
                <textarea
                  rows={2}
                  value={editingBooking.staffNotes || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, staffNotes: e.target.value })}
                  placeholder="Front desk internal remarks..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6D7C3]">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Save Booking Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE BOOKING RECORD CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 text-center space-y-4 my-auto">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Permanently Delete Booking?</h3>
              <p className="text-xs text-[#786150] mt-1 leading-relaxed">
                Are you sure you want to permanently delete reservation <strong className="font-mono text-[#2C1E15]">{deletingBooking.id}</strong> for <strong className="text-[#2C1E15]">{deletingBooking.guestName}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBooking) {
                    onDeleteBooking(deletingBooking.id);
                  } else {
                    onUpdateBookingStatus(deletingBooking.id, 'Cancelled', 'Permanently deleted by Front Desk');
                  }
                  setDeletingBooking(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EDIT INQUIRY MODAL */}
      {/* ========================================================================= */}
      {editingInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E6D7C3] shadow-2xl overflow-hidden my-auto">
            <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#E6D7C3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-[#B8860B]" />
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2C1E15]">
                  Edit Guest Inquiry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingInquiry(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onEditInquiry) {
                  onEditInquiry(editingInquiry);
                } else {
                  try {
                    const saved = JSON.parse(localStorage.getItem('diversion_vigan_inquiries') || '[]');
                    const updatedList = saved.map((i: InquiryRecord) => (i.id === editingInquiry.id ? editingInquiry : i));
                    localStorage.setItem('diversion_vigan_inquiries', JSON.stringify(updatedList));
                  } catch {}
                }
                setEditingInquiry(null);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingInquiry.fullName}
                    onChange={(e) => setEditingInquiry({ ...editingInquiry, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editingInquiry.phone}
                    onChange={(e) => setEditingInquiry({ ...editingInquiry, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingInquiry.email || ''}
                    onChange={(e) => setEditingInquiry({ ...editingInquiry, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Status</label>
                  <select
                    value={editingInquiry.status || 'New'}
                    onChange={(e) => setEditingInquiry({ ...editingInquiry, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs font-bold outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Replied">Replied</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Room / Accommodation Interest</label>
                  <input
                    type="text"
                    value={editingInquiry.roomInterest || ''}
                    onChange={(e) => setEditingInquiry({ ...editingInquiry, roomInterest: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2C1E15] mb-1">Target Stay Dates</label>
                  <input
                    type="text"
                    value={editingInquiry.targetDates || ''}
                    onChange={(e) => setEditingInquiry({ ...editingInquiry, targetDates: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2C1E15] mb-1">Inquiry Message</label>
                <textarea
                  rows={3}
                  value={editingInquiry.message || ''}
                  onChange={(e) => setEditingInquiry({ ...editingInquiry, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6D7C3] bg-[#FAF7F2] text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6D7C3]">
                <button
                  type="button"
                  onClick={() => setEditingInquiry(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Save Inquiry Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DELETE INQUIRY CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 text-center space-y-4 my-auto">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C1E15]">Delete Guest Inquiry?</h3>
              <p className="text-xs text-[#786150] mt-1 leading-relaxed">
                Are you sure you want to delete inquiry from <strong className="text-[#2C1E15]">{deletingInquiry.fullName}</strong> ({deletingInquiry.phone})?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingInquiry(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteInquiry) {
                    onDeleteInquiry(deletingInquiry.id);
                  } else {
                    try {
                      const saved = JSON.parse(localStorage.getItem('diversion_vigan_inquiries') || '[]');
                      const filtered = saved.filter((i: InquiryRecord) => i.id !== deletingInquiry.id);
                      localStorage.setItem('diversion_vigan_inquiries', JSON.stringify(filtered));
                    } catch {}
                  }
                  setDeletingInquiry(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
