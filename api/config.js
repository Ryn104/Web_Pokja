// Vercel Serverless Function untuk menyediakan konfigurasi ke Frontend
// Mengambil nilai aman dari Environment Variables server/Vercel

module.exports = (req, res) => {
    // Set header agar hanya bisa diakses via format JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

    res.status(200).json({
        supabaseUrl,
        supabaseAnonKey
    });
};
