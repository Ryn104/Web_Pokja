// =============================================
// AUTH - Login & Logout Admin
// =============================================

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// Show alert
function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.className = `mb-4 p-4 rounded-xl text-sm font-medium ${
        type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
        type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
        'bg-blue-50 text-blue-700 border border-blue-200'
    }`;
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    await supabaseReady;
    if (!supabaseClient) {
        showAlert('Koneksi Supabase belum terkonfigurasi di .env atau Vercel!');
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...';
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Login berhasil, redirect ke admin dashboard
        window.location.href = 'admin.html';
    } catch (error) {
        showAlert(error.message || 'Email atau password salah!');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Masuk';
    }
}

// Handle Logout
async function handleLogout() {
    await supabaseReady;
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    window.location.href = 'login.html';
}

// Check if user is logged in (for admin page)
async function checkAuth() {
    await supabaseReady;
    if (!supabaseClient) {
        window.location.href = 'login.html';
        return null;
    }
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

// Auto-redirect if already logged in (for login page)
async function checkAlreadyLoggedIn() {
    await supabaseReady;
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'admin.html';
    }
}

// Run checks based on current page
if (window.location.pathname.includes('login.html') || window.location.pathname.endsWith('/login')) {
    checkAlreadyLoggedIn();
}
