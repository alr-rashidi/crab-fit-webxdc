import { state } from '../state.js';
import { generateSlots, formatMinutesTo12H, parseMinutes, getActiveEvent } from '../helpers.js';

// Track tab changes for smooth transitions
let lastRenderedTab = null;

// 5. Active Event Detail View
export function renderEventView() {
  const activeEvt = getActiveEvent();
  if (!activeEvt) return '';

  const isCreator = !activeEvt.createdBy || activeEvt.createdBy === state.identity.addr;
  const slots = generateSlots(activeEvt.id);
  const eventAvails = state.availabilities[activeEvt.id] || {};
  const userAvail = eventAvails[state.identity.addr] || null;

  const isTabChange = state.activeView !== lastRenderedTab;
  lastRenderedTab = state.activeView;

  return `
    <div class="space-y-6">
      <!-- Compact Event Header -->
      <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4 text-white">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-lg font-black text-white">
              ${activeEvt.title}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-black text-black bg-[#F79E00] border-2 border-black px-2 py-1 rounded-sm shadow-[1.5px_1.5px_0px_0px_#000]">
              ${Object.keys(eventAvails).length} Responded
            </span>
            ${isCreator ? `
              <button 
                data-delete-evt="${activeEvt.id}"
                type="button"
                title="Delete Event"
                class="btn-delete-event px-3 py-1 rounded bg-[#FF5E5B] hover:bg-[#FF8A88] text-black border-2 border-black text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                Delete
              </button>
            ` : ''}
          </div>
        </div>

        <div class="text-xs text-zinc-300 flex flex-wrap items-center gap-4 border-t-2 border-black pt-3.5">
          <span><strong class="text-white">${formatMinutesTo12H(parseMinutes(activeEvt.startTime))} - ${formatMinutesTo12H(parseMinutes(activeEvt.endTime))} (${activeEvt.timezone})</strong></span>
          <span class="text-zinc-600">•</span>
          <span>By: <strong class="text-white">${activeEvt.createdByName || 'Peer'}${isCreator ? ' (You)' : ''}</strong></span>
        </div>
      </div>

      <!-- Final Meeting Time Banner (If picked) -->
      ${activeEvt.finalSlotId ? renderFinalTimeBanner(activeEvt, slots) : ''}

      <!-- Navigation Tabs -->
      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 no-select">
        <button 
          id="btn-tab-your"
          type="button"
          class="px-4 py-2.5 rounded border-[3px] border-black text-xs sm:text-sm font-black transition cursor-pointer shadow-[3px_3px_0px_0px_#000] ${
            state.activeView === 'your_availability'
              ? 'bg-[#F79E00] text-black'
              : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]'
          }">
          Your availability
        </button>

        <button 
          id="btn-tab-group"
          type="button"
          class="px-4 py-2.5 rounded border-[3px] border-black text-xs sm:text-sm font-black transition cursor-pointer shadow-[3px_3px_0px_0px_#000] ${
            state.activeView === 'group_availability'
              ? 'bg-[#F79E00] text-black'
              : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]'
          }">
          Group availability
        </button>

        <button 
          id="btn-tab-best"
          type="button"
          class="px-4 py-2.5 rounded border-[3px] border-black text-xs sm:text-sm font-black transition cursor-pointer shadow-[3px_3px_0px_0px_#000] ${
            state.activeView === 'top_times'
              ? 'bg-[#F79E00] text-black'
              : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]'
          }">
          Top Times
        </button>

        <button 
          id="btn-tab-tally"
          type="button"
          class="px-4 py-2.5 rounded border-[3px] border-black text-xs sm:text-sm font-black transition cursor-pointer shadow-[3px_3px_0px_0px_#000] ${
            state.activeView === 'participants'
              ? 'bg-[#F79E00] text-black'
              : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]'
          }">
          Responses
        </button>
      </div>

      <!-- Active Tab Content -->
      <div id="event-tab-content-container" class="${isTabChange ? 'animate-tab-enter' : ''}">
        ${state.activeView === 'your_availability' ? renderYourAvailabilityTab(activeEvt, slots, userAvail) : ''}
        ${state.activeView === 'group_availability' ? renderGroupHeatmapTab(activeEvt, slots) : ''}
        ${state.activeView === 'top_times' ? renderTopTimesTab(activeEvt, slots) : ''}
        ${state.activeView === 'participants' ? renderParticipantsTab(activeEvt) : ''}
      </div>
    </div>
  `;
}

