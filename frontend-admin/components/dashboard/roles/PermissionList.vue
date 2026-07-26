<script setup lang="ts">
import { ref, computed } from "vue";

interface Permission {
  id: number;
  permissionName: string;
}

const props = defineProps({
  permissions: {
    type: Array as () => Permission[],
    default: () => [],
  },
});

const selected = defineModel<number[]>({
  default: [],
});

const search = ref("");
const openSections = ref<string[]>([]);

const GROUP_ORDER = [
  "User Management",
  "Role Management",
  "Department Management",
  "Leave Management",
  "Attendance Management",
  "Other",
];

const GROUP_ICONS: Record<string, string> = {
  "User Management": "user",
  "Role Management": "shield",
  "Department Management": "building",
  "Leave Management": "calendar",
  "Attendance Management": "clock",
  Other: "dots",
};

function resolveGroup(name: string) {
  if (name.includes("USER") || name.includes("EMPLOYEE") || name.includes("ADMIN")) {
    return "User Management";
  }
  if (name.includes("ROLE") || name.includes("PERMISSION")) {
    return "Role Management";
  }
  if (name.includes("DEPARTMENT")) {
    return "Department Management";
  }
  if (name.includes("LEAVE")) {
    return "Leave Management";
  }
  if (name.includes("ATTENDANCE")) {
    return "Attendance Management";
  }
  return "Other";
}

function formatLabel(name: string) {
  return name
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  props.permissions.forEach((permission) => {
    const group = resolveGroup(permission.permissionName);
    if (!groups[group]) groups[group] = [];
    groups[group].push(permission);
  });

  const ordered: Record<string, Permission[]> = {};
  GROUP_ORDER.forEach((key) => {
    if (groups[key]?.length) ordered[key] = groups[key];
  });
  Object.keys(groups).forEach((key) => {
    if (!ordered[key]) ordered[key] = groups[key];
  });

  return ordered;
});

const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return groupedPermissions.value;

  const result: Record<string, Permission[]> = {};
  Object.entries(groupedPermissions.value).forEach(([title, items]) => {
    const matches = items.filter((item) =>
      formatLabel(item.permissionName).toLowerCase().includes(query)
    );
    if (matches.length) result[title] = matches;
  });
  return result;
});

const hasResults = computed(() => Object.keys(filteredGroups.value).length > 0);

function toggleSection(name: string) {
  openSections.value = openSections.value.includes(name)
    ? openSections.value.filter((item) => item !== name)
    : [...openSections.value, name];
}

function isOpen(name: string) {
  return openSections.value.includes(name);
}

function togglePermission(id: number) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id];
}

function isChecked(id: number) {
  return selected.value.includes(id);
}

function toggleAll(items: Permission[]) {
  const ids = items.map((item) => item.id);
  const allSelected = ids.every((id) => selected.value.includes(id));

  selected.value = allSelected
    ? selected.value.filter((id) => !ids.includes(id))
    : [...new Set([...selected.value, ...ids])];
}

function isAllChecked(items: Permission[]) {
  return items.length > 0 && items.every((item) => selected.value.includes(item.id));
}

function isIndeterminate(items: Permission[]) {
  const count = items.filter((item) => selected.value.includes(item.id)).length;
  return count > 0 && count < items.length;
}

function selectedCount(items: Permission[]) {
  return items.filter((item) => selected.value.includes(item.id)).length;
}

const totalSelected = computed(() => selected.value.length);
const totalPermissions = computed(() => props.permissions.length);
</script>

