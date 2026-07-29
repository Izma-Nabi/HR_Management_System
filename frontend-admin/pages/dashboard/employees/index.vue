<script setup lang="ts">

definePageMeta({
  layout: "dashboard"
});


const {
  dashboard,
  loading,
  error,
  fetchEmployeeDashboard
} = useEmployeeDashboard();



const user = computed(() => {
  return dashboard.value?.user || {};
});



const employeeAttendance = computed(() => {
  return dashboard.value?.sections?.employeeAttendance || {};
});



const today = computed(() => {
  return employeeAttendance.value.today || {};
});



const weekly = computed(() => {
  return employeeAttendance.value.weekly || {};
});



const entries = computed(() => {
  return employeeAttendance.value.entries || [];
});



// get first check in of today
const checkIn = computed(() => {

  const record = entries.value.find(
    (item:any) => item.eventType === "CHECK_IN"
  );

  return record?.eventTime || null;

});



// get last checkout of today
const checkOut = computed(() => {

  const record = [...entries.value]
    .reverse()
    .find(
      (item:any) => item.eventType === "CHECK_OUT"
    );

  return record?.eventTime || null;

});



// realtime working hours
const workingMinutes = computed(() => {


  if (!checkIn.value) {

    return today.value.workingMinutes || 0;

  }


  const start = new Date(checkIn.value);

  const end = checkOut.value
    ? new Date(checkOut.value)
    : new Date();


  const diff = Math.floor(
    (end.getTime() - start.getTime()) / 60000
  );


  return diff > 0 ? diff : 0;

});



const formatMinutes = (minutes:number)=>{

  const hours = Math.floor(minutes / 60);

  const mins = minutes % 60;


  return `${hours}h ${mins}m`;

};



// status
const attendanceStatus = computed(()=>{


  if(!checkIn.value){

    return "-";

  }


  if(today.value.lateMinutes > 0){

    return "LATE";

  }


  return "PRESENT";


});


const formatTime = (time:any)=>{

  if(!time){
    return "-";
  }


  const value =
    String(time)
      .replace("T"," ")
      .split(".")[0];


  const clock =
    value.split(" ")[1];


  if(!clock){
    return "-";
  }


  const [hour,minute] =
    clock.split(":");


  const date = new Date();


  date.setHours(
    Number(hour),
    Number(minute),
    0
  );


  return date.toLocaleTimeString(
    [],
    {
      hour:"2-digit",
      minute:"2-digit"
    }
  );

};

const attendanceDate = computed(()=>{


  if(entries.value.length){

    return entries.value[0].attendanceDate;

  }


  return null;


});



const formatDate = (value:any)=>{


  if(!value){

    return "-";

  }


  return new Date(value)
    .toLocaleDateString();


};



let refreshTimer:any = null;



onMounted(async()=>{


  await fetchEmployeeDashboard();



  refreshTimer=setInterval(()=>{


    fetchEmployeeDashboard({

      silent:true

    });


  },30000);



});



onUnmounted(()=>{


  if(refreshTimer){

    clearInterval(refreshTimer);

  }


});


</script>

