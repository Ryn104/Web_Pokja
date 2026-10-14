// =============================================
// STUDENT PAGE - Cek Point Mahasiswa
// =============================================

async function cekPoint() {
    await supabaseReady;
    const nim = document.getElementById('nimInput').value.trim();
    const resultDiv = document.getElementById('result');

    if (!supabaseClient) {
        resultDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                <i class="fas fa-exclamation-circle mr-2"></i> Konfigurasi database belum tersedia.
            </div>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    if (!nim) {
        resultDiv.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 flex items-center">
                <i class="fas fa-exclamation-triangle mr-3 text-xl"></i>
                <span>Silakan masukkan NIM terlebih dahulu!</span>
            </div>`;
        resultDiv.classList.remove('hidden');
        return;
    }

    resultDiv.innerHTML = `
        <div class="text-center py-4 text-gray-400">
            <i class="fas fa-spinner fa-spin text-xl"></i>
            <p class="mt-2">Mencari data...</p>
        </div>`;
    resultDiv.classList.remove('hidden');

    try {
        // Get student data
        const { data: mhs, error } = await supabaseClient
            .from('mahasiswa')
            .select('*')
            .eq('nim', nim)
            .single();

        if (error || !mhs) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <i class="fas fa-user-slash text-red-400 text-3xl mb-2"></i>
                    <p class="text-red-700 font-medium">Mahasiswa dengan NIM <strong>${nim}</strong> tidak ditemukan.</p>
                    <p class="text-red-500 text-sm mt-1">Pastikan NIM yang dimasukkan sudah benar.</p>
                </div>`;
            return;
        }

        // Get point history
        const { data: history } = await supabaseClient
            .from('point_history')
            .select('*')
            .eq('nim', nim)
            .order('created_at', { ascending: false })
            .limit(5);

        resultDiv.innerHTML = `
            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span class="text-white text-2xl font-bold">${mhs.nama.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="flex-1 text-center sm:text-left">
                        <h3 class="text-xl font-bold text-gray-800">${mhs.nama}</h3>
                        <p class="text-gray-500"><span class="font-mono bg-white px-2 py-0.5 rounded text-sm">${mhs.nim}</span> • ${mhs.kelas}</p>
                        <div class="mt-3 inline-flex items-center bg-white shadow-md px-5 py-2 rounded-xl">
                            <i class="fas fa-star text-yellow-500 mr-2 text-lg"></i>
                            <span class="text-3xl font-extrabold text-gray-800">${mhs.total_point || 0}</span>
                            <span class="text-gray-500 ml-2 text-sm">Total Point</span>
                        </div>
                    </div>
                </div>

                ${history && history.length > 0 ? `
                    <div class="mt-6 border-t border-purple-200 pt-4">
                        <h4 class="text-sm font-semibold text-gray-600 mb-3">
                            <i class="fas fa-history mr-1"></i> Riwayat Terbaru
                        </h4>
                        <div class="space-y-2">
                            ${history.map(h => {
                                const date = new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                const isAdd = h.tipe === 'tambah';
                                return `
                                    <div class="flex items-center justify-between bg-white rounded-lg px-4 py-2 text-sm">
                                        <div class="flex items-center space-x-2">
                                            <span class="w-6 h-6 rounded-full flex items-center justify-center ${isAdd ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                                <i class="fas ${isAdd ? 'fa-plus' : 'fa-minus'} text-xs"></i>
                                            </span>
                                            <span class="text-gray-700">${h.kategori}</span>
                                        </div>
                                        <div class="flex items-center space-x-3">
                                            <span class="font-bold ${isAdd ? 'text-green-600' : 'text-red-600'}">
                                                ${isAdd ? '+' : '-'}${h.jumlah}
                                            </span>
                                            <span class="text-gray-400 text-xs">${date}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>`;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                <i class="fas fa-exclamation-circle mr-2"></i> Terjadi kesalahan: ${error.message}
            </div>`;
    }
}

// Allow pressing Enter to search
document.getElementById('nimInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') cekPoint();
});
