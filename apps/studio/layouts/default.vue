<!--
@file App Root Layout
@description The root layout for the CRM AI Studio. Provides sidebar with new-chat button, thread history, and navigation.
@remarks Dark-mode first. Responsive. Keyboard navigable. Thread list is loaded on mount.
-->

<template>
  <div class="app-layout">
    <aside class="sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar-header">
        <h1 class="sidebar-logo">
          <span class="logo-icon" aria-hidden="true">⬡</span>
          CRM AI Studio
        </h1>
      </div>

      <!-- New Chat button -->
      <button class="new-chat-btn focus-ring" @click="handleNewChat">
        <span class="new-chat-icon" aria-hidden="true">＋</span>
        New Chat
      </button>

      <!-- Thread history -->
      <div class="thread-section">
        <p class="thread-section-label">Recent chats</p>
        <div v-if="history.loading.value" class="thread-loading">
          <span class="thread-loading-text">Loading…</span>
        </div>
        <div v-else-if="history.threads.value.length === 0" class="thread-empty">
          <span class="thread-empty-text">No conversations yet</span>
        </div>
        <div v-else class="thread-list">
          <button
            v-for="thread in history.threads.value"
            :key="thread.id"
            class="thread-item focus-ring"
            :class="{ 'thread-item--active': history.activeThreadId.value === thread.id }"
            :title="thread.title"
            @click="handleSelectThread(thread.id)"
          >
            <span class="thread-icon" aria-hidden="true">💬</span>
            <span class="thread-title">{{ thread.title }}</span>
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item focus-ring"
          :aria-label="item.label"
        >
          <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <span class="version-badge">MVP v0.1.0</span>
      </div>
    </aside>

    <main class="main-content" role="main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * @file App Layout Script
 * @description Navigation items, thread history, and new-chat logic.
 * @remarks Thread list is loaded on mount and refreshed when navigating to the chat page.
 */

import { onMounted } from 'vue';

const router = useRouter();
const history = useChatHistory();

const navItems = [
  { to: '/', icon: '💬', label: 'Chat' },
  { to: '/sources', icon: '🔌', label: 'Sources' },
  { to: '/ingestion', icon: '📥', label: 'Ingestion' },
  { to: '/observability', icon: '📊', label: 'Observability' },
];

function handleNewChat() {
  history.newChat();
  // Navigate to chat page if not already there
  router.push('/');
}

function handleSelectThread(threadId: string) {
  history.selectThread(threadId);
  router.push('/');
}

onMounted(() => {
  history.loadThreads();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: var(--space-md);
  overflow: hidden;
}

.sidebar-header {
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-md);
}

.sidebar-logo {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
}

.logo-icon {
  font-size: 1.4rem;
  color: var(--color-accent);
}

/* New Chat Button */
.new-chat-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: var(--space-md);
}

.new-chat-btn:hover {
  background: var(--color-accent-hover);
}

.new-chat-icon {
  font-size: 1.1rem;
  font-weight: 700;
}

/* Thread history section */
.thread-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: var(--space-md);
  min-height: 0;
}

.thread-section-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-sm) var(--space-xs);
}

.thread-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.thread-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  width: 100%;
  min-height: 32px;
}

.thread-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.thread-item--active {
  background: var(--color-accent-soft);
  color: var(--color-accent-hover);
}

.thread-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.thread-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.thread-loading,
.thread-empty {
  padding: var(--space-sm);
}

.thread-loading-text,
.thread-empty-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Navigation links */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.nav-item.router-link-exact-active,
.nav-item.router-link-active {
  background: var(--color-accent-soft);
  color: var(--color-accent-hover);
}

.nav-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.version-badge {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.main-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
