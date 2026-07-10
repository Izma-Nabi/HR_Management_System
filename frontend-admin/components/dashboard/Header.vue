<template>

<header class="header">

    <h2>Admin Dashboard</h2>

    <div class="right">

        <span class="bell">🔔</span>

        <div class="profile">

            <img
            src="https://ui-avatars.com/api/?name=Admin"
            />

            <div>

                <h4>Administrator</h4>

                <small>Online</small>

            </div>

        </div>

    </div>

</header>

</template>

<style scoped>

.header{

display:flex;

justify-content:space-between;

align-items:center;

padding:20px 30px;

background:white;

border-bottom:1px solid #ececec;

}

.right{

display:flex;

align-items:center;

gap:30px;

}

.profile{

display:flex;

align-items:center;

gap:10px;

}

img{

width:45px;

height:45px;

border-radius:50%;

}

.bell{

font-size:22px;

cursor:pointer;

}

</style>