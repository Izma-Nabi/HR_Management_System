<script setup>

definePageMeta({
  layout: "dashboard"
});


import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import RoleForm from "~/components/dashboard/roles/RoleForm.vue";
import roleService from "~/services/role.service";


const router = useRouter();


const permissions = ref([]);

const loading = ref(false);



const goBack = () => {

  router.push("/dashboard/roles");

};



const fetchPermissions = async () => {

  try {

    permissions.value =
      await roleService.getPermissions();

  } catch(error) {

    console.error(error);

  }

};




const submit = async (form) => {

  loading.value = true;


  try {


    await roleService.createRole(form);


    router.push("/dashboard/roles");


  } catch(error) {


    console.error(error);


  } finally {


    loading.value = false;


  }

};




onMounted(fetchPermissions);


</script>



<template>

<div class="page">


  <div class="page-header">


    <div>

      <h1>
        Create Role
      </h1>

      <p>
        Create new role and assign permissions
      </p>

    </div>



    <div class="actions">

      <button
        class="back-btn"
        type="button"
        @click="goBack"
      >
        ← Back
      </button>

    </div>


  </div>




  <RoleForm

    :permissions="permissions"

    :loading="loading"

    @submit="submit"

    @cancel="goBack"

  />


</div>

</template>



<style scoped>

.page {

  max-width:1400px;

}



.page-header {

  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:16px;
  margin-bottom:24px;

}



.page-header h1 {

  margin:0 0 6px;
  color:#1f2937;
  font-size:30px;

}



.page-header p {

  margin:0;
  color:#6b7280;

}



.actions {

  display:flex;
  align-items:center;

}



.back-btn {

  padding:10px 18px;
  color:#ffffff;
  background:#4f46e5;
  border:none;
  border-radius:8px;
  font-weight:700;
  cursor:pointer;

}



.back-btn:hover {

  background:#4338ca;

}

</style>