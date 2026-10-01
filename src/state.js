import { getWebXdcIdentity } from './webxdc.js';

export const state = {
  // Current user identity
  identity: getWebXdcIdentity(),
  // Array of active events created or synced
  events: [],
  // ID of currently selected event to view/RSVP
  selectedEventId: null,
  // Main view state: 'events_list' | 'create_event' | 'event_view'
  currentView: 'events_list',
  // Map of eventId -> { [userAddr]: { userAddr, userName, slots: { [slotId]: 'yes'|'maybe'|'no' }, updatedAt } }
  availabilities: {},
  // Received WebXDC Updates
  updates: [],
  // Event Detail View Tabs: 'your_availability' | 'group_availability' | 'top_times' | 'participants'
  activeView: 'your_availability',
  // Create Event Form State
  createForm: {
    title: '',
    dateMode: 'dates', // 'dates' | 'days'
    selectedDates: ['2026-09-17', '2026-09-18', '2026-09-19'],
    selectedDays: ['Mon', 'Wed', 'Sat'],
    currentYear: 2026,
    currentMonth: 8, // September (0-indexed)
    startMinutes: 540, // 9:00 AM
    endMinutes: 1020, // 5:00 PM
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran',
    firstDayOfWeekIndex: 0 // 0: Sun, 1: Mon, ..., 6: Sat
  },
  // Paint brush state for setting availability: 'yes' | 'maybe' | 'no'
  currentBrush: 'yes',
  // Active slot details modal
  modalSlotId: null,
  // Pending confirm pick final slot
  pendingConfirmFinalSlotId: null,
  // Unsubmitted availability tracking & pending navigation warning
  hasUnsubmittedChanges: false,
  pendingNavigationAction: null,
  baselineAvailability: null,
  baselineIdentityName: undefined,
  pendingDeepLinkEventId: null,
  // Pending delete confirmation
  pendingDeleteEventId: null,
  // Event ID for which submit succeeded (shows "Submitted!" label temporarily)
  submitSuccessEventId: null
};

// All Possible World Timezones (Dynamic via Intl or Fallback)
export let ALL_TIMEZONES = [];
try {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');
  }
} catch (e) {
  // fallback
}

if (!ALL_TIMEZONES || ALL_TIMEZONES.length === 0) {
  ALL_TIMEZONES = [
    'UTC', 'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
    'Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
    'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Caracas',
    'America/Chicago', 'America/Denver', 'America/Guatemala', 'America/Havana', 'America/Lima',
    'America/Los_Angeles', 'America/Mexico_City', 'America/New_York', 'America/Phoenix',
    'America/Santiago', 'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
    'Asia/Almaty', 'Asia/Amman', 'Asia/Baghdad', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Beirut',
    'Asia/Dhaka', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Istanbul', 'Asia/Jakarta', 'Asia/Jerusalem',
    'Asia/Kabul', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Kuwait',
    'Asia/Manila', 'Asia/Muscat', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore',
    'Asia/Tashkent', 'Asia/Tbilisi', 'Asia/Tehran', 'Asia/Tokyo', 'Asia/Yerevan',
    'Atlantic/Azores', 'Atlantic/Cape_Verde', 'Atlantic/Reykjavik', 'Australia/Adelaide',
    'Australia/Brisbane', 'Australia/Darwin', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
    'Europe/Amsterdam', 'Europe/Athens', 'Europe/Belgrade', 'Europe/Berlin', 'Europe/Brussels',
    'Europe/Bucharest', 'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Helsinki',
    'Europe/Istanbul', 'Europe/Kiev', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid',
    'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Rome', 'Europe/Stockholm',
    'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich', 'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu'
  ];
}
