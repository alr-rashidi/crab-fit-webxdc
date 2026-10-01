import { state } from '../state.js';
import { generateSlots, formatMinutesTo12H, parseMinutes } from '../helpers.js';

// 2. Main App Header
export function renderAppHeader() {
  if (state.currentView === 'events_list') {
    return `
      <header class="bg-[#1E1E1E] border-b-4 border-black py-4 px-4 sticky top-0 z-30">
        <div class="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div id="btn-brand-home" class="cursor-pointer select-none">
            <span class="font-black text-2xl tracking-wider uppercase text-white">crab.fit</span>
          </div>
          <button 
            id="btn-new-event" 
            type="button" 
            class="px-4 py-2 bg-[#F79E00] text-black text-xs font-black border-[3px] border-black rounded shadow-[3px_3px_0px_0px_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-[#FFB833] transition-all cursor-pointer"
          >
            + New Event
          </button>
        </div>
      </header>
    `;
  }

  return `
    <header class="bg-[#1E1E1E] border-b-4 border-black py-4 px-4 sticky top-0 z-30">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <span class="font-black text-2xl tracking-wider uppercase text-white">crab.fit</span>
        <button 
          id="btn-nav-events-list" 
          type="button" 
          class="px-4 py-2 bg-[#2D2D2D] text-white text-xs font-black border-[3px] border-black rounded shadow-[3px_3px_0px_0px_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-[#3D3D3D] transition-all cursor-pointer flex items-center gap-1.5"
        >
          ← Back
        </button>
      </div>
    </header>
  `;
}

// 3. MAIN PAGE: Active Events List
export function renderEventsList() {
  return `
    <div class="space-y-6">
      <!-- Events Cards Grid -->
      ${state.events.length === 0 ? `
        <div class="p-12 text-center space-y-4 text-white">
          <h3 class="text-xl font-black text-white">No active events yet</h3>
          <p class="text-xs text-zinc-300 max-w-sm mx-auto">
            Get started by creating a new event!
          </p>
          <button 
            id="btn-empty-create"
            type="button"
            class="px-6 py-2.5 bg-[#F79E00] text-black font-black text-xs border-[3px] border-black rounded shadow-[4px_4px_0px_0px_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_0px_#000] transition-all cursor-pointer"
          >
            + Create First Event
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${state.events.map((evt) => {
            const eventAvails = state.availabilities[evt.id] || {};
            const responsesCount = Object.keys(eventAvails).length;
            const slots = generateSlots(evt.id);
            const finalSlot = slots.find((s) => s.id === evt.finalSlotId);
            const isCreator = !evt.createdBy || evt.createdBy === state.identity.addr;
            const cardBg = evt.finalSlotId ? 'bg-[#153a21]' : 'bg-[#1E1E1E]';

            return `
              <div class="${cardBg} border-[3px] border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4 relative text-white">
                <div class="space-y-3">
                  <h3 class="text-xl font-black text-white">
                    ${evt.title}
                  </h3>

                  <!-- Details -->
                  <div class="text-xs text-zinc-300 space-y-1.5 pt-2">
                    <div>
                      <span><strong class="text-white">${formatMinutesTo12H(parseMinutes(evt.startTime))} - ${formatMinutesTo12H(parseMinutes(evt.endTime))} (${evt.timezone})</strong></span>
                    </div>
                    <div>
                      <span>By: <strong class="text-white">${evt.createdByName || 'Unknown'}${isCreator ? ' (You)' : ''}</strong></span>
                    </div>
                    ${finalSlot ? `
                      <div class="text-emerald-400 font-black pt-1">
                        <span>Meeting Time: ${finalSlot.displayDate} @ ${finalSlot.displayTime}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Footer / Action Row -->
                <div class="pt-3 flex items-center justify-between gap-3">
                  <div class="text-xs font-black text-zinc-400">
                    ${responsesCount} ${responsesCount === 1 ? 'Response' : 'Responses'}
                  </div>
                  <div class="flex items-center gap-2">
                    <button 
                      data-open-evt="${evt.id}"
                      type="button"
                      class="btn-open-event px-4 py-1.5 bg-[#F79E00] hover:bg-[#FFB833] text-black font-black text-xs rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1"
                    >
                      <span>Open Event</span> →
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}
