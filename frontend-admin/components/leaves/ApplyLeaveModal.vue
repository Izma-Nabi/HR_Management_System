<script setup lang="ts">
const emit = defineEmits([
  "close",
  "submit"
]);

const form = reactive({
  type:"",
  startDate:"",
  endDate:"",
  reason:""
});

const submit=()=>{
  emit("submit",{...form});
};
</script>

<template>

<div class="overlay">

<div class="modal">

<h2>Apply Leave</h2>

<select v-model="form.type">

<option value="">Select Leave Type</option>

<option>ANNUAL</option>

<option>SICK</option>

<option>CASUAL</option>

<option>UNPAID</option>

<option>OTHER</option>

</select>

<input
type="date"
v-model="form.startDate"
/>

<input
type="date"
v-model="form.endDate"
/>

<textarea
v-model="form.reason"
placeholder="Reason"
/>

<div class="buttons">

<button
class="cancel"
@click="$emit('close')"
>
Cancel
</button>

<button
class="submit"
@click="submit"
>
Submit
</button>

</div>

</div>

</div>

</template>