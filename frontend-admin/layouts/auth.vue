<template>
  <main class="auth-layout">
    <div class="auth-orb auth-orb--one"></div>
    <div class="auth-orb auth-orb--two"></div>

    <NuxtLink to="/login" class="auth-brand" aria-label="Bookme workforce home">
      <span class="auth-brand-mark">B</span>
      <span>
        <strong>Bookme Workforce</strong>
        <small>People operations, simplified</small>
      </span>
    </NuxtLink>

    <section class="auth-stage">
      <slot />
    </section>

    <p class="auth-footnote">Secure workforce management for modern teams.</p>
  </main>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 28px clamp(20px, 4vw, 56px);
  background:
    linear-gradient(120deg, rgba(255, 254, 250, 0.95), rgba(243, 242, 236, 0.88)),
    repeating-linear-gradient(135deg, transparent 0 18px, rgba(15, 118, 110, 0.035) 18px 19px);
}

.auth-brand {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-950);
  text-decoration: none;
}

.auth-brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: #fff;
  background: var(--ink-950);
  border-radius: 13px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(16, 37, 43, 0.18);
}

.auth-brand strong,
.auth-brand small {
  display: block;
}

.auth-brand strong {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: -0.015em;
}

.auth-brand small {
  margin-top: 1px;
  color: var(--ink-500);
  font-size: 11px;
}

.auth-stage {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: calc(100vh - 140px);
  place-items: center;
}

.auth-stage :deep(.login-page),
.auth-stage :deep(.auth-page),
.auth-stage :deep(.forgot-page),
.auth-stage :deep(.reset-page) {
  width: 100%;
  min-height: auto;
  padding: 40px 0;
  background: transparent;
}

.auth-stage :deep(.login-panel),
.auth-stage :deep(.auth-card),
.auth-stage :deep(.forgot-card),
.auth-stage :deep(.reset-card) {
  width: min(100%, 470px);
  margin: 0 auto;
  padding: clamp(28px, 5vw, 44px);
  background: rgba(255, 254, 250, 0.92);
  border: 1px solid rgba(200, 211, 205, 0.9);
  border-radius: 24px;
  box-shadow: 0 28px 80px rgba(20, 48, 52, 0.13);
  backdrop-filter: blur(18px);
}

.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
  pointer-events: none;
}

.auth-orb--one {
  top: -160px;
  right: -100px;
  width: 420px;
  height: 420px;
  background: rgba(15, 118, 110, 0.1);
}

.auth-orb--two {
  bottom: -220px;
  left: -120px;
  width: 520px;
  height: 520px;
  border: 70px solid rgba(215, 149, 43, 0.09);
}

.auth-footnote {
  position: relative;
  z-index: 2;
  margin: 0;
  color: var(--ink-500);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 560px) {
  .auth-layout {
    padding: 20px 16px;
  }

  .auth-brand small {
    display: none;
  }
}
</style>
