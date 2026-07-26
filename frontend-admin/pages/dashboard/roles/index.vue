<script setup lang="ts">

definePageMeta({
  layout: "dashboard"
});


const router = useRouter();

const goBack = ()=>{

router.push("/dashboard/roles");

};
const config = useRuntimeConfig();

const roles = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref("");



const authHeaders = () => {

  const token = localStorage.getItem("token");

  if (!token) return null;

  return {
    Authorization:`Bearer ${token}`
  };

};

const deleteRole = async (id:number)=>{

  const confirmed = window.confirm(
    "Delete this role?"
  );


  if(!confirmed){
    return;
  }


  const headers = authHeaders();


  if(!headers){
    await navigateTo("/login",{replace:true});
    return;
  }


  try{


    await $fetch(
      `${config.public.apiBase}/roles/${id}`,
      {
        method:"DELETE",
        headers
      }
    );


    roles.value =
      roles.value.filter(
        role => role.id !== id
      );


  }
  catch(error:any){

    errorMessage.value =
      error?.data?.message ||
      "Delete failed";

  }

};

const loadRoles = async()=>{

const headers = authHeaders();

if(!headers){

await navigateTo("/login");

return;

}


loading.value=true;


try{

const response = await $fetch(
`${config.public.apiBase}/roles`,
{
headers
}
);


roles.value = response.data;


}
catch(error:any){

errorMessage.value =
error?.data?.message ||
"Unable to load roles";

}
finally{

loading.value=false;

}

};

onMounted(loadRoles);


</script>



<template>

<div class="page">


<div class="page-header">

  <div>
    <h1>
      Roles & Permissions
    </h1>

    <p>
      Manage roles and assign permissions
    </p>
  </div>


  <div class="actions">

    <button
      class="back-btn"
      @click="goBack"
    >
      ← Back
    </button>


    <NuxtLink
      to="/dashboard/roles/create"
      class="add-btn"
    >
      + Create Role
    </NuxtLink>

  </div>


</div>



<p
v-if="errorMessage"
class="notice error"
>
{{ errorMessage }}
</p>



<div
v-if="loading"
class="loading"
>
Loading roles...
</div>



<table
v-else
class="table"
>


<thead>

<tr>

<th>
Role
</th>

<th>
Users
</th>

<th>
Permissions
</th>

<th>
Actions
</th>


</tr>

</thead>



<tbody>


<tr
v-for="role in roles"
:key="role.id"
>


<td>
{{ role.roleName }}
</td>


<td>
{{ role._count?.users || 0 }}
</td>



<td>

{{ role.rolePermissions?.length || 0 }}

</td>




<td class="actions">
  <NuxtLink
    class="view"
    :to="`/dashboard/roles/view/${role.id}`"
  >
    View
  </NuxtLink>

  <NuxtLink
    class="edit"
    :to="`/dashboard/roles/${role.id}`"
  >
    Edit
  </NuxtLink>

  <button
    class="delete"
    type="button"
    @click="deleteRole(role.id)"
  >
    Delete
  </button>
</td>


</tr>


</tbody>


</table>



<div
v-if="!loading && roles.length===0"
class="empty"
>
No roles found.
</div>



</div>


</template>



<style scoped>


.page{

padding:30px;

}


.page-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:25px;
}

.add-btn {
  padding:10px 18px;
  color:#ffffff;
  text-decoration:none;
  background:#4f46e5;
  border-radius:8px;
  font-weight:700;
}


.add-btn:hover {
  background:#4338ca;
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

h1{

font-size:28px;
color:#111827;

}


p{

color:#6b7280;

}

.table{

width:100%;
border-collapse:collapse;
background:white;
border-radius:12px;
overflow:hidden;

}

.view{
  background:#ecfeff;
  color:#0369a1;
  padding:6px 10px;
  border-radius:6px;
  text-decoration:none;
  font-size:13px;
}

th,td{

padding:16px;
border-bottom:1px solid #eee;
text-align:left;

}
.actions {
  display:flex;
  gap:8px;
}


.edit,
.delete {

border:none;
cursor:pointer;
padding:6px 10px;
border-radius:6px;
text-decoration:none;
font-size:13px;

}


.edit {

background:#eef2ff;
color:#4338ca;

}


.delete {

background:#fee2e2;
color:#b91c1c;

}

.notice.error{

background:#fee2e2;
color:#991b1b;
padding:12px;
border-radius:8px;

}


.loading,.empty{

padding:30px;
text-align:center;

}


</style>