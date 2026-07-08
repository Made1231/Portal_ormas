document.addEventListener('DOMContentLoaded', async function () {
    if (!window.supabaseClient) {
        console.error('Supabase Client tidak ditemukan. Pastikan config.js dimuat sebelum auth.js');
        return;
    }

    const { supabaseClient } = window;
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    const params = new URLSearchParams(window.location.search);
    const requestRole = params.get('role') || 'admin';
    const rawNext = params.get('next');
    const nextPage = rawNext ? decodeURIComponent(rawNext) : (requestRole === 'user' ? 'public.html' : 'admin.html');

    function getPageType(pathname) {
        if (pathname.endsWith('admin.html')) return 'admin';
        if (pathname.endsWith('public.html')) return 'user';
        return null;
    }

    async function checkSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const pathname = window.location.pathname;
        const isLoginPage = pathname.includes('login.html');

        if (session && isLoginPage) {
            window.location.href = nextPage;
            return;
        }

        if (!session && !isLoginPage) {
            const pageType = getPageType(pathname);
            if (pageType === 'admin') {
                window.location.href = `login.html?role=admin&next=${encodeURIComponent('admin.html')}`;
            } else if (pageType === 'user') {
                const currentFeature = new URLSearchParams(window.location.search).get('feature');
                const next = currentFeature ? `public.html?feature=${currentFeature}` : 'public.html';
                window.location.href = `login.html?role=user&next=${encodeURIComponent(next)}`;
            }
        }
    }

    checkSession();

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            errorMessage.classList.add('hidden');
            loginBtn.disabled = true;
            loginBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>`;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
                window.location.href = nextPage;
            } catch (err) {
                console.error('Login error:', err.message || err);
                errorMessage.classList.remove('hidden');
                errorText.innerText = err.message || 'Email atau password salah!';
                loginBtn.disabled = false;
                loginBtn.innerText = 'Masuk Sekarang';
            }
        });
    }

    window.handleLogout = async function () {
        if (!confirm('Anda yakin ingin keluar dari sistem?')) return;

        try {
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        } catch (err) {
            alert('Gagal logout: ' + (err.message || err));
        }
    };
});
