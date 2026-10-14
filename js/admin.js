// =============================================
// ADMIN DASHBOARD - Kelola Mahasiswa & Point
// =============================================

let allMahasiswa = [];

// Initialize admin page
async function initAdmin() {
    await supabaseReady;
    if (!supabaseClient) {
        alert('Supabase belum terhubung. Periksa konfigurasi .env atau Vercel!');
        return;
    }

    const session = await checkAuth();
    if (!session) return;
    
    // Display admin email
    const adminEmailEl = document.getElementById('adminEmail');
    if (adminEmailEl) {
        adminEmailEl.textContent = session.user.email;
    }

    await loadMahasiswa();
    await loadStats();

    // Close search dropdowns when clicked outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#modal-addPoint')) {
            document.getElementById('addPointDropdown')?.classList.add('hidden');
        }
        if (!e.target.closest('#modal-reducePoint')) {
            document.getElementById('reducePointDropdown')?.classList.add('hidden');
        }
    });
}

// Load all students
async function loadMahasiswa() {
    try {
        const { data, error } = await supabaseClient
            .from('mahasiswa')
            .select('*')
            .order('nama', { ascending: true });

        if (error) throw error;

        allMahasiswa = data || [];
        renderTable(allMahasiswa);
    } catch (error) {
        console.error('Error loading mahasiswa:', error);
        document.getElementById('mahasiswaTable').innerHTML = `
            <tr><td colspan="6" class="px-6 py-8 text-center text-red-400">
                <i class="fas fa-exclamation-circle text-xl mb-2"></i>
                <p>Gagal memuat data: ${error.message}</p>
            </td></tr>`;
    }
}

