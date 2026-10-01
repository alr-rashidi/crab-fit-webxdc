import { getWebXdcIdentity } from "./webxdc.js";
import { state } from "./state.js";
import { 
  updateCellDOM, 
  parseMinutes, 
  formatMinutesTo24H, 
  formatMinutesTo12H, 
  formatDateDisplay, 
  getDayShortLabel, 
  getActiveEvent, 
  loadPersistedState, 
  savePersistedState, 
  generateSlots, 
  sendEventUpdate 
} from "./helpers.js";
import { renderAppHeader, renderEventsList } from "./components/EventsList.js";
import { renderCreateEventForm } from "./components/CreateEvent.js";
import { renderEventView } from "./components/EventDetail.js";

// 12. Modal Detail Popup & Navigation Warnings
function renderModal() {
  if (state.pendingConfirmFinalSlotId) {
    const activeEvt = getActiveEvent();
    const slots = activeEvt ? generateSlots(activeEvt.id) : [];
    const confirmSlot = slots.find((s) => s.id === state.pendingConfirmFinalSlotId);

    return `
      <div class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-modal-backdrop">
        <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-6 max-w-sm w-full space-y-4 shadow-[6px_6px_0px_0px_#000] text-white animate-modal-content">
          <h4 class="text-base font-black text-white">Set as Final Event Time?</h4>
          <p class="text-xs text-zinc-300 leading-relaxed font-bold">
            Are you sure you want to select <strong class="text-[#F79E00]">${confirmSlot ? `${confirmSlot.displayDate} @ ${confirmSlot.displayTime}` : ''}</strong> as the final meeting time?
          </p>
          <div class="space-y-2 pt-2">
            <button id="btn-confirm-pick-final" type="button" class="w-full py-2.5 bg-[#F79E00] hover:bg-[#FFB833] text-black border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Yes, Set Final Time
            </button>
            <button id="btn-cancel-pick-final" type="button" class="w-full py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.pendingDeleteEventId) {
    const evtToDel = state.events.find((e) => e.id === state.pendingDeleteEventId);
    return `
      <div class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-modal-backdrop">
        <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-6 max-w-sm w-full space-y-4 shadow-[6px_6px_0px_0px_#000] text-white animate-modal-content">
          <div>
            <h4 class="text-base font-black text-white">Delete Event?</h4>
            <p class="text-xs text-[#FF5E5B] font-black mt-1">${evtToDel ? evtToDel.title : 'Event'}</p>
          </div>

          <p class="text-xs text-zinc-300 leading-relaxed font-bold">
            Are you sure you want to delete this event? This action cannot be undone and will permanently remove all availability data.
          </p>

          <div class="space-y-2 pt-2">
            <button id="btn-confirm-delete-event" type="button" class="w-full py-2.5 bg-[#FF5E5B] hover:bg-[#FF8A88] text-black border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Delete Event
            </button>
            <button id="btn-cancel-delete-event" type="button" class="w-full py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.pendingNavigationAction) {
    return `
      <div class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-modal-backdrop">
        <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-6 max-w-sm w-full space-y-4 shadow-[6px_6px_0px_0px_#000] text-white animate-modal-content">
          <div>
            <h4 class="text-base font-black text-white">You haven't submitted yet!</h4>
          </div>

          <p class="text-xs text-zinc-300 leading-relaxed font-bold">
            You modified your availability grid, but haven't sent the update to your chat group yet. Are you sure you want to leave without submitting?
          </p>

          <div class="space-y-2 pt-2">
            <button id="btn-unsaved-submit" type="button" class="w-full py-2.5 bg-[#F79E00] hover:bg-[#FFB833] text-black border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Submit & Continue →
            </button>
            <button id="btn-unsaved-cancel" type="button" class="w-full py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Cancel & Stay Here
            </button>
            <button id="btn-unsaved-discard" type="button" class="w-full py-2 bg-[#FF5E5B] hover:bg-[#FF8A88] text-black border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer">
              Discard Changes & Leave
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (!state.modalSlotId) return '';
  const activeEvt = getActiveEvent();
  if (!activeEvt) return '';

  const slots = generateSlots(activeEvt.id);
  const slot = slots.find((s) => s.id === state.modalSlotId);
  if (!slot) return '';

  const isCreator = !activeEvt.createdBy || activeEvt.createdBy === state.identity.addr;
  const isFinal = activeEvt.finalSlotId === slot.id;

  const eventAvails = state.availabilities[activeEvt.id] || {};
  const users = Object.values(eventAvails);
  const yesUsers = [];
  const maybeUsers = [];
  const noUsers = [];

  users.forEach((u) => {
    const st = u.slots?.[slot.id] || 'no';
    if (st === 'yes') yesUsers.push(u.userName);
    else if (st === 'maybe') maybeUsers.push(u.userName);
    else noUsers.push(u.userName);
  });

  return `
    <div class="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-modal-backdrop">
      <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-6 max-w-sm w-full space-y-4 shadow-[6px_6px_0px_0px_#000] text-white animate-modal-content">
        <div class="flex items-center justify-between border-b-2 border-black pb-2">
          <div>
            <div class="text-[10px] font-black uppercase text-zinc-400">Slot Availability</div>
            <h4 class="text-base font-black text-white">${slot.displayDate} @ ${slot.displayTime}</h4>
          </div>
          <button id="btn-close-modal" class="text-zinc-400 hover:text-white font-black text-sm cursor-pointer">Close</button>
        </div>

        <div class="space-y-3.5 text-xs">
          <div>
            <span class="font-black text-white">Attending (${yesUsers.length}):</span>
            <div class="text-zinc-300 font-bold mt-1">${yesUsers.join(', ') || 'None'}</div>
          </div>
          <div>
            <span class="font-black text-[#38BDF8]">Maybe (${maybeUsers.length}):</span>
            <div class="text-zinc-300 font-bold mt-1">${maybeUsers.join(', ') || 'None'}</div>
          </div>
          <div>
            <span class="font-black text-zinc-400">Unavailable (${noUsers.length}):</span>
            <div class="text-zinc-300 font-bold mt-1">${noUsers.join(', ') || 'None'}</div>
          </div>
        </div>

        ${isCreator && !activeEvt.finalSlotId ? `
          <button 
            data-pick-final="${slot.id}"
            type="button"
            class="btn-pick-final w-full py-2.5 bg-[#F79E00] hover:bg-[#FFB833] text-black border-2 border-black font-black text-xs rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            Pick as Final Event Time
          </button>
        ` : ''}

        <button id="btn-close-modal-bottom" class="w-full py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white border-2 border-black font-black rounded-none text-xs cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]">
          Close
        </button>
      </div>
    </div>
  `;
}

// Availability Baseline and Navigation Safety
function captureAvailabilityBaseline(activeEvtId) {
  if (!state.hasUnsubmittedChanges) {
    const existing = state.availabilities[activeEvtId]?.[state.identity.addr];
    state.baselineAvailability = existing ? JSON.parse(JSON.stringify(existing)) : null;
    state.baselineIdentityName = state.identity.name;
    state.hasUnsubmittedChanges = true;
  }
}

function commitAvailability(activeEvtId, myAv) {
  state.hasUnsubmittedChanges = false;
  state.baselineAvailability = JSON.parse(JSON.stringify(myAv));
  state.baselineIdentityName = state.identity.name;
  savePersistedState();
}

function revertUnsubmittedAvailability() {
  const activeEvt = getActiveEvent();
  if (activeEvt) {
    if (state.baselineAvailability) {
      if (!state.availabilities[activeEvt.id]) {
        state.availabilities[activeEvt.id] = {};
      }
      state.availabilities[activeEvt.id][state.identity.addr] = JSON.parse(JSON.stringify(state.baselineAvailability));
    } else {
      if (state.availabilities[activeEvt.id]) {
        delete state.availabilities[activeEvt.id][state.identity.addr];
      }
    }
    if (state.baselineIdentityName !== undefined) {
      state.identity.name = state.baselineIdentityName;
      if (window.webxdc) {
        window.webxdc.selfName = state.identity.name;
      }
    }
    savePersistedState();
  }
  state.hasUnsubmittedChanges = false;
  state.baselineAvailability = null;
  state.baselineIdentityName = undefined;
}

// Helper for navigating safely when user has unsubmitted availability changes
function requestNavigation(actionFn) {
  if (state.hasUnsubmittedChanges && state.currentView === 'event_view' && state.activeView === 'your_availability') {
    state.pendingNavigationAction = actionFn;
    render();
    return;
  }
  actionFn();
}

// ATTACH EVENT LISTENERS (DOM Interactions)
function attachEventListeners() {
  // Navigation & Brand Header
  const brandHome = document.getElementById('btn-brand-home');
  if (brandHome) {
    brandHome.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'events_list';
        render();
      });
    });
  }

  const btnNavEvents = document.getElementById('btn-nav-events-list');
  if (btnNavEvents) {
    btnNavEvents.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'events_list';
        render();
      });
    });
  }

  const btnNavCreate = document.getElementById('btn-main-create-event');
  if (btnNavCreate) {
    btnNavCreate.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'create_event';
        render();
      });
    });
  }

  const btnEmptyCreate = document.getElementById('btn-empty-create');
  if (btnEmptyCreate) {
    btnEmptyCreate.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'create_event';
        render();
      });
    });
  }

  const btnNewEvt = document.getElementById('btn-new-event');
  if (btnNewEvt) {
    btnNewEvt.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'create_event';
        render();
      });
    });
  }

  const btnBackToEvents = document.getElementById('btn-back-to-events');
  if (btnBackToEvents) {
    btnBackToEvents.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'events_list';
        render();
      });
    });
  }

  const btnBackToEventsTop = document.getElementById('btn-back-to-events-top');
  if (btnBackToEventsTop) {
    btnBackToEventsTop.addEventListener('click', () => {
      requestNavigation(() => {
        state.currentView = 'events_list';
        render();
      });
    });
  }

  // Open Event Cards
  document.querySelectorAll('.btn-open-event').forEach((btn) => {
    btn.addEventListener('click', () => {
      const evtId = btn.getAttribute('data-open-evt');
      if (evtId) {
        state.selectedEventId = evtId;
        state.currentView = 'event_view';
        savePersistedState();
        render();
      }
    });
  });

  // Delete Event Cards (Opens Confirmation Modal)
  document.querySelectorAll('.btn-delete-event').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const evtId = btn.getAttribute('data-delete-evt');
      if (!evtId) return;

      const evt = state.events.find((ev) => ev.id === evtId);
      if (!evt) return;

      const isCreator = !evt.createdBy || evt.createdBy === state.identity.addr;
      if (!isCreator) return;

      state.pendingDeleteEventId = evtId;
      render();
    });
  });

  // Delete Confirmation Modal Handlers
  const btnConfirmDel = document.getElementById('btn-confirm-delete-event');
  if (btnConfirmDel) {
    btnConfirmDel.addEventListener('click', () => {
      const evtId = state.pendingDeleteEventId;
      if (!evtId) return;
      const evt = state.events.find((ev) => ev.id === evtId);
      state.events = state.events.filter((ev) => ev.id !== evtId);
      delete state.availabilities[evtId];
      if (state.selectedEventId === evtId) {
        state.selectedEventId = null;
        state.currentView = 'events_list';
      }
      state.pendingDeleteEventId = null;
      savePersistedState();
      if (evt) {
        sendEventUpdate({ type: 'DELETE_EVENT', eventId: evtId }, `Deleted event: ${evt.title}`);
      }
      render();
    });
  }

  const btnCancelDel = document.getElementById('btn-cancel-delete-event');
  if (btnCancelDel) {
    btnCancelDel.addEventListener('click', () => {
      state.pendingDeleteEventId = null;
      render();
    });
  }

  // Create Event Title Input
  const titleInput = document.getElementById('input-event-title');
  if (titleInput) {
    titleInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.createForm.title = val;
      const btn = document.getElementById('btn-create-event');
      if (btn) {
        if (!val.trim()) {
          btn.setAttribute('disabled', 'true');
        } else {
          btn.removeAttribute('disabled');
        }
      }
    });
  }

  // Date Mode Tabs
  const tabDates = document.getElementById('tab-mode-dates');
  if (tabDates) {
    tabDates.addEventListener('click', () => {
      state.createForm.dateMode = 'dates';
      render();
    });
  }
  const tabDays = document.getElementById('tab-mode-days');
  if (tabDays) {
    tabDays.addEventListener('click', () => {
      state.createForm.dateMode = 'days';
      render();
    });
  }

  // Month Nav
  const btnPrevM = document.getElementById('btn-prev-month');
  if (btnPrevM) {
    btnPrevM.addEventListener('click', () => {
      if (state.createForm.currentMonth === 0) {
        state.createForm.currentMonth = 11;
        state.createForm.currentYear--;
      } else {
        state.createForm.currentMonth--;
      }
      render();
    });
  }
  const btnNextM = document.getElementById('btn-next-month');
  if (btnNextM) {
    btnNextM.addEventListener('click', () => {
      if (state.createForm.currentMonth === 11) {
        state.createForm.currentMonth = 0;
        state.createForm.currentYear++;
      } else {
        state.createForm.currentMonth++;
      }
      render();
    });
  }

  // Shift Starting Day of Week
  const btnShiftLeft = document.getElementById('btn-shift-start-left');
  if (btnShiftLeft) {
    btnShiftLeft.addEventListener('click', () => {
      const current = state.createForm.firstDayOfWeekIndex || 0;
      state.createForm.firstDayOfWeekIndex = (current + 1) % 7;
      render();
    });
  }
  const btnShiftRight = document.getElementById('btn-shift-start-right');
  if (btnShiftRight) {
    btnShiftRight.addEventListener('click', () => {
      const current = state.createForm.firstDayOfWeekIndex || 0;
      state.createForm.firstDayOfWeekIndex = (current - 1 + 7) % 7;
      render();
    });
  }

  // Calendar Day Clicks
  document.querySelectorAll('.calendar-day-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      const dateStr = cell.getAttribute('data-date');
      if (!dateStr) return;
      const idx = state.createForm.selectedDates.indexOf(dateStr);
      if (idx > -1) {
        if (state.createForm.selectedDates.length > 1) {
          state.createForm.selectedDates.splice(idx, 1);
        }
      } else {
        state.createForm.selectedDates.push(dateStr);
      }
      render();
    });
  });

  // Days of Week Clicks
  document.querySelectorAll('.btn-day-of-week').forEach((btn) => {
    btn.addEventListener('click', () => {
      const day = btn.getAttribute('data-day');
      if (!day) return;
      const idx = state.createForm.selectedDays.indexOf(day);
      if (idx > -1) {
        if (state.createForm.selectedDays.length > 1) {
          state.createForm.selectedDays.splice(idx, 1);
        }
      } else {
        state.createForm.selectedDays.push(day);
      }
      render();
    });
  });

  // Timezone Input with auto-suggest datalist
  const tzInput = document.getElementById('input-timezone');
  if (tzInput) {
    tzInput.addEventListener('input', (e) => {
      state.createForm.timezone = e.target.value;
    });
    tzInput.addEventListener('change', (e) => {
      state.createForm.timezone = e.target.value;
    });
  }

  // Create Event Submission Button
  const btnCreate = document.getElementById('btn-create-event');
  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      let finalTitle = state.createForm.title.trim();
      if (!finalTitle) {
        return; // strictly required
      }

      const datesToUse = state.createForm.dateMode === 'dates' ? [...state.createForm.selectedDates] : [...state.createForm.selectedDays];

      const newEvent = {
        id: `crab_${Date.now()}`,
        title: finalTitle,
        dateMode: state.createForm.dateMode,
        selectedDates: datesToUse,
        startTime: formatMinutesTo24H(state.createForm.startMinutes),
        endTime: formatMinutesTo24H(state.createForm.endMinutes),
        timezone: state.createForm.timezone,
        firstDayOfWeekIndex: state.createForm.firstDayOfWeekIndex || 0,
        createdAt: Date.now(),
        createdBy: state.identity.addr,
        createdByName: state.identity.name
      };

      state.events.unshift(newEvent);
      state.selectedEventId = newEvent.id;
      state.currentView = 'event_view';
      savePersistedState();

      sendEventUpdate(
        { type: 'CREATE_EVENT', event: newEvent },
        `Created event: ${newEvent.title}`
      );

      render();
    });
  }

  // Time Range Slider Dragging Logic
  const sliderBar = document.getElementById('time-slider-bar');
  const handleStart = document.getElementById('slider-handle-start');
  const handleEnd = document.getElementById('slider-handle-end');
  const sliderFill = document.getElementById('time-slider-fill');
  const labelStart = document.getElementById('slider-label-start');
  const labelEnd = document.getElementById('slider-label-end');

  if (sliderBar && handleStart && handleEnd) {
    let activeDrag = null;

    const updateSliderDOM = () => {
      const startPct = (state.createForm.startMinutes / 1440) * 100;
      const endPct = (state.createForm.endMinutes / 1440) * 100;
      if (sliderFill) {
        sliderFill.style.left = `${startPct}%`;
        sliderFill.style.width = `${endPct - startPct}%`;
      }
      if (handleStart) handleStart.style.left = `${startPct}%`;
      if (handleEnd) handleEnd.style.left = `${endPct}%`;
      if (labelStart) labelStart.textContent = formatMinutesTo12H(state.createForm.startMinutes);
      if (labelEnd) labelEnd.textContent = formatMinutesTo12H(state.createForm.endMinutes);
    };

    const processMove = (clientX) => {
      if (!activeDrag) return;
      const rect = sliderBar.getBoundingClientRect();
      if (!rect.width) return;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const mins = Math.round((pct * 1440) / 30) * 30;

      if (activeDrag === 'start') {
        const nextStart = Math.min(mins, state.createForm.endMinutes - 30);
        state.createForm.startMinutes = Math.max(0, nextStart);
      } else if (activeDrag === 'end') {
        const nextEnd = Math.max(mins, state.createForm.startMinutes + 30);
        state.createForm.endMinutes = Math.min(1440, nextEnd);
      }
      updateSliderDOM();
    };

    const startDrag = (type, e) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      activeDrag = type;
    };

    handleStart.addEventListener('mousedown', (e) => startDrag('start', e));
    handleStart.addEventListener('touchstart', (e) => startDrag('start', e), { passive: false });

    handleEnd.addEventListener('mousedown', (e) => startDrag('end', e));
    handleEnd.addEventListener('touchstart', (e) => startDrag('end', e), { passive: false });

    sliderBar.addEventListener('mousedown', (e) => {
      if (e.target === handleStart || handleStart.contains(e.target) || e.target === handleEnd || handleEnd.contains(e.target)) return;
      const rect = sliderBar.getBoundingClientRect();
      if (!rect.width) return;
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const mins = Math.round((pct * 1440) / 30) * 30;

      const distStart = Math.abs(mins - state.createForm.startMinutes);
      const distEnd = Math.abs(mins - state.createForm.endMinutes);

      if (distStart <= distEnd) {
        state.createForm.startMinutes = Math.min(mins, state.createForm.endMinutes - 30);
        activeDrag = 'start';
      } else {
        state.createForm.endMinutes = Math.max(mins, state.createForm.startMinutes + 30);
        activeDrag = 'end';
      }
      updateSliderDOM();
    });

    const onPointerMove = (e) => {
      if (!activeDrag) return;
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      processMove(clientX);
    };

    const onPointerEnd = () => {
      if (activeDrag) {
        activeDrag = null;
      }
    };

    window.onmousemove = onPointerMove;
    window.ontouchmove = onPointerMove;
    window.onmouseup = onPointerEnd;
    window.ontouchend = onPointerEnd;
  }

  // Event View Tabs
  const btnTabYour = document.getElementById('btn-tab-your');
  if (btnTabYour) btnTabYour.addEventListener('click', () => { state.activeView = 'your_availability'; render(); });
  const btnTabGroup = document.getElementById('btn-tab-group');
  if (btnTabGroup) btnTabGroup.addEventListener('click', () => { requestNavigation(() => { state.activeView = 'group_availability'; render(); }); });
  const btnTabBest = document.getElementById('btn-tab-best');
  if (btnTabBest) btnTabBest.addEventListener('click', () => { requestNavigation(() => { state.activeView = 'top_times'; render(); }); });
  const btnTabTally = document.getElementById('btn-tab-tally');
  if (btnTabTally) btnTabTally.addEventListener('click', () => { requestNavigation(() => { state.activeView = 'participants'; render(); }); });

  // Unsaved Navigation Modal Handlers
  const btnUnsavedSubmit = document.getElementById('btn-unsaved-submit');
  if (btnUnsavedSubmit) {
    btnUnsavedSubmit.addEventListener('click', () => {
      const activeEvt = getActiveEvent();
      if (activeEvt) {
        const eventAvail = state.availabilities[activeEvt.id] || {};
        const myAv = eventAvail[state.identity.addr] || {
          userAddr: state.identity.addr,
          userName: state.identity.name,
          slots: {},
          updatedAt: Date.now()
        };
        myAv.userName = state.identity.name || 'Crab Member';
        myAv.updatedAt = Date.now();
        eventAvail[state.identity.addr] = myAv;
        commitAvailability(activeEvt.id, myAv);

        const freeCount = Object.values(myAv.slots).filter((st) => st === 'yes').length;
        sendEventUpdate(
          { type: 'SUBMIT_AVAILABILITY', eventId: activeEvt.id, availability: myAv },
          `${myAv.userName} responded to ${activeEvt.title} (${freeCount} slots free)`
        );
      }
      const nextAction = state.pendingNavigationAction;
      state.pendingNavigationAction = null;
      if (nextAction) nextAction();
      else render();
    });
  }

  const btnUnsavedDiscard = document.getElementById('btn-unsaved-discard');
  if (btnUnsavedDiscard) {
    btnUnsavedDiscard.addEventListener('click', () => {
      revertUnsubmittedAvailability();
      const nextAction = state.pendingNavigationAction;
      state.pendingNavigationAction = null;
      if (nextAction) nextAction();
      else render();
    });
  }

  const btnUnsavedCancel = document.getElementById('btn-unsaved-cancel');
  if (btnUnsavedCancel) {
    btnUnsavedCancel.addEventListener('click', () => {
      state.pendingNavigationAction = null;
      render();
    });
  }

  // Active Event Context
  const activeEvt = getActiveEvent();
  if (activeEvt && state.currentView === 'event_view') {
    const slots = generateSlots(activeEvt.id);
    if (!state.availabilities[activeEvt.id]) {
      state.availabilities[activeEvt.id] = {};
    }
    const eventAvail = state.availabilities[activeEvt.id];

    const btnAll = document.getElementById('btn-select-all');
    if (btnAll) {
      btnAll.addEventListener('click', () => {
        captureAvailabilityBaseline(activeEvt.id);
        const myAv = eventAvail[state.identity.addr] || { userAddr: state.identity.addr, userName: state.identity.name, slots: {}, updatedAt: Date.now() };
        slots.forEach((s) => { myAv.slots[s.id] = 'yes'; });
        eventAvail[state.identity.addr] = myAv;
        render();
      });
    }

    const btnNoneElement = document.getElementById('btn-select-none');
    if (btnNoneElement) {
      btnNoneElement.addEventListener('click', () => {
        captureAvailabilityBaseline(activeEvt.id);
        const myAv = eventAvail[state.identity.addr] || { userAddr: state.identity.addr, userName: state.identity.name, slots: {}, updatedAt: Date.now() };
        slots.forEach((s) => { myAv.slots[s.id] = 'no'; });
        eventAvail[state.identity.addr] = myAv;
        render();
      });
    }

    const btnInvert = document.getElementById('btn-invert-selection');
    if (btnInvert) {
      btnInvert.addEventListener('click', () => {
        captureAvailabilityBaseline(activeEvt.id);
        const myAv = eventAvail[state.identity.addr] || { userAddr: state.identity.addr, userName: state.identity.name, slots: {}, updatedAt: Date.now() };
        slots.forEach((s) => {
          myAv.slots[s.id] = myAv.slots[s.id] === 'yes' ? 'no' : 'yes';
        });
        eventAvail[state.identity.addr] = myAv;
        render();
      });
    }

    // Brush Selection
    const btnBYes = document.getElementById('btn-brush-yes');
    if (btnBYes) btnBYes.addEventListener('click', () => { state.currentBrush = 'yes'; render(); });
    const btnBMaybe = document.getElementById('btn-brush-maybe');
    if (btnBMaybe) btnBMaybe.addEventListener('click', () => { state.currentBrush = 'maybe'; render(); });
    const btnBNo = document.getElementById('btn-brush-no');
    if (btnBNo) btnBNo.addEventListener('click', () => { state.currentBrush = 'no'; render(); });

    // Grid Cell Drag Painting (Mouse & Touch Drag Support)
    let isGridPainting = false;
    let dragTargetStatus = null;
    const gridContainer = document.getElementById('availability-grid-container');

    const applyBrushToCell = (cell, isFirstCell = false) => {
      if (!cell) return;
      const slotId = cell.getAttribute('data-slot-id');
      if (!slotId) return;

      if (!eventAvail[state.identity.addr]) {
        eventAvail[state.identity.addr] = {
          userAddr: state.identity.addr,
          userName: state.identity.name,
          slots: {},
          updatedAt: Date.now()
        };
      }

      const currentVal = eventAvail[state.identity.addr].slots[slotId] || 'no';

      if (isFirstCell) {
        // If clicking/dragging starting on a cell with the same status, toggle to 'no'
        if (currentVal === state.currentBrush) {
          dragTargetStatus = 'no';
        } else {
          dragTargetStatus = state.currentBrush;
        }
      }

      const targetStatus = dragTargetStatus || state.currentBrush;

      if (currentVal !== targetStatus) {
        captureAvailabilityBaseline(activeEvt.id);
        eventAvail[state.identity.addr].slots[slotId] = targetStatus;
        updateCellDOM(cell, targetStatus);
      }
    };

    if (gridContainer) {
      // Mouse dragging
      gridContainer.addEventListener('mousedown', (e) => {
        const cell = e.target.closest('.paint-grid-cell');
        if (cell) {
          isGridPainting = true;
          applyBrushToCell(cell, true);
        }
      });

      gridContainer.addEventListener('mousemove', (e) => {
        if (!isGridPainting) return;
        const cell = e.target.closest('.paint-grid-cell');
        if (cell) {
          applyBrushToCell(cell, false);
        }
      });

      // Touch dragging (mobile / touchscreens)
      gridContainer.addEventListener('touchstart', (e) => {
        const cell = e.target.closest('.paint-grid-cell');
        if (cell) {
          isGridPainting = true;
          if (e.cancelable) e.preventDefault();
          applyBrushToCell(cell, true);
        }
      }, { passive: false });

      gridContainer.addEventListener('touchmove', (e) => {
        if (!isGridPainting) return;
        if (e.cancelable) e.preventDefault();
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetEl) {
          const cell = targetEl.closest('.paint-grid-cell');
          if (cell) {
            applyBrushToCell(cell, false);
          }
        }
      }, { passive: false });
    }

    const stopPainting = () => {
      if (isGridPainting) {
        isGridPainting = false;
        dragTargetStatus = null;
      }
    };

    window.addEventListener('mouseup', stopPainting);
    window.addEventListener('touchend', stopPainting);
    window.addEventListener('touchcancel', stopPainting);

    // User Name Input
    const nameInput = document.getElementById('input-user-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        captureAvailabilityBaseline(activeEvt.id);
        state.identity.name = e.target.value;
        if (window.webxdc) window.webxdc.selfName = state.identity.name;
      });
    }

    // Submit Availability Button
    const btnSubmitAvail = document.getElementById('btn-submit-availability');
    if (btnSubmitAvail) {
      btnSubmitAvail.addEventListener('click', () => {
        const myAv = eventAvail[state.identity.addr] || {
          userAddr: state.identity.addr,
          userName: state.identity.name,
          slots: {},
          updatedAt: Date.now()
        };
        myAv.userName = state.identity.name || 'Crab Member';
        myAv.updatedAt = Date.now();
        eventAvail[state.identity.addr] = myAv;
        commitAvailability(activeEvt.id, myAv);
        state.submitSuccessEventId = activeEvt.id;

        const freeCount = Object.values(myAv.slots).filter((st) => st === 'yes').length;
        sendEventUpdate(
          { type: 'SUBMIT_AVAILABILITY', eventId: activeEvt.id, availability: myAv },
          `${myAv.userName} responded to ${activeEvt.title} (${freeCount} slots free)`
        );

        render();

        setTimeout(() => {
          if (state.submitSuccessEventId === activeEvt.id) {
            state.submitSuccessEventId = null;
            render();
          }
        }, 3000);
      });
    }

    // Heatmap Slot Click for Modal
    document.querySelectorAll('.heatmap-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        const slotId = cell.getAttribute('data-heatmap-slot');
        if (slotId) {
          state.modalSlotId = slotId;
          render();
        }
      });
    });

    // Slot details button (Top Times)
    document.querySelectorAll('.btn-slot-details').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = btn.getAttribute('data-slot-details');
        if (slotId) {
          state.modalSlotId = slotId;
          render();
        }
      });
    });

    // Pick Final Time (opens confirm modal)
    document.querySelectorAll('.btn-pick-final').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = btn.getAttribute('data-pick-final');
        if (!slotId) return;
        state.pendingConfirmFinalSlotId = slotId;
        state.modalSlotId = null;
        render();
      });
    });

    // Confirm Pick Final Time
    const btnConfirmPickFinal = document.getElementById('btn-confirm-pick-final');
    if (btnConfirmPickFinal) {
      btnConfirmPickFinal.addEventListener('click', () => {
        const slotId = state.pendingConfirmFinalSlotId;
        if (!slotId) return;
        activeEvt.finalSlotId = slotId;
        state.pendingConfirmFinalSlotId = null;
        savePersistedState();

        sendEventUpdate(
          { type: 'SET_FINAL_TIME', eventId: activeEvt.id, finalSlotId: slotId },
          `Final meeting time selected for ${activeEvt.title}`
        );

        render();
      });
    }

    // Cancel Pick Final Time Modal
    const btnCancelPickFinal = document.getElementById('btn-cancel-pick-final');
    if (btnCancelPickFinal) {
      btnCancelPickFinal.addEventListener('click', () => {
        state.pendingConfirmFinalSlotId = null;
        render();
      });
    }

    // Cancel Selected Final Meeting Time
    const btnCancelFinalTime = document.getElementById('btn-cancel-final-time');
    if (btnCancelFinalTime) {
      btnCancelFinalTime.addEventListener('click', () => {
        activeEvt.finalSlotId = null;
        savePersistedState();

        sendEventUpdate(
          { type: 'SET_FINAL_TIME', eventId: activeEvt.id, finalSlotId: null },
          `Final meeting time cancelled for ${activeEvt.title}`
        );

        render();
      });
    }

    // Copy Announcement
    const btnCopy = document.getElementById('btn-copy-announcement');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const finalSlot = slots.find((s) => s.id === activeEvt.finalSlotId);
        if (!finalSlot) return;
        const text = `Final Event Time Selected!\n${activeEvt.title}\nDate: ${finalSlot.displayDate}\nTime: ${finalSlot.displayTime} (${activeEvt.timezone})`;
        navigator.clipboard.writeText(text);
        btnCopy.textContent = 'Copied!';
        setTimeout(() => render(), 2000);
      });
    }
  }

  // Modal Close
  const btnCloseM = document.getElementById('btn-close-modal');
  if (btnCloseM) btnCloseM.addEventListener('click', () => { state.modalSlotId = null; render(); });
  const btnCloseMB = document.getElementById('btn-close-modal-bottom');
  if (btnCloseMB) btnCloseMB.addEventListener('click', () => { state.modalSlotId = null; render(); });

}

// Track view changes for smooth page transitions
let lastRenderedView = null;
let lastRenderedEventId = null;

// Global Main Render function
export function render() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  const isPageViewChange = state.currentView !== lastRenderedView || state.activeEventId !== lastRenderedEventId;
  lastRenderedView = state.currentView;
  lastRenderedEventId = state.activeEventId;

  let mainContentHtml = '';
  if (state.currentView === 'events_list') {
    mainContentHtml = renderEventsList();
  } else if (state.currentView === 'create_event') {
    mainContentHtml = renderCreateEventForm();
  } else if (state.currentView === 'event_view') {
    mainContentHtml = renderEventView();
  }

  appEl.innerHTML = `
    ${renderAppHeader()}
    <main class="max-w-4xl mx-auto px-4 py-6">
      <div id="page-content-wrapper" class="${isPageViewChange ? 'animate-page-enter' : ''}">
        ${mainContentHtml}
      </div>
    </main>
    ${renderModal()}
  `;

  // Always re-attach event listeners after rendering new HTML
  attachEventListeners();
}

// WebXDC Listener Setup
export function setupWebXdcListener() {
  if (typeof window !== 'undefined' && window.webxdc && typeof window.webxdc.setUpdateListener === 'function') {
    window.webxdc.setUpdateListener((update) => {
      let payload = update?.payload;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          // ignore
        }
      }
      if (!payload || !payload.type) return;

      console.log('[WebXDC] Processing update:', payload.type, 'serial:', update.serial);

      if (payload.type === 'CREATE_EVENT') {
        const evt = payload.event;
        if (evt) {
          const existingIdx = state.events.findIndex((e) => e.id === evt.id);
          if (existingIdx === -1) {
            state.events.unshift(evt);
          } else {
            state.events[existingIdx] = { ...state.events[existingIdx], ...evt };
          }
        }
      } else if (payload.type === 'SUBMIT_AVAILABILITY') {
        const { eventId, availability } = payload;
        if (eventId && availability) {
          if (!state.availabilities[eventId]) {
            state.availabilities[eventId] = {};
          }
          state.availabilities[eventId][availability.userAddr] = availability;
        }
      } else if (payload.type === 'PICK_FINAL_TIME' || payload.type === 'SET_FINAL_TIME') {
        const { eventId, slotId, finalSlotId } = payload;
        const targetSlotId = slotId !== undefined ? slotId : finalSlotId;
        const evt = state.events.find((e) => e.id === eventId);
        if (evt) {
          evt.finalSlotId = targetSlotId;
        }
      } else if (payload.type === 'CANCEL_FINAL_TIME') {
        const { eventId } = payload;
        const evt = state.events.find((e) => e.id === eventId);
        if (evt) {
          evt.finalSlotId = null;
        }
      } else if (payload.type === 'DELETE_EVENT') {
        const { eventId } = payload;
        state.events = state.events.filter((e) => e.id !== eventId);
        if (state.availabilities[eventId]) {
          delete state.availabilities[eventId];
        }
        if (state.selectedEventId === eventId) {
          state.selectedEventId = null;
          state.currentView = 'events_list';
        }
      }

      // Check if this update matches a pending deep link
      if (state.pendingDeepLinkEventId) {
        const targetEvt = state.events.find((e) => e.id === state.pendingDeepLinkEventId);
        if (targetEvt) {
          state.selectedEventId = targetEvt.id;
          state.currentView = 'event_view';
          state.activeView = targetEvt.finalSlotId ? 'top_times' : 'group_availability';
          state.pendingDeepLinkEventId = null;
        }
      }

      savePersistedState();
      render();
    }, 0);
  }
}

// Deep Linking Setup
export function checkDeepLink() {
  if (typeof window === 'undefined') return;

  let eventId = null;
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    eventId = params.get('eventId');
  }
  if (!eventId && window.location.hash) {
    const hashStr = window.location.hash.replace(/^#\/?/, '');
    const hashParams = new URLSearchParams(hashStr);
    eventId = hashParams.get('eventId') || (hashStr.startsWith('eventId=') ? hashStr.split('=')[1] : (hashStr ? hashStr : null));
  }

  if (eventId) {
    const found = state.events.find((e) => e.id === eventId);
    if (found) {
      state.selectedEventId = eventId;
      state.currentView = 'event_view';
      state.activeView = found.finalSlotId ? 'top_times' : 'group_availability';
      state.pendingDeepLinkEventId = null;
      savePersistedState();
    } else {
      state.pendingDeepLinkEventId = eventId;
    }
  }
}

// INITIALIZATION ENTRY POINT
state.identity = getWebXdcIdentity();
loadPersistedState();
setupWebXdcListener();
checkDeepLink();
render();

window.addEventListener('hashchange', () => {
  checkDeepLink();
  render();
});
window.addEventListener('popstate', () => {
  checkDeepLink();
  render();
});

// Browser beforeunload warning for unsubmitted changes
window.addEventListener('beforeunload', (e) => {
  if (state.hasUnsubmittedChanges && state.currentView === 'event_view' && state.activeView === 'your_availability') {
    e.preventDefault();
    e.returnValue = 'You have unsubmitted availability changes.';
    return e.returnValue;
  }
});
