const SUPABASE_URL = 'https://eovjhbsidaudbpeuvpde.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdmpoYnNpZGF1ZGJwZXV2cGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODgxOTEsImV4cCI6MjA5MDk2NDE5MX0.JS3bAQq0JNrxz2lsrN0PhvMQdv9mZlUQIZnLcqxE_hQ';

function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '', part2 = '';
  for (let i = 0; i < 2; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  return `${part1}-${part2}`;
}

export async function savePresetToCloud(payload) {
  const code = generateCode();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aurum_settings_presets`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ code, payload })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return code;
  } catch (e) {
    console.error('Помилка збереження пресету:', e);
    throw e;
  }
}

export async function loadPresetFromCloud(code) {
  const normalizedCode = code.trim().toUpperCase();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/aurum_settings_presets?code=eq.${encodeURIComponent(normalizedCode)}&select=payload`,
    { headers: supabaseHeaders() }
  );

  if (!res.ok) throw new Error('Помилка мережі');

  const rows = await res.json();
  if (!rows || rows.length === 0) throw new Error('Код не знайдено або він застарів');

  return rows[0].payload;
}