<template>
  <div class="permissions-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-subtitle">
          {{ totalSelected }} of {{ totalPermissions }} selected
        </span>
      </div>

      <div class="search-box">
        <svg viewBox="0 0 20 20" fill="none" class="search-icon">
          <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
          <path d="M14 14L17.5 17.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search permissions…"
          class="search-input"
        />
        <button
          v-if="search"
          class="clear-btn"
          type="button"
          aria-label="Clear search"
          @click="search = ''"
        >
          ×
        </button>
      </div>
    </div>

    <div v-if="!hasResults" class="empty-state">
      <p>No permissions match “{{ search }}”.</p>
    </div>

    <div v-else class="groups">
      <div
        v-for="(items, title) in filteredGroups"
        :key="title"
        class="group"
        :class="{ 'is-open': isOpen(title) }"
      >
        <button type="button" class="group-header" @click="toggleSection(title)">
          <span class="chevron" :class="{ open: isOpen(title) }">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>

          <span class="group-icon" :data-icon="GROUP_ICONS[title] ?? 'dots'">
            <svg v-if="GROUP_ICONS[title] === 'user'" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5" />
              <path d="M4 17c1-3.2 3.6-5 6-5s5 1.8 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else-if="GROUP_ICONS[title] === 'shield'" viewBox="0 0 20 20" fill="none">
              <path d="M10 3l6 2.2v4.6c0 4-2.6 6.9-6 7.9-3.4-1-6-3.9-6-7.9V5.2L10 3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="GROUP_ICONS[title] === 'building'" viewBox="0 0 20 20" fill="none">
              <rect x="4" y="3" width="12" height="14" rx="1" stroke="currentColor" stroke-width="1.5" />
              <path d="M7 7h1M12 7h1M7 10h1M12 10h1M7 13h1M12 13h1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else-if="GROUP_ICONS[title] === 'calendar'" viewBox="0 0 20 20" fill="none">
              <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M3.5 8.5h13M7 3v3M13 3v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else-if="GROUP_ICONS[title] === 'clock'" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 20 20" fill="none">
              <circle cx="5" cy="10" r="1.4" fill="currentColor" />
              <circle cx="10" cy="10" r="1.4" fill="currentColor" />
              <circle cx="15" cy="10" r="1.4" fill="currentColor" />
            </svg>
          </span>

          <span class="group-title">{{ title }}</span>

          <span class="group-count">{{ selectedCount(items) }}/{{ items.length }}</span>

          <label class="select-all" @click.stop>
            <span class="checkbox" :class="{ checked: isAllChecked(items), indeterminate: isIndeterminate(items) }">
              <input
                type="checkbox"
                :checked="isAllChecked(items)"
                @change="toggleAll(items)"
              />
              <svg v-if="isAllChecked(items)" viewBox="0 0 12 12" fill="none" class="check-icon">
                <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span v-else-if="isIndeterminate(items)" class="dash-icon" />
            </span>
            Select all
          </label>
        </button>

        <transition name="collapse">
          <div v-if="isOpen(title)" class="items">
            <label
              v-for="permission in items"
              :key="permission.id"
              class="permission"
            >
              <span class="checkbox" :class="{ checked: isChecked(permission.id) }">
                <input
                  type="checkbox"
                  :value="permission.id"
                  :checked="isChecked(permission.id)"
                  @change="togglePermission(permission.id)"
                />
                <svg v-if="isChecked(permission.id)" viewBox="0 0 12 12" fill="none" class="check-icon">
                  <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="permission-label">{{ formatLabel(permission.permissionName) }}</span>
            </label>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.permissions-panel {
  --accent: var(--primary, #6366f1);
  --accent-soft: var(--primary-soft, rgba(99, 102, 241, 0.1));
  --accent-contrast: var(--primary-contrast, #ffffff);
  --surface: var(--card-bg, #ffffff);
  --surface-muted: var(--muted-bg, #f8fafc);
  --border-color: var(--border, #e5e7eb);
  --text: var(--text-primary, #111827);
  --text-muted: var(--text-secondary, #6b7280);
  --radius: 12px;

  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: inherit;
  color: var(--text);
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.panel-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 30px 8px 32px;
  border-radius: 9px;
  border: 1px solid var(--border-color);
  background: var(--surface-muted);
  font-size: 13.5px;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.search-input:focus {
  border-color: var(--accent);
  background: var(--surface);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  position: absolute;
  right: 8px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.clear-btn:hover {
  color: var(--text);
  background: var(--border-color);
}

/* Empty state */
.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13.5px;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius);
}

/* Groups */
.groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
  transition: border-color 0.15s ease;
}

.group.is-open {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border-color));
}

.group-header {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  cursor: pointer;
  background: var(--surface-muted);
  transition: background 0.15s ease;
}

.group-header:hover {
  background: color-mix(in srgb, var(--accent) 6%, var(--surface-muted));
}

.group-header:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
  color: var(--accent);
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}

.group-icon svg {
  width: 14px;
  height: 14px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.group-count {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border-color);
  padding: 2px 7px;
  border-radius: 999px;
  margin-left: 2px;
}

.select-all {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.select-all:hover {
  color: var(--text);
}

/* Checkbox */
.checkbox {
  position: relative;
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1.5px solid var(--border-color);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.checkbox.checked,
.checkbox.indeterminate {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}

.check-icon {
  width: 10px;
  height: 10px;
  pointer-events: none;
}

.dash-icon {
  width: 8px;
  height: 1.6px;
  background: white;
  border-radius: 1px;
  pointer-events: none;
}

/* Items */
.items {
  padding: 6px 14px 14px 46px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 4px 16px;
}

.permission {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 7px;
  transition: background 0.15s ease;
}

.permission:hover {
  background: var(--surface-muted);
}

.permission-label {
  font-size: 13.5px;
  color: var(--text);
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: grid-template-rows 0.2s ease;
  display: grid;
  grid-template-rows: 1fr;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
}

.collapse-enter-active > *,
.collapse-leave-active > * {
  overflow: hidden;
}
</style>