<template>
  <div class="page-wrap">

    <!-- Header -->

    <div class="header-block">
      <h1 class="page-title">
        Welcome, {{ user.fullName || "User" }}
      </h1>

      <p class="page-subtitle">
        {{ user.role || "Employee" }} Dashboard
      </p>
    </div>


    <!-- Loading -->

    <div
      v-if="loading"
      class="state-panel"
    >
      <div class="spinner"></div>
      Loading dashboard...
    </div>


    <!-- Error -->

    <div
      v-else-if="error"
      class="state-panel error-panel"
    >
      {{ error }}
    </div>


    <template v-else>

      <!-- TODAY ATTENDANCE -->

      <div class="section-block">
        <h2 class="section-title">
          Today's Attendance
        </h2>


        <div class="stats-row">


          <!-- Check In -->

          <div class="card">
            <div class="card-icon icon-blue">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
            <p class="card-label">Check In</p>
            <h2 class="card-value">
              {{ formatTime(today.checkIn) }}
            </h2>
          </div>



          <!-- Check Out -->

          <div class="card">
            <div class="card-icon icon-rose">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p class="card-label">Check Out</p>
            <h2 class="card-value">
              {{ formatTime(today.checkOut) }}
            </h2>
          </div>



          <!-- Working -->

          <div class="card">
            <div class="card-icon icon-emerald">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p class="card-label">Working Hours</p>
            <h2 class="card-value">
              {{ formatMinutes(workingMinutes) }}
            </h2>
          </div>



          <!-- Late -->

          <div class="card">
            <div class="card-icon icon-amber">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p class="card-label">Late Minutes</p>
            <h2 class="card-value">
              {{ today.lateMinutes || 0 }} min
            </h2>
          </div>



          <!-- Extra -->

          <div class="card">
            <div class="card-icon icon-violet">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.24 7.76 2.83-2.83"/><path d="M18 12h4"/><path d="m16.24 16.24 2.83 2.83"/><path d="M12 18v4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M2 12h4"/><path d="m4.93 4.93 2.83 2.83"/></svg>
            </div>
            <p class="card-label">Extra Time</p>
            <h2 class="card-value">
              {{ formatMinutes(today.overtimeMinutes || 0) }}
            </h2>
          </div>


        </div>
      </div>





      <!-- TODAY DATE -->

      <div class="panel">

        <h2 class="panel-title">
          Attendance Date
        </h2>


        <p class="panel-text">
          {{ formatDate(today.date || new Date()) }}
        </p>

      </div>





      <!-- TODAY EVENTS -->

      <div class="panel table-panel">

        <div class="panel-header">

          <h2 class="panel-title">
            Today's Attendance Events
          </h2>

        </div>



        <div class="table-scroll">

        <table class="events-table">

          <thead>

            <tr>

              <th>
                Event
              </th>


              <th>
                Time
              </th>

            </tr>

          </thead>



          <tbody>

            <tr
              v-for="item in entries"
              :key="item.id"
            >

              <td>
                <span
                  class="event-badge"
                  :class="item.eventType === 'CHECK_IN' ? 'badge-in' : 'badge-out'"
                >
                  {{ item.eventType }}
                </span>
              </td>


              <td class="event-time">
                {{ formatTime(item.eventTime) }}
              </td>

            </tr>



            <tr v-if="entries.length === 0">

              <td
                colspan="2"
                class="empty-state"
              >
                No attendance events today.
              </td>

            </tr>


          </tbody>

        </table>

        </div>

      </div>


    </template>


  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 4px;
}

/* Header */
.header-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: #6b7280;
  font-size: 15px;
}

/* Loading / error states */
.state-panel {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  color: #6b7280;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 500;
}

.error-panel {
  background: #fef2f2;
  color: #dc2626;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Section */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
}

/* Stats row - always horizontal in a single line */
.stats-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.stats-row::-webkit-scrollbar {
  height: 6px;
}

.stats-row::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 999px;
}

.card {
  flex: 1 1 0;
  min-width: 170px;
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

.icon-blue {
  background: #eef2ff;
  color: #4f46e5;
}

.icon-rose {
  background: #fef2f2;
  color: #e11d48;
}

.icon-emerald {
  background: #ecfdf5;
  color: #059669;
}

.icon-amber {
  background: #fffbeb;
  color: #d97706;
}

.icon-violet {
  background: #f5f3ff;
  color: #7c3aed;
}

.card-label {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Generic panel */
.panel {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  padding: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.panel-text {
  color: #6b7280;
  margin-top: 8px;
  font-size: 14px;
}

.table-panel {
  padding: 0;
  overflow: hidden;
}

.panel-header {
  padding: 20px 20px 12px;
}

.table-scroll {
  overflow-x: auto;
}

/* Table */
.events-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.events-table thead {
  background: #f9fafb;
}

.events-table th {
  text-align: left;
  padding: 12px 20px;
  color: #6b7280;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.events-table td {
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  color: #111827;
}

.event-time {
  color: #374151;
  font-variant-numeric: tabular-nums;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-in {
  background: #ecfdf5;
  color: #059669;
}

.badge-out {
  background: #fef2f2;
  color: #e11d48;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .card {
    min-width: 150px;
  }

  .card-value {
    font-size: 19px;
  }
}
</style>