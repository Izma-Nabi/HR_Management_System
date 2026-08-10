<script setup>
import { computed } from "vue";

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({})
  }
});

const cards = computed(() => [
  {
    key: "total",
    label: "Total workforce",
    value: props.summary.total ?? 0,
    accent: "#2563eb",
    bg: "#dbeafe",
    icon: "clipboard"
  },
  {
    key: "present",
    label: "Present",
    value: props.summary.present ?? 0,
    accent: "#2563eb",
    bg: "#dbeafe",
    icon: "check"
  },
  {
    key: "absent",
    label: "Absent",
    value: props.summary.absent ?? 0,
    accent: "#bd3f3f",
    bg: "#fce8e5",
    icon: "close"
  },
  {
    key: "late",
    label: "Late",
    value: props.summary.late ?? 0,
    accent: "#a76518",
    bg: "#fff0d7",
    icon: "clock"
  },
  {
    key: "leave",
    label: "Leave",
    value: props.summary.leave ?? 0,
    accent: "#2c678d",
    bg: "#e3eff6",
    icon: "palm"
  }
]);
</script>

<template>
  <div class="summary-row">
    <div
      v-for="(card, index) in cards"
      :key="card.key"
      class="summary-card"
      :style="{ '--accent': card.accent, '--bg': card.bg, '--i': index }"
    >
      <div class="icon-wrap">
        <svg v-if="card.icon === 'clipboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="12" height="17" rx="2" />
          <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
          <path d="M9 11h6M9 15h6" />
        </svg>

        <svg v-else-if="card.icon === 'check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.3 2.3L15.5 9.5" />
        </svg>

        <svg v-else-if="card.icon === 'close'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
        </svg>

        <svg v-else-if="card.icon === 'clock'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>

        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21c4-1 6-4 6-8" />
          <path d="M9 13c0-5 4-9 9-9-1 4-2 8-6 9-1.5 4-4 6-8 7" />
        </svg>
      </div>

      <p class="label">{{ card.label }}</p>
      <h2 class="value">{{ card.value }}</h2>

      <div class="bar"></div>
    </div>
  </div>
</template>

<style scoped>
.summary-row {
  display: flex;
  gap: 16px;
  width: 100%;
  overflow-x: auto;
  align-items: stretch;
  padding-bottom: 4px;
}

.summary-card {
  position: relative;
  min-width: 150px;
  flex: 1 1 0;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  padding: 22px 18px;
  text-align: center;
  overflow: hidden;
  opacity: 0;
  transform: translateY(10px);
  animation: card-in 0.4s ease forwards;
  animation-delay: calc(var(--i) * 70ms);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: default;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(16, 24, 40, 0.08);
  border-color: var(--accent);
}

.summary-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% -10%, var(--bg), transparent 70%);
  opacity: 0.7;
  pointer-events: none;
}

.icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  border-radius: 12px;
  background: var(--bg);
  color: var(--accent);
  transition: transform 0.2s ease;
}

.summary-card:hover .icon-wrap {
  transform: scale(1.08) rotate(-4deg);
}

.icon-wrap svg {
  width: 22px;
  height: 22px;
}

.label {
  position: relative;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.02em;
}

.value {
  position: relative;
  margin: 6px 0 0;
  font-size: 30px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
  animation: pop 0.35s ease forwards;
  animation-delay: calc(var(--i) * 70ms + 0.15s);
}

.bar {
  position: relative;
  height: 3px;
  width: 28px;
  margin: 12px auto 0;
  border-radius: 999px;
  background: var(--accent);
  opacity: 0.35;
  transition: width 0.25s ease, opacity 0.25s ease;
}

.summary-card:hover .bar {
  width: 48px;
  opacity: 0.9;
}

@keyframes card-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pop {
  0% {
    transform: scale(0.85);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-card,
  .value {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>

<style scoped>
.summary-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  overflow: visible;
}

.summary-card {
  min-width: 0;
  padding: 17px;
  text-align: left;
  background: var(--surface);
  border-color: var(--line);
  border-radius: 14px;
  box-shadow: none;
}

.summary-card::before {
  background: linear-gradient(145deg, transparent 35%, var(--bg));
  opacity: 0.56;
}

.summary-card:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  box-shadow: 0 12px 28px rgba(16, 37, 43, 0.08);
  transform: translateY(-2px);
}

.icon-wrap {
  width: 38px;
  height: 38px;
  margin: 0 0 18px;
  border-radius: 11px;
}

.icon-wrap svg {
  width: 19px;
  height: 19px;
}

.summary-card:hover .icon-wrap {
  transform: none;
}

.label {
  color: var(--ink-500);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.value {
  margin-top: 4px;
  color: var(--ink-950);
  font-family: var(--font-display);
  font-size: 29px;
}

.bar {
  width: 22px;
  margin: 12px 0 0;
}

.summary-card:hover .bar {
  width: 42px;
}

@media (max-width: 1180px) {
  .summary-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card:first-child {
    grid-column: 1 / -1;
  }
}
</style>
