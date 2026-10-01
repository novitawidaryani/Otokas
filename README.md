# OtoKas - Pencatat Keuangan Pintar 🚀

**OtoKas** adalah aplikasi web pencatatan keuangan pribadi berbasis *Single Page Application (SPA)* yang dirancang dengan antarmuka futuristik, bersih, dan ramah pengguna. Aplikasi ini dirancang untuk memudahkan pemantauan arus kas masuk (pemasukan), arus kas keluar (pengeluaran), pengelolaan anggaran bulanan, serta penyusunan laporan keuangan otomatis dalam format PDF.

---

## ✨ Fitur Utama
- **Dashboard Interaktif**: Menampilkan ringkasan total saldo, pemasukan, pengeluaran bulan ini, serta status kesehatan keuangan dinamis (Aman, Waspada, Defisit).
- **Grafik Visualisasi**: Dilengkapi *Doughnut Chart* (distribusi kategori) dan *Line Chart* (tren pengeluaran harian 7 hari terakhir) menggunakan Chart.js.
- **Pencatatan & Manajemen Transaksi**: Fitur catat pemasukan/pengeluaran lengkap dengan kategori kustom, catatan tambahan, pencarian instan, filter berdasarkan tanggal/kategori, serta opsi Edit & Hapus transaksi.
- **Manajemen Anggaran (Budgeting)**: Mengatur limit pengeluaran per kategori setiap bulan dengan indikator progress bar dan peringatan otomatis jika mendekati atau melewati batas (*overbudget*).
- **Ekspor Laporan PDF**: Unduh laporan riwayat transaksi dalam bentuk dokumen PDF lengkap dengan filter tanggal dan kategori menggunakan pustaka jsPDF.
- **Penyimpanan Lokal (LocalStorage)**: Seluruh data transaksi, anggaran, dan kategori tersimpan secara aman di browser lokal pengguna.

---

## 📂 Struktur Proyek
Proyek ini dipisahkan menjadi struktur file modular agar lebih rapi dan mudah dikembangkan:
```text
📂 OtoKas/
├── index.html       # Kerangka antarmuka, struktur halaman SPA, dan elemen modal
├── style.css        # Pengaturan gaya tampilan, kustomisasi scrollbar, dan estetika warna
└── script.js        # Logika aplikasi, manajemen state, interaksi DOM, Chart.js, dan jsPDF