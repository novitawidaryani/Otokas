# Master Prompt - OtoKas (Python Flask & Single Page Application)

> "Buatkan aplikasi web pencatatan keuangan bernama **'OtoKas'** berbasis **Python Flask** sebagai backend server dan Single Page Application (SPA) pada sisi *frontend*. Backend menggunakan penyimpanan data berbasis file JSON lokal (`otokas_data.json`).
> 
> Tampilan antarmuka menggunakan **Tailwind CSS** via CDN dengan skema warna krem pastel (`#FFFDF5`) dan biru navy (`#364C84`), dirancang dengan prinsip *mobile-first* yang bersih, modern, dan responsif.

## ✨ Fitur & Fungsionalitas Utama:
1. **Arsitektur & Penyimpanan Data (Backend Flask):**
   - Menggunakan Flask dengan endpoint REST API `/api/data` (`GET` dan `POST`) untuk memuat serta menyimpan data transaksi, anggaran, dan kategori kustom secara sinkron ke file `otokas_data.json`.
   - Merender antarmuka SPA secara dinamis melalui `render_template_string`.

2. **Dashboard Finansial:**
   - Kartu dompet yang menampilkan **Total Saldo Tersedia**, **Pemasukan Bulan Ini**, dan **Pengeluaran Bulan Ini**.
   - **Indikator Kesehatan Finansial Dinamis:** Berubah otomatis menjadi **'Aman'**, **'Waspada: Saldo Menipis'** (jika pengeluaran mencapai $\ge 75\%$ dari pemasukan), atau **'Defisit'** (jika total saldo bernilai minus).
   - Visualisasi grafik interaktif menggunakan **Chart.js** (Grafik Donat proporsi kategori dan Grafik Garis tren pengeluaran harian 7 hari terakhir).

3. **Manajemen Transaksi & Aksi Cepat:**
   - Modal interaktif untuk mencatat pemasukan/pengeluaran baru serta fitur **Edit Transaksi** bagi data yang sudah diinput.
   - Penambahan kategori kustom secara langsung (*dynamic custom categories*).
   - Fitur pencarian (*search bar*) serta filter data berdasarkan kategori dan rentang waktu (Semua Waktu, Hari Ini, Bulan Ini).

4. **Manajemen Anggaran (Budgeting):**
   - Pengaturan batas maksimal limit bulanan per kategori pengeluaran.
   - Fitur Edit dan Hapus batas anggaran dengan pembaruan sisa anggaran (*remaining*) secara *real-time*.
   - Indikator status kategori (Aman, Mendekati Batas $\ge 80\%$, dan Overbudget).

5. **Ekspor Laporan PDF Fleksibel:**
   - Integrasi *library* `jsPDF` dan `jsPDF-AutoTable`.
   - Modal filter tambahan untuk mengunduh laporan PDF berdasarkan kategori spesifik atau rentang tanggal tertentu, lengkap dengan baris ringkasan total pemasukan dan pengeluaran."