// 6. "Your Availability" Grid Tab
export function renderYourAvailabilityTab(activeEvt, slots, userAvail) {
  const dates = Array.from(new Set(slots.map((s) => s.dateKey)));
  const times = Array.from(new Set(slots.map((s) => s.timeStr)));
  const userSlots = userAvail?.slots || {};

  return `
    <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-5 text-white">
      <div class="text-center space-y-1">
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <p class="text-sm font-black text-white">
            Click or drag across cells to mark your availability
          </p>
          ${state.hasUnsubmittedChanges ? `
            <span class="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-[#FF5E5B] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
              Unsaved Changes
            </span>
          ` : ''}
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="flex flex-wrap items-center justify-center gap-2.5 no-select">
        <button id="btn-select-all" type="button" class="px-4 py-1.5 rounded-none bg-[#2D2D2D] text-white hover:bg-[#3D3D3D] font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          Select all
        </button>
        <button id="btn-select-none" type="button" class="px-4 py-1.5 rounded-none bg-[#2D2D2D] text-white hover:bg-[#3D3D3D] font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          Select none
        </button>
        <button id="btn-invert-selection" type="button" class="px-4 py-1.5 rounded-none bg-[#2D2D2D] text-white hover:bg-[#3D3D3D] font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
          Invert selection
        </button>
      </div>

      <!-- Brush Toggle State Selection -->
      <div class="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
        <span class="text-white font-black uppercase tracking-wider text-[11px]">Paint Brush:</span>
        <button id="btn-brush-yes" type="button" class="px-3.5 py-1.5 rounded-none font-black transition cursor-pointer border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${
          state.currentBrush === 'yes' ? 'bg-[#F79E00] text-black font-black' : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D]'
        }">
          Attending (Yes)
        </button>
        <button id="btn-brush-maybe" type="button" class="px-3.5 py-1.5 rounded-none font-black transition cursor-pointer border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${
          state.currentBrush === 'maybe' ? 'bg-[#38BDF8] text-black font-black' : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D]'
        }">
          Maybe
        </button>
        <button id="btn-brush-no" type="button" class="px-3.5 py-1.5 rounded-none font-black transition cursor-pointer border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${
          state.currentBrush === 'no' ? 'bg-[#FF5E5B] text-black font-black' : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D]'
        }">
          Not Attending (No)
        </button>
      </div>

      <!-- Grid Matrix -->
      <div id="availability-grid-container" class="overflow-x-auto pb-2 no-select touch-none">
        <div class="inline-block min-w-full align-middle">
          <div class="flex justify-center">
            <table class="border-collapse touch-none">
              <thead>
                <tr>
                  <th class="w-16 p-2 text-right text-xs font-black text-white"></th>
                  ${dates.map((dateKey) => {
                    const sample = slots.find((s) => s.dateKey === dateKey);
                    if (activeEvt.dateMode === 'dates') {
                      return `
                        <th class="px-3 py-1.5 text-center border-b-[3px] border-black bg-[#2D2D2D]">
                          <div class="text-xs font-black text-white whitespace-nowrap">${sample?.displayDate || dateKey}</div>
                          <div class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">${sample?.dayOfWeek || ''}</div>
                        </th>
                      `;
                    }
                    return `
                      <th class="px-3 py-2 text-center font-black text-sm text-white border-b-[3px] border-black bg-[#2D2D2D]">
                        ${sample?.dayShort || dateKey}
                      </th>
                    `;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${times.map((timeStr) => {
                  const sampleSlot = slots.find((s) => s.timeStr === timeStr);
                  const isHourStart = sampleSlot ? sampleSlot.minutes % 60 === 0 : true;
                  return `
                    <tr>
                      <td class="pr-3 py-1 text-right text-xs font-black text-zinc-300 align-middle whitespace-nowrap">
                        ${isHourStart ? sampleSlot.displayTime : ''}
                      </td>
                      ${dates.map((dateKey) => {
                        const slotId = `${dateKey}T${timeStr}`;
                        const slotState = userSlots[slotId] || 'no';

                        let cellBg = 'bg-[#2D2D2D]';
                        if (slotState === 'yes') cellBg = 'bg-[#F79E00] text-black font-black';
                        if (slotState === 'maybe') cellBg = 'bg-[#38BDF8] text-black font-black';

                        return `
                          <td 
                            data-slot-id="${slotId}"
                            class="paint-grid-cell w-20 h-8 border border-black cursor-pointer transition text-center text-xs ${cellBg} ${
                              isHourStart ? 'border-t-2 border-t-black' : 'grid-slot-dashed'
                            }"
                          >
                          </td>
                        `;
                      }).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- User Name Input & Submit Button -->
      <div class="pt-3.5 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-xs font-black text-white whitespace-nowrap">Your Name:</label>
          <input 
            id="input-user-name"
            type="text"
            value="${state.identity.name}"
            class="bg-[#2D2D2D] border-2 border-black rounded px-3 py-1.5 text-white text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#F79E00] shadow-[2px_2px_0px_0px_#000]"
          />
        </div>
        <button 
          id="btn-submit-availability"
          type="button"
          class="w-full sm:w-auto px-8 py-2.5 rounded border-[3px] border-black shadow-[3px_3px_0px_0px_#000] ${
            state.submitSuccessEventId === activeEvt.id 
              ? 'bg-[#153a21] text-emerald-400 font-black shadow-[1.5px_1.5px_0px_0px_#000] translate-x-[1.5px] translate-y-[1.5px]' 
              : 'bg-[#F79E00] hover:bg-[#FFB833] text-black active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_0px_#000] font-black'
          } text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>${state.submitSuccessEventId === activeEvt.id ? 'Submitted!' : 'Submit'}</span>
        </button>
      </div>
    </div>
  `;
}

// 7. Group Heatmap Tab
export function renderGroupHeatmapTab(activeEvt, slots) {
  const dates = Array.from(new Set(slots.map((s) => s.dateKey)));
  const times = Array.from(new Set(slots.map((s) => s.timeStr)));
  const eventAvails = state.availabilities[activeEvt.id] || {};
  const totalUsers = Object.keys(eventAvails).length;

  return `
    <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-5 text-white">
      <div class="text-center space-y-1">
        <h3 class="text-lg font-black text-white">Group Availability Heatmap</h3>
      </div>

      ${totalUsers === 0 ? `
        <div class="text-center py-12 px-4 bg-[#2D2D2D] rounded-lg border-[3px] border-dashed border-black shadow-[4px_4px_0px_0px_#000]">
          <p class="text-sm font-black text-white">No group responses recorded yet.</p>
          <p class="text-xs text-zinc-400 mt-1">Switch to "Your availability" to submit your availability!</p>
        </div>
      ` : `
        <div class="overflow-x-auto pb-2 no-select">
          <div class="flex justify-center">
            <table class="border-collapse">
              <thead>
                <tr>
                  <th class="w-16 p-2 text-right text-xs font-black text-white"></th>
                  ${dates.map((dateKey) => {
                    const sample = slots.find((s) => s.dateKey === dateKey);
                    if (activeEvt.dateMode === 'dates') {
                      return `
                        <th class="px-3 py-1.5 text-center border-b-[3px] border-black bg-[#2D2D2D]">
                          <div class="text-xs font-black text-white whitespace-nowrap">${sample?.displayDate || dateKey}</div>
                          <div class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">${sample?.dayOfWeek || ''}</div>
                        </th>
                      `;
                    }
                    return `
                      <th class="px-3 py-2 text-center font-black text-sm text-white border-b-[3px] border-black bg-[#2D2D2D]">
                        ${sample?.dayShort || dateKey}
                      </th>
                    `;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${times.map((timeStr) => {
                  const sampleSlot = slots.find((s) => s.timeStr === timeStr);
                  const isHourStart = sampleSlot ? sampleSlot.minutes % 60 === 0 : true;

                  return `
                    <tr>
                      <td class="pr-3 py-1 text-right text-xs font-black text-zinc-300 align-middle whitespace-nowrap">
                        ${isHourStart ? sampleSlot.displayTime : ''}
                      </td>
                      ${dates.map((dateKey) => {
                        const slotId = `${dateKey}T${timeStr}`;
                        let yesCount = 0;
                        let maybeCount = 0;
                        Object.values(eventAvails).forEach((u) => {
                          const st = u.slots?.[slotId] || 'no';
                          if (st === 'yes') yesCount++;
                          if (st === 'maybe') maybeCount++;
                        });

                        let cellBg = '';
                        let cellStyle = '';
                        let textColor = 'text-zinc-500 font-bold';

                        if (yesCount + maybeCount === 0) {
                          cellBg = 'bg-[#2D2D2D]';
                        } else {
                          const opacity = (yesCount * 1.0 + maybeCount * 0.25) / totalUsers;
                          const finalOpacity = Math.max(0.15, Math.min(1.0, opacity));
                          // using new premium gold color F79E00 which is rgb(247, 158, 0)
                          cellStyle = `background-color: rgba(247, 158, 0, ${finalOpacity});`;
                          textColor = 'text-black font-black';
                        }

                        return `
                          <td 
                            data-heatmap-slot="${slotId}"
                            class="heatmap-cell w-20 h-8 border border-black cursor-pointer transition text-center text-xs ${cellBg} ${textColor} ${
                              isHourStart ? 'border-t-2 border-t-black' : ''
                            }"
                            ${cellStyle ? `style="${cellStyle}"` : ''}
                          >
                            ${yesCount}/${totalUsers}
                          </td>
                        `;
                      }).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>
  `;
}

// 8. Top Recommended Times Tab
export function renderTopTimesTab(activeEvt, slots) {
  const eventAvails = state.availabilities[activeEvt.id] || {};
  const users = Object.values(eventAvails);
  const isCreator = !activeEvt.createdBy || activeEvt.createdBy === state.identity.addr;

  if (users.length === 0) {
    return `
      <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-8 text-center text-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p class="font-black text-sm text-white">No responses submitted yet to calculate top recommended times.</p>
      </div>
    `;
  }

  // Calculate scores per slot
  const rankedSlots = slots.map((slot) => {
    let yesCount = 0;
    let maybeCount = 0;
    let noCount = 0;
    const yesUsers = [];
    const maybeUsers = [];
    const noUsers = [];

    users.forEach((u) => {
      const st = u.slots?.[slot.id] || 'no';
      if (st === 'yes') {
        yesCount++;
        yesUsers.push(u.userName);
      } else if (st === 'maybe') {
        maybeCount++;
        maybeUsers.push(u.userName);
      } else {
        noCount++;
        noUsers.push(u.userName);
      }
    });

    const score = yesCount * 2 + maybeCount;
    return { slot, yesCount, maybeCount, noCount, score, yesUsers, maybeUsers, noUsers };
  });

  // Only keep slots that have at least 1 attendee available
  const availableSlots = rankedSlots.filter((item) => item.score > 0);

  if (availableSlots.length === 0) {
    return `
      <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-8 text-center text-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p class="font-black text-sm text-white">No positive availability submitted yet for any time slot.</p>
      </div>
    `;
  }

  availableSlots.sort((a, b) => b.score - a.score || b.yesCount - a.yesCount);
  const topTimes = availableSlots.slice(0, 3);

  return `
    <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4 text-white">
      <h3 class="text-lg font-black text-white text-center">Top Recommended Times</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${topTimes.map((item, idx) => {
          const isFinal = activeEvt.finalSlotId === item.slot.id;
          const cardBg = isFinal ? 'bg-[#153a21] text-emerald-400' : 'bg-[#2D2D2D] text-white';
          const shadowColor = 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';

          return `
            <div class="${cardBg} border-[3px] border-black rounded-xl p-4 space-y-4 relative flex flex-col justify-between ${shadowColor}">
              <div>
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-[#F79E00] text-black border-2 border-black">
                    Rank #${idx + 1}
                  </span>
                  ${isFinal ? `
                    <span class="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-emerald-400 text-black border-2 border-black">
                      Final Choice
                    </span>
                  ` : ''}
                </div>
                <h4 class="text-base font-black ${isFinal ? 'text-white' : 'text-white'} mt-2.5">${item.slot.displayDate}</h4>
                <div class="text-lg font-black text-[#F79E00] mt-1">${item.slot.displayTime}</div>
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between font-black text-[11px]">
                  <span class="flex items-center gap-1.5 ${isFinal ? 'text-zinc-200' : 'text-zinc-300'}">
                    <span class="w-3 h-3 bg-[#F79E00] border border-black inline-block"></span>
                    Available: ${item.yesCount}/${users.length}
                  </span>
                  <span class="flex items-center gap-1.5 ${isFinal ? 'text-zinc-200' : 'text-zinc-300'}">
                    <span class="w-3 h-3 bg-[#38BDF8] border border-black inline-block"></span>
                    Maybe: ${item.maybeCount}
                  </span>
                </div>
                <div class="w-full h-4 rounded-none bg-[#1E1E1E] overflow-hidden flex border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <div class="bg-[#F79E00] h-full transition-all duration-300 border-r border-black" style="width: ${(item.yesCount / users.length) * 100}%;" title="${item.yesCount} Available"></div>
                  <div class="bg-[#38BDF8] h-full transition-all duration-300" style="width: ${(item.maybeCount / users.length) * 100}%;" title="${item.maybeCount} Maybe"></div>
                </div>
              </div>

              <div class="space-y-2 pt-2 border-t-2 border-black/10">
                <button 
                  data-slot-details="${item.slot.id}"
                  type="button"
                  class="btn-slot-details w-full py-2 bg-[#1E1E1E] hover:bg-[#252525] text-white font-black text-xs rounded border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  View Details
                </button>

                ${isCreator && !activeEvt.finalSlotId ? `
                  <button 
                    data-pick-final="${item.slot.id}"
                    type="button"
                    class="btn-pick-final w-full py-2 bg-[#F79E00] hover:bg-[#FFB833] text-black font-black text-xs rounded border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
                  >
                    Pick as Final Event Time
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// 9. RSVP Tally Tab
export function renderParticipantsTab(activeEvt) {
  const eventAvails = state.availabilities[activeEvt.id] || {};
  const users = Object.values(eventAvails);

  return `
    <div class="max-w-2xl mx-auto">
      <div class="bg-[#1E1E1E] border-[3px] border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4 text-white">
        <div class="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 class="text-base font-black text-white">Group Responses</h3>
          <span class="text-xs font-bold text-zinc-300">${users.length} Total Responses</span>
        </div>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${users.length === 0 ? `
            <p class="text-xs text-zinc-400 italic font-bold">No responses yet.</p>
          ` : users.map((u) => {
            const freeCount = Object.values(u.slots || {}).filter((s) => s === 'yes').length;
            const maybeCount = Object.values(u.slots || {}).filter((s) => s === 'maybe').length;
            return `
              <div class="p-3 bg-[#2D2D2D] border-2 border-black rounded shadow-[2px_2px_0px_0px_#000] flex items-center justify-between text-xs text-white">
                <div>
                  <div class="font-black text-white">${u.userName}</div>
                  <div class="text-[10px] text-zinc-400 font-bold">${u.userAddr}</div>
                </div>
                <div class="text-right">
                  <span class="font-black text-black bg-[#F79E00] px-2 py-0.5 border-2 border-black rounded-sm shadow-[1px_1px_0px_0px_#000]">
                    ${freeCount} Free
                  </span>
                  ${maybeCount > 0 ? `<span class="block text-[10px] text-[#38BDF8] font-black mt-1.5">+${maybeCount} Maybe</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// 10. Final Meeting Banner
export function renderFinalTimeBanner(activeEvt, slots) {
  const finalSlot = slots.find((s) => s.id === activeEvt.finalSlotId);
  if (!finalSlot) return '';
  const isCreator = !activeEvt.createdBy || activeEvt.createdBy === state.identity.addr;

  return `
    <div class="bg-[#153a21] border-[3px] border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_#000] text-white space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping"></span>
          <span class="text-xs font-black text-emerald-400 uppercase tracking-widest">Confirmed Slot Picker</span>
        </div>
        <div class="flex items-center gap-2">
          ${isCreator ? `
            <button id="btn-change-final" type="button" class="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white border-2 border-black font-black text-[10px] rounded shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] cursor-pointer">
              Change Time
            </button>
            <button id="btn-cancel-final" type="button" class="px-2.5 py-1 bg-[#FF5E5B] hover:bg-[#FF8A88] text-black border-2 border-black font-black text-[10px] rounded shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] cursor-pointer">
              Cancel Slot
            </button>
          ` : ''}
        </div>
      </div>
      <div class="text-base font-black text-emerald-400">
        ${finalSlot.displayDate} @ ${finalSlot.displayTime} (${activeEvt.timezone})
      </div>
    </div>
  `;
}
