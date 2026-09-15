/**
 * Tests del backend (Node test runner nativo).
 * Ejecuta: cd backend && npm test
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

let serverProc;
let baseUrl = 'http://localhost:3001'; // puerto distinto al dev

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not start');
}

describe('backend API', () => {
  before(async () => {
    serverProc = spawn('node', ['src/server.js'], {
      env: { ...process.env, PORT: '3001' },
      stdio: 'pipe',
    });
    await waitForServer();
  });

  after(() => {
    serverProc?.kill();
  });

  it('GET /health', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  it('GET /jobs devuelve items + pagination', async () => {
    const res = await fetch(`${baseUrl}/jobs?limit=10`);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.pagination.limit, 10);
    assert.ok(body.data.items.length > 0);
  });

  it('GET /jobs/:id 404 si no existe', async () => {
    const res = await fetch(`${baseUrl}/jobs/no_existe`);
    const body = await res.json();
    assert.equal(res.status, 404);
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  it('POST /auth/login con credenciales válidas', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@occ.com.mx', password: 'Test1234' }),
    });
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.data.token);
  });

  it('POST /auth/login con credenciales inválidas → 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@occ.com.mx', password: 'wrongpass' }),
    });
    assert.equal(res.status, 401);
  });

  it('Apply requiere auth', async () => {
    const res = await fetch(`${baseUrl}/jobs/job_001/apply`, { method: 'POST' });
    assert.equal(res.status, 401);
  });

  it('Apply con token funciona; duplicado → 409', async () => {
    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@occ.com.mx', password: 'Test1234' }),
    });
    const { data } = await login.json();
    const token = data.token;

    const r1 = await fetch(`${baseUrl}/jobs/job_050/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(r1.status, 200);

    const r2 = await fetch(`${baseUrl}/jobs/job_050/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(r2.status, 409);
    const body = await r2.json();
    assert.equal(body.error.code, 'ALREADY_APPLIED');
  });

  it('GET /jobs con sort=salary_desc ordena correctamente', async () => {
    const res = await fetch(`${baseUrl}/jobs?sort=salary_desc&limit=5`);
    const body = await res.json();
    const items = body.data.items.filter((j) => j.salary != null);
    for (let i = 1; i < items.length; i++) {
      assert.ok(items[i - 1].salary >= items[i].salary);
    }
  });
});
