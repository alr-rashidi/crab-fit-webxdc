import { state, ALL_TIMEZONES } from '../state.js';
import { formatMinutesTo12H } from '../helpers.js';

// 4. Create Event Form
export function renderCreateEventForm() {
  const form = state.createForm;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayIdx = form.firstDayOfWeekIndex || 0;

  // Build week headers starting from firstDayIdx
  const weekHeaders = [];
  for (let i = 0; i < 7; i++) {
    weekHeaders.push(daysOfWeekNames[(firstDayIdx + i) % 7]);
  }

  // Calendar cells generation
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const daysInMonth = new Date(form.currentYear, form.currentMonth + 1, 0).getDate();
  const startingDay = new Date(form.currentYear, form.currentMonth, 1).getDay();
  const prevMonthDays = new Date(form.currentYear, form.currentMonth, 0).getDate();

  const padCount = (startingDay - firstDayIdx + 7) % 7;

  const calendarCells = [];
  // Prev month padding
  for (let i = padCount - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevM = form.currentMonth === 0 ? 11 : form.currentMonth - 1;
    const prevY = form.currentMonth === 0 ? form.currentYear - 1 : form.currentYear;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum, isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${form.currentYear}-${String(form.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }
  // Next month padding
  const totalCells = Math.ceil(calendarCells.length / 7) * 7;
  const nextPadding = totalCells - calendarCells.length;
  for (let i = 1; i <= nextPadding; i++) {
    const nextM = form.currentMonth === 11 ? 0 : form.currentMonth + 1;
    const nextY = form.currentMonth === 11 ? form.currentYear + 1 : form.currentYear;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: i, isCurrentMonth: false });
  }

  // Slider math
  const startPct = (form.startMinutes / 1440) * 100;
  const endPct = (form.endMinutes / 1440) * 100;

  const isTitleEmpty = !form.title || !form.title.trim();

  return `
    <div class="max-w-md mx-auto bg-[#1E1E1E] border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 text-white">
      <div class="border-b-[3px] border-black pb-3">
        <h2 class="text-xl font-black text-white">Create New Event</h2>
      </div>

      <!-- Section 1: Event Name -->
      <div class="space-y-1">
        <label class="block text-base font-black text-white">Give your event a name!</label>
        <input 
          id="input-event-title"
          type="text"
          value="${form.title}"
          placeholder="e.g. Board Games Night, Team Huddle"
          class="w-full bg-[#2D2D2D] border-[3px] border-black rounded px-3 py-2 text-white text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#F79E00] placeholder:text-zinc-500"
        />
      </div>

      <!-- Section 2: Dates Selection -->
      <div class="space-y-3">
        <div>
          <label class="block text-base font-black text-white">What dates might work?</label>
        </div>

        <!-- Date Mode Tabs -->
        <div class="grid grid-cols-2 border-[3px] border-black rounded overflow-hidden bg-[#2D2D2D]">
          <button 
            id="tab-mode-dates" 
            type="button"
            class="py-2.5 text-xs font-black transition cursor-pointer text-center ${
              form.dateMode === 'dates' ? 'bg-[#F79E00] text-black' : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D]'
            }">
            Specific dates
          </button>
          <button 
            id="tab-mode-days" 
            type="button"
            class="py-2.5 text-xs font-black transition cursor-pointer text-center ${
              form.dateMode === 'days' ? 'bg-[#F79E00] text-black border-l-[3px] border-black' : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D] border-l-[3px] border-black'
            }">
            Days of the week
          </button>
        </div>

        ${form.dateMode === 'dates' ? `
          <!-- Calendar View -->
          <div class="space-y-2">
            <!-- Month Header Nav -->
            <div class="flex items-center justify-between px-1">
              <button id="btn-prev-month" class="w-8 h-8 bg-[#F79E00] text-black font-black flex items-center justify-center hover:bg-[#FFB833] border-2 border-black rounded transition cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]">
                ‹
              </button>
              <h3 class="text-base font-black text-white">
                ${monthNames[form.currentMonth]} ${form.currentYear}
              </h3>
              <button id="btn-next-month" class="w-8 h-8 bg-[#F79E00] text-black font-black flex items-center justify-center hover:bg-[#FFB833] border-2 border-black rounded transition cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]">
                ›
              </button>
            </div>

            <!-- Calendar Grid Container -->
            <div class="relative">
              <button 
                id="btn-shift-start-left" 
                type="button" 
                title="Shift start day left" 
                class="absolute -left-3.5 sm:-left-4 top-1.5 z-20 w-6 h-10 rounded-none bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white font-black text-sm flex items-center justify-center transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none border-2 border-black"
              >
                ‹
              </button>
              <button 
                id="btn-shift-start-right" 
                type="button" 
                title="Shift start day right" 
                class="absolute -right-3.5 sm:-right-4 top-1.5 z-20 w-6 h-10 rounded-none bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white font-black text-sm flex items-center justify-center transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none border-2 border-black"
              >
                ›
              </button>

              <div class="border-[3px] border-black rounded-lg overflow-hidden bg-[#1E1E1E] no-select shadow-[4px_4px_0px_0px_#000]">
                <div class="grid grid-cols-7 border-b-2 border-black bg-[#2D2D2D] text-center text-xs font-black text-white py-2">
                  ${weekHeaders.map((day) => `<div>${day}</div>`).join('')}
                </div>
                <div class="grid grid-cols-7 text-center">
                  ${calendarCells.map((cell, idx) => {
                    const isSelected = form.selectedDates.includes(cell.dateStr);
                    const isToday = cell.dateStr === todayStr;
                    const isRight = (idx + 1) % 7 !== 0;
                    const isBottom = idx < calendarCells.length - 7;
                    return `
                      <div 
                        data-date="${cell.dateStr}"
                        class="calendar-day-cell py-2 px-0.5 text-sm font-black cursor-pointer transition flex flex-col items-center justify-center min-h-[44px] ${
                          isRight ? 'border-r border-black/30' : ''
                        } ${
                          isBottom ? 'border-b border-black/30' : ''
                        } ${
                          cell.isCurrentMonth
                            ? isSelected
                              ? 'bg-[#F79E00] text-black font-black'
                              : isToday
                              ? 'bg-[#F79E00]/25 text-white font-black ring-2 ring-inset ring-black'
                              : 'text-white hover:bg-[#2D2D2D] bg-[#1E1E1E]'
                            : isSelected
                            ? 'bg-[#F79E00]/55 text-black'
                            : 'text-zinc-500 hover:bg-[#2D2D2D] bg-[#1E1E1E]/50'
                        }">
                        <span class="leading-none">${cell.dayNum}</span>
                        ${isToday ? `
                          <span class="text-[8px] font-black uppercase tracking-tighter leading-none mt-0.5 text-[#F79E00]">
                            Today
                          </span>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>
        ` : `
          <!-- Days of Week Mode -->
          <div class="relative">
            <button 
              id="btn-shift-start-left" 
              type="button" 
              title="Shift start day left" 
              class="absolute -left-3.5 sm:-left-4 top-2 z-20 w-6 h-10 rounded-none bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white font-black text-sm flex items-center justify-center transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none border-2 border-black"
            >
              ‹
            </button>
            <button 
              id="btn-shift-start-right" 
              type="button" 
              title="Shift start day right" 
              class="absolute -right-3.5 sm:-right-4 top-2 z-20 w-6 h-10 rounded-none bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white font-black text-sm flex items-center justify-center transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] select-none border-2 border-black"
            >
              ›
            </button>

            <div class="grid grid-cols-7 gap-1.5 border-[3px] border-black rounded p-1.5 bg-[#1E1E1E] shadow-[4px_4px_0px_0px_#000]">
              ${weekHeaders.map((day) => {
                const isSelected = form.selectedDays.includes(day);
                return `
                  <button 
                    data-day="${day}"
                    type="button"
                    class="btn-day-of-week py-2.5 rounded-none text-xs font-black border-2 border-black transition cursor-pointer text-center shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] ${
                      isSelected
                        ? 'bg-[#F79E00] text-black'
                        : 'bg-[#2D2D2D] text-zinc-300 hover:bg-[#3D3D3D]'
                    }">
                    ${day}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `}
      </div>

      <!-- Section 3: Times Selection Slider -->
      <div class="space-y-2">
        <div>
          <label class="block text-base font-black text-white">What times might work?</label>
        </div>

        <div class="pt-6 pb-2">
          <div id="time-slider-bar" class="w-full h-9 bg-[#2D2D2D] border-[3px] border-black rounded relative select-none cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div 
              id="time-slider-fill"
              class="absolute top-0 bottom-0 bg-[#F79E00] border-r-2 border-black"
              style="left: ${startPct}%; width: ${endPct - startPct}%;"
            ></div>
            
             <!-- Left Handle -->
            <div 
              id="slider-handle-start"
              class="w-5 h-12 bg-[#F79E00] border-[3px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-ew-resize absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center z-10 touch-none"
              style="left: ${startPct}%;"
            >
              <div class="text-[9px] text-black font-black tracking-tighter">|||</div>
              <div id="slider-label-start" class="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black text-white whitespace-nowrap bg-[#2D2D2D] border-2 border-black px-1.5 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_#000]">
                ${formatMinutesTo12H(form.startMinutes)}
              </div>
            </div>

            <!-- Right Handle -->
            <div 
              id="slider-handle-end"
              class="w-5 h-12 bg-[#F79E00] border-[3px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-ew-resize absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center z-10 touch-none"
              style="left: ${endPct}%;"
            >
              <div class="text-[9px] text-black font-black tracking-tighter">|||</div>
              <div id="slider-label-end" class="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black text-white whitespace-nowrap bg-[#2D2D2D] border-2 border-black px-1.5 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_#000]">
                ${formatMinutesTo12H(form.endMinutes)}
              </div>
            </div>
          </div>
          <!-- Time Scale Ticks -->
          <div class="flex justify-between text-[10px] font-black text-zinc-400 px-1 mt-2 select-none">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
        </div>
      </div>

      <!-- Section 4: Timezone Select -->
      <div class="space-y-1">
        <label class="block text-base font-black text-white">And the timezone</label>
        <div class="relative">
          <input 
            id="input-timezone"
            type="text"
            list="timezones-list"
            value="${form.timezone}"
            placeholder="e.g. Asia/Tehran, America/New_York, Europe/London"
            class="w-full bg-[#2D2D2D] border-[3px] border-black rounded px-3 py-2 text-white text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#F79E00]"
          />
          <datalist id="timezones-list">
            ${ALL_TIMEZONES.map((tz) => `<option value="${tz}">${tz}</option>`).join('')}
          </datalist>
        </div>
      </div>

      <!-- Section 5: Submit Button -->
      <div class="pt-2 flex justify-center">
        <button 
          id="btn-create-event"
          type="button"
          ${isTitleEmpty ? 'disabled' : ''}
          class="px-8 py-3 bg-[#F79E00] hover:bg-[#FFB833] text-black font-black text-sm rounded border-[3px] border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer tracking-wider uppercase disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          Create Event
        </button>
      </div>
    </div>
  `;
}
