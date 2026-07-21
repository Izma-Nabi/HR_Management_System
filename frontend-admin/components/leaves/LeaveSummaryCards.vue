<script setup lang="ts">
defineProps<{
  summary: {
    pending: number;
    approved: number;
    rejected: number;
    totalDays: number;
  };
}>();
</script>

<template>
  <div class="summary-grid">
    <section class="summary-card pending">
      <span>Pending</span>
      <strong>{{ summary.pending }}</strong>
    </section>

    <section class="summary-card approved">
      <span>Approved</span>
      <strong>{{ summary.approved }}</strong>
    </section>

    <section class="summary-card rejected">
      <span>Rejected</span>
      <strong>{{ summary.rejected }}</strong>
    </section>

    <section class="summary-card days">
      <span>Approved Days</span>
      <strong>{{ summary.totalDays }}</strong>
    </section>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  min-height: 92px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #6b7280;
  border-radius: 8px;
}

.summary-card span {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-card strong {
  color: #111827;
  font-size: 30px;
}

.summary-card.pending {
  border-left-color: #d97706;
}

.summary-card.approved {
  border-left-color: #15803d;
}

.summary-card.rejected {
  border-left-color: #dc2626;
}

.summary-card.days {
  border-left-color: #2563eb;
}

@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>