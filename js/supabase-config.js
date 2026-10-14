// =============================================
// KONFIGURASI SUPABASE OTOMATIS
// Mendukung lokal (js/env.js & .env) dan produksi (Vercel)
// =============================================

const { createClient } = supabase;
let supabaseClient = null;

async function initSupabase() {
    if (supabaseClient) return supabaseClient;

    let supabaseUrl = '';
    let supabaseAnonKey = '';

    // 1. Coba baca dari window.__ENV__ (lokal js/env.js yang di-ignore git)
    if (window.__ENV__ && window.__ENV__.SUPABASE_URL && window.__ENV__.SUPABASE_ANON_KEY) {
        supabaseUrl = window.__ENV__.SUPABASE_URL;
        supabaseAnonKey = window.__ENV__.SUPABASE_ANON_KEY;
    }

    // 2. Jika belum ada, coba baca dari endpoint Vercel /api/config
    if (!supabaseUrl || !supabaseAnonKey) {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const config = await res.json();
                supabaseUrl = config.supabaseUrl;
                supabaseAnonKey = config.supabaseAnonKey;
            }
        } catch (e) {
            // Abaikan jika tidak di server Vercel
        }
    }

    // 3. Fallback: coba baca file .env jika server mengizinkan
    if (!supabaseUrl || !supabaseAnonKey) {
        try {
            const res = await fetch('/.env');
            if (res.ok) {
                const text = await res.text();
                text.split('\n').forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const [k, ...v] = trimmed.split('=');
                        const key = k ? k.trim() : '';
                        const val = v.join('=').trim().replace(/^['"]|['";]+$/g, '');
                        if (key === 'SUPABASE_URL') supabaseUrl = val;
                        if (key === 'SUPABASE_ANON_KEY') supabaseAnonKey = val;
                    }
                });
            }
        } catch (e) {}
    }

    // Buat client jika key valid
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_PROJECT_ID')) {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase Client berhasil terhubung!');
    } else {
        console.warn('⚠️ Supabase belum terkonfigurasi. Periksa js/env.js atau Environment Variables Vercel.');
    }

    return supabaseClient;
}

const supabaseReady = initSupabase();
