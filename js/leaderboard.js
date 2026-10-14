// =============================================
// LEADERBOARD - Peringkat Mahasiswa
// =============================================

async function loadLeaderboard() {
    await supabaseReady;
    if (!supabaseClient) {
        document.getElementById('leaderboardTable').innerHTML = `
            <div class="px-6 py-8 text-center text-red-400">Database belum terkonfigurasi.</div>`;
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('mahasiswa')
            .select('*')
            .order('total_point', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            document.getElementById('topThree').innerHTML = '';
            document.getElementById('leaderboardTable').innerHTML = `
                <div class="px-6 py-12 text-center text-gray-400">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>Belum ada data mahasiswa</p>
                </div>`;
            return;
        }

        renderTopThree(data.slice(0, 3));
        renderLeaderboard(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('leaderboardTable').innerHTML = `
            <div class="px-6 py-8 text-center text-red-400">Gagal memuat data: ${error.message}</div>`;
    }
}

function renderTopThree(top) {
    const container = document.getElementById('topThree');
    const medals = [
        { bg: 'gold', icon: 'fa-crown', color: 'text-yellow-800', rank: '1st' },
        { bg: 'silver', icon: 'fa-medal', color: 'text-blue-100', rank: '2nd' },
        { bg: 'bronze', icon: 'fa-medal', color: 'text-pink-100', rank: '3rd' }
    ];

    // Reorder for display: 2nd, 1st, 3rd
    const displayOrder = top.length >= 3 ? [top[1], top[0], top[2]] : top;
    const medalOrder = top.length >= 3 ? [medals[1], medals[0], medals[2]] : medals;
    const sizeOrder = top.length >= 3 ? ['', 'md:scale-110', ''] : [];

    container.innerHTML = displayOrder.map((mhs, i) => {
        if (!mhs) return '';
        const medal = medalOrder[i];
        const scale = sizeOrder[i] || '';
        return `
            <div class="${medal.bg} rounded-2xl p-6 text-center shadow-lg ${scale} transition-transform">
                <div class="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas ${medal.icon} text-2xl ${medal.color}"></i>
                </div>
                <h3 class="text-white font-bold text-lg mb-1">${mhs.nama}</h3>
                <p class="text-white/80 text-sm mb-3">${mhs.nim} • ${mhs.kelas}</p>
                <div class="bg-white/20 rounded-xl px-4 py-2 inline-block">
                    <span class="text-white text-2xl font-extrabold">${mhs.total_point || 0}</span>
                    <span class="text-white/80 text-sm ml-1">point</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderLeaderboard(data) {
    const container = document.getElementById('leaderboardTable');
    container.innerHTML = data.map((mhs, i) => `
        <div class="flex items-center px-6 py-4 hover:bg-gray-50 transition">
            <div class="w-10 text-center">
                ${i < 3 ? 
                    `<span class="text-lg">${['🥇','🥈','🥉'][i]}</span>` : 
                    `<span class="text-gray-400 font-medium">${i + 1}</span>`
                }
            </div>
            <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center ml-3 flex-shrink-0">
                <span class="text-white font-bold">${mhs.nama.charAt(0).toUpperCase()}</span>
            </div>
            <div class="ml-4 flex-1">
                <p class="font-medium text-gray-800">${mhs.nama}</p>
                <p class="text-sm text-gray-500">${mhs.nim} • ${mhs.kelas}</p>
            </div>
            <div class="text-right">
                <span class="text-xl font-bold text-gray-800">${mhs.total_point || 0}</span>
                <span class="text-gray-400 text-sm ml-1">pts</span>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadLeaderboard);
