import { state } from './state.js';

// Helper Functions
export function updateCellDOM(cell, slotState) {
  if (!cell) return;
  cell.classList.remove('bg-white', 'bg-[#101214]', 'bg-[#2D2D2D]', 'bg-[#F79E00]', 'bg-[#38BDF8]', 'text-black', 'font-black');
  if (slotState === 'yes') {
    cell.classList.add('bg-[#F79E00]', 'text-black', 'font-black');
  } else if (slotState === 'maybe') {
    cell.classList.add('bg-[#38BDF8]', 'text-black', 'font-black');
  } else {
    cell.classList.add('bg-[#2D2D2D]');
  }
}

export function parseMinutes(timeStr) {
  if (!timeStr) return 540;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutesTo24H(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatMinutesTo12H(mins) {
  const totalHours = Math.floor(mins / 60);
  const m = mins % 60;
  const normalizedHour = totalHours % 24;
  const ampm = normalizedHour >= 12 ? 'PM' : 'AM';
  let h = normalizedHour % 12;
  if (h === 0) h = 12;
  const mStr = m === 0 ? '00' : String(m).padStart(2, '0');
  return `${h}:${mStr} ${ampm}`;
}

export function formatDateDisplay(dateStr) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[month]}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

export function getDayShortLabel(dateStr) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[month]}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

export function getDayOfWeekLabel(dateStr) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
  } catch (e) {
    // fallback
  }
  return '';
}

export function getActiveEvent() {
  if (state.selectedEventId) {
    const found = state.events.find((e) => e.id === state.selectedEventId);
    if (found) return found;
  }
  return state.events[0] || null;
}

// Storage Helpers
export function loadPersistedState() {
  try {
    const evts = localStorage.getItem('crabfit_events_v3');
    if (evts) {
      state.events = JSON.parse(evts);
    } else {
      const oldEvt = localStorage.getItem('crabfit_event_v2');
      if (oldEvt) {
        state.events = [JSON.parse(oldEvt)];
      }
    }

    const av = localStorage.getItem('crabfit_availabilities_v3');
    if (av) {
      state.availabilities = JSON.parse(av);
    } else {
      const oldAv = localStorage.getItem('crabfit_availabilities_v2');
      if (oldAv && state.events[0]) {
        state.availabilities[state.events[0].id] = JSON.parse(oldAv);
      }
    }

    const selId = localStorage.getItem('crabfit_selected_event_id');
    if (selId) state.selectedEventId = selId;
    const view = localStorage.getItem('crabfit_current_view');
    if (view) state.currentView = view;
  } catch (e) {
    // ignore
  }

  // No default sample event
}

export function savePersistedState() {
  try {
    localStorage.setItem('crabfit_events_v3', JSON.stringify(state.events));
    localStorage.setItem('crabfit_availabilities_v3', JSON.stringify(state.availabilities));
    if (state.selectedEventId) {
      localStorage.setItem('crabfit_selected_event_id', state.selectedEventId);
    } else {
      localStorage.removeItem('crabfit_selected_event_id');
    }
    localStorage.setItem('crabfit_current_view', state.currentView);
  } catch (e) {
    // ignore
  }
}

// Generate Time Slots based on Event Config
export function generateSlots(targetEventId) {
  const activeEvt = targetEventId ? state.events.find((e) => e.id === targetEventId) : getActiveEvent();
  if (!activeEvt) return [];
  const slots = [];
  let dates = activeEvt.selectedDates ? [...activeEvt.selectedDates] : [];
  const startMins = parseMinutes(activeEvt.startTime);
  const endMins = parseMinutes(activeEvt.endTime);
  const interval = 30; // 30 min slots

  if (activeEvt.dateMode === 'days') {
    const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fdIdx = activeEvt.firstDayOfWeekIndex || 0;
    dates.sort((a, b) => {
      const idxA = daysOfWeekNames.indexOf(a);
      const idxB = daysOfWeekNames.indexOf(b);
      const relA = idxA >= 0 ? (idxA - fdIdx + 7) % 7 : 0;
      const relB = idxB >= 0 ? (idxB - fdIdx + 7) % 7 : 0;
      return relA - relB;
    });
  } else if (activeEvt.dateMode === 'dates') {
    const fdIdx = activeEvt.firstDayOfWeekIndex || 0;
    dates.sort((a, b) => {
      const getLocalDayOfWeek = (dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          return d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
        }
        return 0;
      };
      const dayA = getLocalDayOfWeek(a);
      const dayB = getLocalDayOfWeek(b);
      const relA = (dayA - fdIdx + 7) % 7;
      const relB = (dayB - fdIdx + 7) % 7;
      if (relA !== relB) {
        return relA - relB;
      }
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }

  dates.forEach((dateKey) => {
    let displayDate = dateKey;
    let dayShort = dateKey;
    let dayOfWeek = '';
    if (activeEvt.dateMode === 'dates') {
      displayDate = formatDateDisplay(dateKey);
      dayShort = getDayShortLabel(dateKey);
      dayOfWeek = getDayOfWeekLabel(dateKey);
    } else {
      dayShort = dateKey;
      displayDate = dateKey;
    }

    for (let m = startMins; m < endMins; m += interval) {
      const timeStr = formatMinutesTo24H(m);
      const displayTime = formatMinutesTo12H(m);
      slots.push({
        id: `${dateKey}T${timeStr}`,
        dateKey,
        dayShort,
        displayDate,
        dayOfWeek,
        timeStr,
        displayTime,
        minutes: m
      });
    }
  });

  return slots;
}

// Send WebXDC Update
export function sendEventUpdate(payload, description) {
  if (typeof window === 'undefined' || !window.webxdc || typeof window.webxdc.sendUpdate !== 'function') {
    console.warn('[WebXDC] window.webxdc.sendUpdate is not available in current environment');
    return;
  }

  try {
    const eventId = payload.eventId || (payload.event ? payload.event.id : null);
    const href = eventId ? `index.html#eventId=${encodeURIComponent(eventId)}` : undefined;

    const cleanPayload = JSON.parse(JSON.stringify(payload));
    cleanPayload.timestamp = Date.now();

    const descr = description ? String(description).replace(/[\r\n]+/g, ' ').trim() : '';
    // Spec: info truncated around 50 chars
    const infoText = descr.length > 50 ? descr.slice(0, 47) + '...' : descr;

    const updateObj = {
      payload: cleanPayload
    };

    if (infoText) {
      updateObj.info = infoText;
    }
    if (href && infoText) {
      updateObj.href = href;
    }

    console.log('[WebXDC] Calling sendUpdate with payload:', cleanPayload.type, 'descr:', descr);

    try {
      // Pass descr as the 2nd argument for compatibility with both older clients (which require descr)
      // and newer clients (which use update.info and ignore descr)
      window.webxdc.sendUpdate(updateObj, descr);
      console.log('[WebXDC] sendUpdate completed successfully');
    } catch (sendErr) {
      console.warn('[WebXDC] sendUpdate with extended properties failed, attempting minimal fallback:', sendErr);
      // Fallback: minimal update object containing only payload and description
      window.webxdc.sendUpdate({ payload: cleanPayload }, descr);
      console.log('[WebXDC] Minimal fallback sendUpdate completed successfully');
    }
  } catch (err) {
    console.error('[WebXDC] Error preparing or sending update:', err);
  }
}
