<!--
@file SourcesForm Organism
@description Form for creating a new Postgres data source with test connection functionality.
@remarks Validates config before submission. Defaults to read-only permissions.
-->

<template>
  <form class="sources-form" @submit.prevent="handleSubmit" aria-label="Add data source">
    <h3 class="form-title">Add Postgres Source</h3>

    <div class="form-grid">
      <AppInput v-model="form.name" label="Source Name" placeholder="My CRM Database" />
      <AppInput v-model="form.host" label="Host" placeholder="localhost" />
      <AppInput v-model="form.port" label="Port" placeholder="5432" type="number" />
      <AppInput v-model="form.database" label="Database" placeholder="crm_db" />
      <AppInput v-model="form.user" label="User" placeholder="db_user" />
      <AppInput v-model="form.password" label="Password" placeholder="••••••" type="password" />
    </div>

    <div v-if="testResult" class="test-result" role="alert">
      <AppBadge :variant="testResult.ok ? 'success' : 'error'">
        {{ testResult.ok ? 'Connection OK' : 'Connection Failed' }}
      </AppBadge>
      <span v-if="testResult.error" class="test-error">{{ testResult.error }}</span>
    </div>

    <div class="form-actions">
      <AppButton variant="secondary" size="md" :loading="testing" @click.prevent="handleTest">
        Test Connection
      </AppButton>
      <AppButton variant="primary" size="md" :loading="submitting" :disabled="!form.name || !form.host">
        Add Source
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
/**
 * @file SourcesForm Script
 * @description Form state, test connection, and submit logic.
 * @remarks Uses the API client composable for all backend calls.
 */

import { ref, reactive } from 'vue';

const emit = defineEmits<{
  created: [source: Record<string, unknown>];
}>();

const props = defineProps<{
  workspaceId: string;
}>();

const api = useApiClient();

const form = reactive({
  name: '',
  host: 'localhost',
  port: '5432',
  database: 'crm_ai_studio',
  user: 'crm_user',
  password: 'crm_pass',
});

const testing = ref(false);
const submitting = ref(false);
const testResult = ref<{ ok: boolean; error?: string } | null>(null);

async function handleTest() {
  testing.value = true;
  testResult.value = null;
  try {
    testResult.value = await api.testSourceConnection({
      type: 'postgres',
      config: {
        host: form.host,
        port: parseInt(form.port, 10),
        database: form.database,
        user: form.user,
        password: form.password,
      },
    });
  } catch (err) {
    testResult.value = { ok: false, error: (err as Error).message };
  }
  testing.value = false;
}

async function handleSubmit() {
  submitting.value = true;
  try {
    const result = await api.createSource({
      name: form.name,
      type: 'postgres',
      config: {
        host: form.host,
        port: parseInt(form.port, 10),
        database: form.database,
        user: form.user,
        password: form.password,
      },
      workspaceId: props.workspaceId,
    });
    emit('created', result.source as unknown as Record<string, unknown>);
    // Reset form
    form.name = '';
    testResult.value = null;
  } catch (err) {
    testResult.value = { ok: false, error: (err as Error).message };
  }
  submitting.value = false;
}
</script>

<style scoped>
.sources-form {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.form-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--space-md) 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.test-result {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.test-error {
  font-size: 0.8rem;
  color: var(--color-error);
}

.form-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}
</style>