// Load statistics
async function loadStats() {
    try {
        // Total mahasiswa
        const { count: totalMhs } = await supabaseClient
            .from('mahasiswa')
            .select('*', { count: 'exact', head: true });
        document.getElementById('totalMahasiswa').textContent = totalMhs || 0;

        // Total points given
        const { data: pointsData } = await supabaseClient
            .from('point_history')
            .select('jumlah')
            .eq('tipe', 'tambah');
        const totalPts = (pointsData || []).reduce((sum, p) => sum + p.jumlah, 0);
        document.getElementById('totalPoints').textContent = totalPts;

        // Today's transactions
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabaseClient
            .from('point_history')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);
        document.getElementById('todayTransactions').textContent = todayCount || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render table
function renderTable(data) {
    const tbody = document.getElementById('mahasiswaTable');
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="px-6 py-12 text-center text-gray-400">
                <i class="fas fa-inbox text-3xl mb-2"></i>
                <p>Belum ada data mahasiswa</p>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((mhs, i) => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 text-sm text-gray-500">${i + 1}</td>
            <td class="px-6 py-4">
                <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-semibold text-gray-700">${mhs.nim}</span>
            </td>
            <td class="px-6 py-4">
                <span class="font-medium text-gray-800">${mhs.nama}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">${mhs.kelas}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-3.5 py-1 rounded-full font-bold text-lg">
                    ${mhs.total_point || 0}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="viewHistory('${mhs.nim}', '${mhs.nama}')" 
                        class="text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition" title="Riwayat Point">
                        <i class="fas fa-history"></i>
                    </button>
                    <button onclick="quickAdd('${mhs.nim}', '${mhs.nama}')" 
                        class="text-green-500 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition" title="Tambah Point">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button onclick="quickReduce('${mhs.nim}', '${mhs.nama}')" 
                        class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition" title="Kurangi Point">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button onclick="deleteMahasiswa('${mhs.nim}', '${mhs.nama}')" 
                        class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Search mahasiswa di tabel
function searchMahasiswa() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allMahasiswa.filter(m => 
        m.nim.toLowerCase().includes(query) || 
        m.nama.toLowerCase().includes(query) ||
        m.kelas.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

// Modal functions
function openModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (modal) {
        modal.style.display = 'none';
    }
}

// =============================================
// FITUR SEARCH AUTOCOMPLETE MAHASISWA DI MODAL
// =============================================

function filterSearchStudent(type) {
    const isAdd = type === 'addPoint';
    const input = document.getElementById(isAdd ? 'pointSearchInput' : 'reduceSearchInput');
    const dropdown = document.getElementById(isAdd ? 'addPointDropdown' : 'reducePointDropdown');
    const query = input.value.trim().toLowerCase();

    const matches = allMahasiswa.filter(m => 
        m.nim.toLowerCase().includes(query) || 
        m.nama.toLowerCase().includes(query)
    ).slice(0, 10); // Ambil maks 10 hasil teratas

    if (matches.length === 0) {
        dropdown.innerHTML = `<div class="p-3 text-sm text-gray-400 text-center">Mahasiswa tidak ditemukan</div>`;
        dropdown.classList.remove('hidden');
        return;
    }

    dropdown.innerHTML = matches.map(m => `
        <div onclick="selectStudent('${type}', '${m.nim}', '${m.nama.replace(/'/g, "\\'")}', '${m.kelas}')"
            class="px-4 py-2.5 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center transition">
            <div>
                <p class="font-semibold text-gray-800 text-sm">${m.nama}</p>
                <p class="text-xs text-gray-500 font-mono">${m.nim} • ${m.kelas}</p>
            </div>
            <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${m.total_point} pts</span>
        </div>
    `).join('');

    dropdown.classList.remove('hidden');
}

function selectStudent(type, nim, nama, kelas) {
    const isAdd = type === 'addPoint';
    const nimField = document.getElementById(isAdd ? 'pointNIM' : 'reduceNIM');
    const searchInput = document.getElementById(isAdd ? 'pointSearchInput' : 'reduceSearchInput');
    const dropdown = document.getElementById(isAdd ? 'addPointDropdown' : 'reducePointDropdown');
    const infoBox = document.getElementById(isAdd ? 'pointSelectedInfo' : 'reduceSelectedInfo');

    nimField.value = nim;
    searchInput.value = `${nama} (${nim})`;
    dropdown.classList.add('hidden');

    if (infoBox) {
        infoBox.innerHTML = `<i class="fas fa-check-circle mr-1"></i> Terpilih: <strong>${nama}</strong> (NIM: ${nim} - Kelas: ${kelas})`;
        infoBox.classList.remove('hidden');
    }
}

// Quick action buttons from table
function quickAdd(nim, nama) {
    const mhs = allMahasiswa.find(m => m.nim === nim);
    selectStudent('addPoint', nim, nama, mhs ? mhs.kelas : '');
    openModal('addPoint');
}

function quickReduce(nim, nama) {
    const mhs = allMahasiswa.find(m => m.nim === nim);
    selectStudent('reducePoint', nim, nama, mhs ? mhs.kelas : '');
    openModal('reducePoint');
}

// =============================================
// UPDATE BADGE POINT OTOMATIS BERDASARKAN KATEGORI
// =============================================

function updatePointBadge() {
    const select = document.getElementById('pointKategori');
    const selectedOption = select.options[select.selectedIndex];
    const point = selectedOption.getAttribute('data-point') || 0;
    const display = document.getElementById('pointDisplay');
    display.textContent = `+${point} Point`;
}

function updateReduceBadge() {
    const select = document.getElementById('reduceKategori');
    const selectedOption = select.options[select.selectedIndex];
    const point = selectedOption.getAttribute('data-point') || 0;
    const display = document.getElementById('reduceDisplay');
    display.textContent = `-${point} Point`;
}

// =============================================
// SIMPAN TRANSAKSI POINT
// =============================================

// Tambah Point
async function tambahPoint(e) {
    e.preventDefault();
    const nim = document.getElementById('pointNIM').value.trim();
    const select = document.getElementById('pointKategori');
    const kategori = select.value;
    const selectedOption = select.options[select.selectedIndex];
    const jumlah = parseInt(selectedOption.getAttribute('data-point') || '1');
    const keterangan = document.getElementById('pointKeterangan').value.trim();

    if (!nim) {
        alert('Silakan pilih mahasiswa terlebih dahulu!');
        return;
    }

    try {
        // Ambil data mahasiswa
        const { data: mhs, error: findError } = await supabaseClient
            .from('mahasiswa')
            .select('*')
            .eq('nim', nim)
            .single();

        if (findError || !mhs) {
            alert('Mahasiswa tidak ditemukan!');
            return;
        }

        // Simpan riwayat transaksi
        const { error: historyError } = await supabaseClient
            .from('point_history')
            .insert([{
                nim,
                jumlah,
                tipe: 'tambah',
                kategori,
                keterangan: keterangan || null
            }]);

        if (historyError) throw historyError;

        // Update total point
        const { error: updateError } = await supabaseClient
            .from('mahasiswa')
            .update({ total_point: (mhs.total_point || 0) + jumlah })
            .eq('nim', nim);

        if (updateError) throw updateError;

        alert(`✅ Berhasil menambahkan +${jumlah} Point untuk ${mhs.nama}!`);
        closeModal('addPoint');
        
        // Reset form
        document.getElementById('pointNIM').value = '';
        document.getElementById('pointSearchInput').value = '';
        document.getElementById('pointKategori').selectedIndex = 0;
        document.getElementById('pointKeterangan').value = '';
        document.getElementById('pointSelectedInfo')?.classList.add('hidden');
        updatePointBadge();

        await loadMahasiswa();
        await loadStats();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Kurangi Point
async function kurangiPoint(e) {
    e.preventDefault();
    const nim = document.getElementById('reduceNIM').value.trim();
    const select = document.getElementById('reduceKategori');
    const kategori = select.value;
    const selectedOption = select.options[select.selectedIndex];
    const jumlah = parseInt(selectedOption.getAttribute('data-point') || '1');
    const alasan = document.getElementById('reduceAlasan').value.trim();

    if (!nim) {
        alert('Silakan pilih mahasiswa terlebih dahulu!');
        return;
    }

    try {
        const { data: mhs, error: findError } = await supabaseClient
            .from('mahasiswa')
            .select('*')
            .eq('nim', nim)
            .single();

        if (findError || !mhs) {
            alert('Mahasiswa tidak ditemukan!');
            return;
        }

        // Simpan riwayat
        const { error: historyError } = await supabaseClient
            .from('point_history')
            .insert([{
                nim,
                jumlah,
                tipe: 'kurang',
                kategori: kategori,
                keterangan: alasan
            }]);

        if (historyError) throw historyError;

        // Update total point (minimal 0)
        const newTotal = Math.max(0, (mhs.total_point || 0) - jumlah);
        const { error: updateError } = await supabaseClient
            .from('mahasiswa')
            .update({ total_point: newTotal })
            .eq('nim', nim);

        if (updateError) throw updateError;

        alert(`✅ Berhasil mengurangi -${jumlah} Point dari ${mhs.nama}!`);
        closeModal('reducePoint');

        // Reset form
        document.getElementById('reduceNIM').value = '';
        document.getElementById('reduceSearchInput').value = '';
        document.getElementById('reduceKategori').selectedIndex = 0;
        document.getElementById('reduceAlasan').value = '';
        document.getElementById('reduceSelectedInfo')?.classList.add('hidden');
        updateReduceBadge();

        await loadMahasiswa();
        await loadStats();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// =============================================
// TAMBAH MAHASISWA & IMPORT CSV
// =============================================

// Tambah Mahasiswa Manual
async function tambahMahasiswa(e) {
    e.preventDefault();
    const nim = document.getElementById('inputNIM').value.trim();
    const nama = document.getElementById('inputNama').value.trim();
    const kelas = document.getElementById('inputKelas').value.trim();

    try {
        const { error } = await supabaseClient
            .from('mahasiswa')
            .insert([{ nim, nama, kelas, total_point: 0 }]);

        if (error) throw error;

        alert('✅ Mahasiswa berhasil ditambahkan!');
        closeModal('addStudent');
        document.getElementById('inputNIM').value = '';
        document.getElementById('inputNama').value = '';
        document.getElementById('inputKelas').value = '';
        await loadMahasiswa();
        await loadStats();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Import CSV
async function prosesImportCsv() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Silakan pilih file CSV terlebih dahulu!');
        return;
    }

    const btn = document.getElementById('btnUploadCsv');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Mengimpor data...';

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

            if (lines.length <= 1) {
                alert('File CSV kosong atau hanya berisi baris header!');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-upload mr-2"></i> Mulai Import Data';
                return;
            }

            const rowsToInsert = [];
            // Lewati baris pertama jika header (nim, nama, kelas)
            const startIndex = lines[0].toLowerCase().includes('nim') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
                if (cols.length >= 3 && cols[0] && cols[1] && cols[2]) {
                    rowsToInsert.push({
                        nim: cols[0],
                        nama: cols[1],
                        kelas: cols[2],
                        total_point: 0
                    });
                }
            }

            if (rowsToInsert.length === 0) {
                alert('Format CSV tidak cocok. Pastikan berisi minimal 3 kolom: nim,nama,kelas');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-upload mr-2"></i> Mulai Import Data';
                return;
            }

            // Gunakan upsert agar jika NIM sudah ada, data ter-update
            const { data, error } = await supabaseClient
                .from('mahasiswa')
                .upsert(rowsToInsert, { onConflict: 'nim' });

            if (error) throw error;

            alert(`🎉 Berhasil mengimpor ${rowsToInsert.length} data mahasiswa!`);
            closeModal('importCsv');
            fileInput.value = '';
            await loadMahasiswa();
            await loadStats();
        } catch (error) {
            alert('Gagal mengimpor CSV: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-upload mr-2"></i> Mulai Import Data';
        }
    };
    reader.readAsText(file);
}

// Delete Mahasiswa
async function deleteMahasiswa(nim, nama) {
    if (!confirm(`Yakin ingin menghapus mahasiswa ${nama} (${nim})?\nSemua riwayat point juga akan dihapus.`)) return;

    try {
        await supabaseClient.from('point_history').delete().eq('nim', nim);
        const { error } = await supabaseClient.from('mahasiswa').delete().eq('nim', nim);
        if (error) throw error;

        alert(`Mahasiswa ${nama} berhasil dihapus!`);
        await loadMahasiswa();
        await loadStats();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// View point history for a student
async function viewHistory(nim, nama) {
    openModal('history');
    const content = document.getElementById('historyContent');
    content.innerHTML = '<p class="text-gray-400 text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat riwayat...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('point_history')
            .select('*')
            .eq('nim', nim)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            content.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>Belum ada riwayat point untuk <strong>${nama}</strong></p>
                </div>`;
            return;
        }

        content.innerHTML = `
            <p class="text-sm text-gray-500 mb-4">Riwayat point: <strong>${nama}</strong> (${nim})</p>
            <div class="space-y-3">
                ${data.map(h => {
                    const date = new Date(h.created_at).toLocaleString('id-ID');
                    const isAdd = h.tipe === 'tambah';
                    return `
                        <div class="flex items-start space-x-3 p-3 rounded-xl ${isAdd ? 'bg-green-50' : 'bg-red-50'}">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center ${isAdd ? 'bg-green-100' : 'bg-red-100'} flex-shrink-0 mt-0.5">
                                <i class="fas ${isAdd ? 'fa-plus' : 'fa-minus'} ${isAdd ? 'text-green-600' : 'text-red-600'}"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-start">
                                    <span class="font-semibold ${isAdd ? 'text-green-700' : 'text-red-700'}">
                                        ${isAdd ? '+' : '-'}${h.jumlah} Point
                                    </span>
                                    <span class="text-xs text-gray-400">${date}</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-0.5">
                                    <span class="font-medium">${h.kategori}</span>
                                    ${h.keterangan ? ` — ${h.keterangan}` : ''}
                                </p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>`;
    } catch (error) {
        content.innerHTML = `<p class="text-red-500 text-center">Error: ${error.message}</p>`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdmin);
