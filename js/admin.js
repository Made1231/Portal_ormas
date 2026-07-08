document.addEventListener('DOMContentLoaded', function () {

    if (!window.supabaseClient) {
        alert('Library Supabase belum dimuat. Pastikan file config.js terbaca dengan sempurna.');
        return;
    }

    // ─── DOM refs ───────────────────────────────────────────────────────────────
    const tbodyAnggota = document.getElementById('tbody-anggota');
    const pagingText   = document.getElementById('paging-text');
    const exportBtn    = document.getElementById('export-btn');
    const statTotal    = document.getElementById('stat-total');
    const statPending  = document.getElementById('stat-pending');
    const statValid    = document.getElementById('stat-valid');

    let globalDataRecords = []; // raw data cache for export & search
    let allOrmasRows = [];      // cache for ormas table search

    // ═══════════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════════
    async function init() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            fetchData();
            fetchDaftarOrmas();
            fetchStats();
        }
    }
    init();

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 1: STATS CARDS
    // ═══════════════════════════════════════════════════════════════════════════
    async function fetchStats() {
        try {
            const { data, error } = await window.supabaseClient
                .from('pendaftar_ormas')
                .select('status');
            if (error) throw error;

            const total   = data.length;
            const valid   = data.filter(r => r.status && r.status.toLowerCase() === 'valid').length;
            const pending = total - valid;

            if (statTotal)   statTotal.textContent   = total;
            if (statPending) statPending.textContent = pending;
            if (statValid)   statValid.textContent   = valid;
        } catch (e) {
            console.warn('Stats error:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 2: FETCH DATA ANGGOTA
    // ═══════════════════════════════════════════════════════════════════════════
    window.fetchData = async function () {
        tbodyAnggota.innerHTML = `
            <tr><td colspan="13" class="text-center py-12">
                <svg class="animate-spin h-7 w-7 text-[#FA8112] mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-gray-400 text-sm font-medium">Memuat data pendaftar...</p>
            </td></tr>`;

        try {
            const { data, error } = await window.supabaseClient
                .from('pendaftar_ormas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            globalDataRecords = data;
            renderAnggota(data);
            fetchStats();

        } catch (error) {
            console.error('Fetch error:', error);
            tbodyAnggota.innerHTML = `<tr><td colspan="13" class="text-center py-8 text-red-500 font-semibold bg-red-50">
                ⚠️ Gagal memuat data: ${error.message}
            </td></tr>`;
        }
    };

    function renderAnggota(data) {
        if (!data || data.length === 0) {
            tbodyAnggota.innerHTML = `<tr><td colspan="13" class="text-center py-12 text-gray-400">
                <svg class="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p class="text-sm font-medium">Belum ada data pendaftar</p>
            </td></tr>`;
            if (pagingText) pagingText.textContent = 'Menampilkan 0 data';
            return;
        }

        tbodyAnggota.innerHTML = '';
        if (pagingText) pagingText.textContent = `Menampilkan ${data.length} data pendaftar`;

        data.forEach((item, index) => {
            const isValid = item.status && item.status.toLowerCase() === 'valid';

            const statusBadge = isValid
                ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>Valid</span>`
                : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <span class="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>Pending</span>`;

            let docLinks = '';
            if (item.foto_ktp_url)      docLinks += `<a href="${item.foto_ktp_url}" target="_blank" class="px-2 py-1 bg-gray-100 border border-gray-200 hover:bg-[#FA8112]/10 hover:border-[#FA8112] hover:text-[#FA8112] text-gray-600 rounded-lg text-xs font-bold transition-all">KTP</a>`;
            if (item.foto_npwp_url)     docLinks += `<a href="${item.foto_npwp_url}" target="_blank" class="px-2 py-1 bg-gray-100 border border-gray-200 hover:bg-[#FA8112]/10 hover:border-[#FA8112] hover:text-[#FA8112] text-gray-600 rounded-lg text-xs font-bold transition-all">NPWP</a>`;
            if (item.foto_rekening_url) docLinks += `<a href="${item.foto_rekening_url}" target="_blank" class="px-2 py-1 bg-gray-100 border border-gray-200 hover:bg-[#FA8112]/10 hover:border-[#FA8112] hover:text-[#FA8112] text-gray-600 rounded-lg text-xs font-bold transition-all">REK</a>`;

            let linkWa = item.no_wa || '';
            if (linkWa.startsWith('0')) linkWa = '62' + linkWa.slice(1);

            const btnStatus = `<button onclick="window.ubahStatus('${item.id}', '${item.status || 'Pending'}')" class="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95">⚙ Ubah Status</button>`;
            const btnAcc = isValid
                ? `<button class="inline-flex items-center bg-gray-200 text-gray-400 cursor-not-allowed px-2.5 py-1.5 rounded-lg text-xs font-bold" disabled>✔ ACC</button>`
                : `<button onclick="window.terimaPeserta('${item.id}')" class="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95">✔ ACC</button>`;

            const btnHapus = `<button onclick="window.hapusPeserta('${item.id}')" class="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95">🗑</button>`;

            let dashBank = '-';
            let dashNorek = item.no_rekening || '-';
            if (item.no_rekening && item.no_rekening.includes(' - ')) {
                const rParts = item.no_rekening.split(' - ');
                dashBank  = rParts[0].trim();
                dashNorek = rParts.slice(1).join(' - ').trim();
            }

            const tr = document.createElement('tr');
            tr.className = 'bg-white hover:bg-orange-50/40 transition-colors border-b border-gray-50';
            tr.setAttribute('data-search', [item.nama_ormas, item.nama_lengkap, item.nik, item.no_wa].join(' ').toLowerCase());
            tr.innerHTML = `
                <td class="text-center text-gray-400 font-semibold text-xs">${index + 1}</td>
                <td class="font-bold text-[#FA8112] max-w-36 truncate">${item.nama_ormas || '-'}</td>
                <td class="font-semibold text-gray-700 max-w-36 truncate">${item.nama_lengkap || '<span class="text-xs text-gray-400 italic">Menunggu Scan</span>'}</td>
                <td class="text-center font-semibold text-gray-600 text-xs">${item.jenis_kelamin || '-'}</td>
                <td class="font-mono text-gray-600 text-xs">${item.nik || '-'}</td>
                <td class="text-gray-600 max-w-36 truncate text-xs">${item.alamat || '-'}</td>
                <td class="font-mono text-gray-600 text-xs">${item.no_wa || '-'}</td>
                <td class="text-gray-600 text-xs font-medium">${dashBank}</td>
                <td class="font-mono font-bold text-[#FA8112] text-xs">${dashNorek}</td>
                <td class="font-mono text-gray-500 text-xs">${item.npwp || '-'}</td>
                <td class="text-center"><div class="flex items-center justify-center gap-1">${docLinks || '<span class="text-xs text-red-300">Kosong</span>'}</div></td>
                <td class="text-center">${statusBadge}</td>
                <td>
                    <div class="flex items-center justify-center gap-1.5">
                        ${btnStatus}
                        ${btnAcc}
                        ${btnHapus}
                        <a href="https://wa.me/${linkWa}" target="_blank" rel="noopener noreferrer"
                            class="inline-flex items-center bg-[#25D366] hover:bg-[#1ebe5d] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition active:scale-95">💬</a>
                    </div>
                </td>`;
            tbodyAnggota.appendChild(tr);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 3: SEARCH / FILTER ANGGOTA
    // ═══════════════════════════════════════════════════════════════════════════
    window.filterAnggota = function (query) {
        const q = query.toLowerCase().trim();
        const rows = tbodyAnggota.querySelectorAll('tr[data-search]');
        let visible = 0;
        rows.forEach(row => {
            const match = !q || row.getAttribute('data-search').includes(q);
            row.style.display = match ? '' : 'none';
            if (match) visible++;
        });
        if (pagingText) pagingText.textContent = q
            ? `Menampilkan ${visible} dari ${globalDataRecords.length} data`
            : `Menampilkan ${globalDataRecords.length} data pendaftar`;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 4: ACC (VERIFIKASI VALID)
    // ═══════════════════════════════════════════════════════════════════════════
    window.terimaPeserta = async function (id) {
        if (!confirm('Apakah seluruh berkas sudah sah? Konfirmasi untuk mem-validasi pendaftar ini.')) return;
        try {
            const { error } = await window.supabaseClient
                .from('pendaftar_ormas')
                .update({ status: 'Valid' })
                .eq('id', id);
            if (error) throw error;
            alert('Pendaftar berhasil divalidasi!');
            fetchData();
        } catch (error) {
            alert('Gagal validasi: ' + error.message);
        }
    };

    window.ubahStatus = async function (id, currentStatus) {
        const statusOptions = ['Valid', 'Pending', 'Non-Aktif'];
        const pilihan = prompt('Ubah status ormas menjadi Valid, Pending, atau Non-Aktif:', currentStatus || 'Pending');
        if (!pilihan) return;

        const statusBaru = pilihan.trim();
        if (!statusOptions.includes(statusBaru)) {
            alert('Status tidak valid. Gunakan: Valid, Pending, atau Non-Aktif.');
            return;
        }

        try {
            const { error } = await window.supabaseClient
                .from('pendaftar_ormas')
                .update({ status: statusBaru })
                .eq('id', id);
            if (error) throw error;
            alert(`Status berhasil diperbarui menjadi ${statusBaru}.`);
            fetchData();
        } catch (error) {
            alert('Gagal memperbarui status: ' + error.message);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 5: HAPUS PERMANEN
    // ═══════════════════════════════════════════════════════════════════════════
    window.hapusPeserta = async function (id) {
        if (!confirm('⚠️ HAPUS PERMANEN: Data dan file dokumen akan ikut terhapus. Lanjutkan?')) return;
        try {
            const barisData = globalDataRecords.find(item => String(item.id) === String(id));
            if (barisData) {
                const ekstrak = (url) => { if (!url) return null; const p = url.split('/'); return p[p.length - 1]; };
                const files = [ekstrak(barisData.foto_ktp_url), ekstrak(barisData.foto_npwp_url), ekstrak(barisData.foto_rekening_url)].filter(Boolean);
                if (files.length > 0) {
                    await window.supabaseClient.storage.from('dokumen_ormas').remove(files);
                }
            }
            const { error } = await window.supabaseClient.from('pendaftar_ormas').delete().eq('id', id);
            if (error) throw error;
            alert('Data berhasil dihapus.');
            fetchData();
        } catch (error) {
            alert('Gagal hapus: ' + error.message);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 6: EXPORT EXCEL
    // ═══════════════════════════════════════════════════════════════════════════
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            if (globalDataRecords.length === 0) { alert('Tidak ada data untuk diekspor.'); return; }

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Data Anggota Ormas');

            sheet.columns = [
                { header: 'No', key: 'no', width: 5 },
                { header: 'Nama Ormas', key: 'ormas', width: 35 },
                { header: 'Nama Lengkap', key: 'nama', width: 30 },
                { header: 'Jenis Kelamin', key: 'jk', width: 15 },
                { header: 'NIK', key: 'nik', width: 20 },
                { header: 'Alamat', key: 'alamat', width: 35 },
                { header: 'No WhatsApp', key: 'wa', width: 20 },
                { header: 'Nama Bank', key: 'bank', width: 20 },
                { header: 'No Rekening', key: 'norek', width: 22 },
                { header: 'No NPWP', key: 'npwp', width: 25 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Tanggal Daftar', key: 'tgl', width: 20 }
            ];

            sheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2F3E' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
            });

            globalDataRecords.forEach((item, idx) => {
                let bank = '-', norek = item.no_rekening || '-';
                if (item.no_rekening && item.no_rekening.includes(' - ')) {
                    const parts = item.no_rekening.split(' - ');
                    bank  = parts[0].trim();
                    norek = parts.slice(1).join(' - ').trim();
                }
                const row = sheet.addRow({
                    no: idx + 1,
                    ormas:  item.nama_ormas || '-',
                    nama:   item.nama_lengkap || '-',
                    jk:     item.jenis_kelamin || '-',
                    nik:    item.nik || '-',
                    alamat: item.alamat || '-',
                    wa:     item.no_wa || '-',
                    bank,
                    norek,
                    npwp:   item.npwp || '-',
                    status: item.status && item.status.toLowerCase() === 'valid' ? 'Valid' : 'Pending',
                    tgl:    item.created_at ? item.created_at.split('T')[0] : '-'
                });
                row.eachCell(cell => {
                    cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });
            });

            workbook.xlsx.writeBuffer().then(buf => {
                const blob    = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url     = URL.createObjectURL(blob);
                const anchor  = document.createElement('a');
                anchor.href   = url;
                anchor.download = `Laporan_Pendaftaran_Ormas_${new Date().toISOString().slice(0,10)}.xlsx`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 7: FETCH DAFTAR ORMAS (tabel baru)
    // ═══════════════════════════════════════════════════════════════════════════
    window.fetchDaftarOrmas = async function () {
        const tbodyOrmas  = document.getElementById('tbody-ormas');
        const ormasCount  = document.getElementById('ormas-count');
        if (!tbodyOrmas) return;

        tbodyOrmas.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400 text-sm">
            <svg class="animate-spin h-6 w-6 text-[#FA8112] mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memuat daftar ormas...</td></tr>`;

        try {
            const { data, error } = await window.supabaseClient
                .from('daftar_ormas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            allOrmasRows = data;
            renderOrmas(data);
            if (ormasCount) ormasCount.textContent = `Total ${data.length} ormas terdaftar`;

        } catch (e) {
            tbodyOrmas.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400 text-sm font-medium">
                Gagal memuat: ${e.message}<br>
                <span class="text-xs text-gray-400">Pastikan tabel daftar_ormas sudah dibuat di Supabase</span>
            </td></tr>`;
            if (ormasCount) ormasCount.textContent = '—';
        }
    };

    function renderOrmas(data) {
        const tbody = document.getElementById('tbody-ormas');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 text-sm">
                <svg class="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                </svg>
                Belum ada ormas terdaftar
            </td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        data.forEach(item => {
            const isAktif  = item.status && item.status.toLowerCase() === 'aktif';
            const badge    = isAktif
                ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Aktif</span>`
                : `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">Non-Aktif</span>`;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-orange-50/40 transition-colors';
            tr.setAttribute('data-ormas-search', [item.nama_ormas, item.singkatan, item.ketua_umum, item.jenis_ormas].join(' ').toLowerCase());
            tr.setAttribute('data-jenis-ormas', (item.jenis_ormas || '').toLowerCase());
            tr.innerHTML = `
                <td>
                    <p class="font-bold text-gray-800 text-sm">${item.nama_ormas}</p>
                    ${item.singkatan ? `<p class="text-xs text-gray-400">${item.singkatan}</p>` : ''}
                </td>
                <td class="text-xs text-gray-500 font-medium">${item.jenis_ormas || '-'}</td>
                <td class="text-sm text-gray-700 font-medium">${item.ketua_umum || '-'}</td>
                <td class="text-center">${badge}</td>
                <td class="text-center">
                    <button onclick="window.hapusOrmas('${item.id}')"
                        class="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Hapus">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 8: SEARCH & FILTER ORMAS
    // ═══════════════════════════════════════════════════════════════════════════
    window.applyOrmasFilter = function () {
        const searchInput = document.getElementById('search-ormas');
        const selectFilter = document.getElementById('filter-jenis-ormas');
        if (!searchInput || !selectFilter) return;

        const q = searchInput.value.toLowerCase().trim();
        const k = selectFilter.value.toLowerCase().trim();

        const rows = document.querySelectorAll('#tbody-ormas tr[data-ormas-search]');
        rows.forEach(row => {
            const matchesSearch = !q || row.getAttribute('data-ormas-search').includes(q);
            const matchesKategori = !k || row.getAttribute('data-jenis-ormas') === k;
            
            row.style.display = (matchesSearch && matchesKategori) ? '' : 'none';
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 9: FORM TAMBAH ORMAS
    // ═══════════════════════════════════════════════════════════════════════════
    const formOrmas = document.getElementById('form-daftar-ormas');
    if (formOrmas) {
        formOrmas.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('ormas-submit-btn');
            const msgEl     = document.getElementById('ormas-msg');

            const payload = {
                nama_ormas:         document.getElementById('ormas-nama').value.trim(),
                singkatan:          document.getElementById('ormas-singkatan').value.trim() || null,
                jenis_ormas:        document.getElementById('ormas-jenis').value,
                alamat_sekretariat: document.getElementById('ormas-alamat').value.trim(),
                no_telp:            document.getElementById('ormas-telp').value.trim() || null,
                email:              document.getElementById('ormas-email').value.trim() || null,
                ketua_umum:         document.getElementById('ormas-ketua').value.trim(),
                no_sk_kemenkumham:  document.getElementById('ormas-sk').value.trim() || null,
                tanggal_berdiri:    document.getElementById('ormas-tgl').value || null,
                status:             document.getElementById('ormas-status').value,
                catatan:            document.getElementById('ormas-catatan').value.trim() || null
            };

            if (!payload.nama_ormas || !payload.jenis_ormas || !payload.ketua_umum || !payload.alamat_sekretariat) {
                showMsg('error', '⚠️ Nama Ormas, Jenis, Ketua Umum, dan Alamat wajib diisi!');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Menyimpan...`;

            try {
                const { error } = await window.supabaseClient
                    .from('daftar_ormas')
                    .insert([payload]);

                if (error) throw error;

                showMsg('success', '✅ Ormas berhasil didaftarkan!');
                formOrmas.reset();
                fetchDaftarOrmas();
                if (typeof switchTab === 'function') {
                    switchTab('arsip');
                }
            } catch (err) {
                console.error('Ormas insert error:', err);
                const msg = err.message.includes('does not exist')
                    ? '❌ Tabel daftar_ormas belum ada. Buat tabel dulu via SQL Editor Supabase (lihat petunjuk di bawah).'
                    : '❌ Gagal menyimpan: ' + err.message;
                showMsg('error', msg);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> Simpan Data Ormas`;
            }
        });
    }

    function showMsg(type, text) {
        const el = document.getElementById('ormas-msg');
        if (!el) return;
        el.className = type === 'success'
            ? 'text-sm rounded-xl px-4 py-3 font-medium bg-green-50 border border-green-200 text-green-700'
            : 'text-sm rounded-xl px-4 py-3 font-medium bg-red-50 border border-red-200 text-red-600';
        el.textContent = text;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 6000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FITUR 10: HAPUS ORMAS
    // ═══════════════════════════════════════════════════════════════════════════
    window.hapusOrmas = async function (id) {
        if (!confirm('Hapus ormas ini dari daftar? Tindakan tidak bisa dibatalkan.')) return;
        try {
            const { error } = await window.supabaseClient.from('daftar_ormas').delete().eq('id', id);
            if (error) throw error;
            fetchDaftarOrmas();
        } catch (e) {
            alert('Gagal hapus ormas: ' + e.message);
        }
    };

});
