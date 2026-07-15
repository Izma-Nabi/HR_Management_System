<script setup>
defineProps({
  summary: {
    type: Object,
    default: () => ({})
  }
});
</script>

<template>

<div
  style="display:flex; gap:16px; width:100%; overflow-x:auto; align-items:stretch;"
>

  <!-- Total -->
  <div
    style="min-width:150px; flex:1 1 0; background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05); padding:20px; text-align:center;"
  >
    <div style="font-size:30px; margin-bottom:8px;">📋</div>
    <p style="font-size:14px; color:#6b7280;">Total</p>
    <h2 style="font-size:30px; font-weight:700; margin-top:8px;">
      {{ summary.total ?? 0 }}
    </h2>
  </div>

  <!-- Present -->
  <div
    style="min-width:150px; flex:1 1 0; background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05); padding:20px; text-align:center;"
  >
    <div style="font-size:30px; margin-bottom:8px;">✅</div>
    <p style="font-size:14px; color:#16a34a;">Present</p>
    <h2 style="font-size:30px; font-weight:700; color:#16a34a; margin-top:8px;">
      {{ summary.present ?? 0 }}
    </h2>
  </div>

  <!-- Absent -->
  <div
    style="min-width:150px; flex:1 1 0; background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05); padding:20px; text-align:center;"
  >
    <div style="font-size:30px; margin-bottom:8px;">❌</div>
    <p style="font-size:14px; color:#dc2626;">Absent</p>
    <h2 style="font-size:30px; font-weight:700; color:#dc2626; margin-top:8px;">
      {{ summary.absent ?? 0 }}
    </h2>
  </div>

  <!-- Late -->
  <div
    style="min-width:150px; flex:1 1 0; background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05); padding:20px; text-align:center;"
  >
    <div style="font-size:30px; margin-bottom:8px;">⏰</div>
    <p style="font-size:14px; color:#ca8a04;">Late</p>
    <h2 style="font-size:30px; font-weight:700; color:#ca8a04; margin-top:8px;">
      {{ summary.late ?? 0 }}
    </h2>
  </div>

  <!-- Leave -->
  <div
    style="min-width:150px; flex:1 1 0; background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05); padding:20px; text-align:center;"
  >
    <div style="font-size:30px; margin-bottom:8px;">🌴</div>
    <p style="font-size:14px; color:#2563eb;">Leave</p>
    <h2 style="font-size:30px; font-weight:700; color:#2563eb; margin-top:8px;">
      {{ summary.leave ?? 0 }}
    </h2>
  </div>

</div>

</template>