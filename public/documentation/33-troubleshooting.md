# Troubleshooting

| Masalah | Kemungkinan penyebab | Solusi |
|---|---|---|
| Node tidak bisa disimpan | Field wajib kosong. | Isi field yang ditandai wajib, lalu simpan kembali. |
| Connection tidak dapat dibuat | Port sumber atau tujuan tidak cocok. | Pastikan garis dimulai dari Output Port dan berakhir di Input Port yang tersedia. |
| `failed` tidak punya tujuan | Cabang error belum dibuat. | Hubungkan `failed` ke penanganan error atau `End`. |
| Workflow gagal divalidasi karena jalur belum selesai | Ada jalur yang tidak mencapai `End` atau Node terminal. | Telusuri setiap Output Port dan tambahkan tujuan akhir. |
| `timeout_seconds` ditolak | Timeout aktif tetapi durasi kosong, nol, atau negatif. | Isi durasi positif atau matikan `enable_timeout`. |
| `AI Classification` tidak menemukan port yang diharapkan | Label belum dikonfigurasi atau ID label berubah. | Periksa daftar `labels` dan gunakan port yang dibuat dari label tersebut. |
| `Open Document` menghasilkan `not_opened` | Participant belum membuka dokumen sesuai target. | Gunakan cabang `not_opened` untuk reminder atau langkah lanjutan. |
| `Check Reply Attachment` tidak dapat dihubungkan | Input bukan `reply` dari `Wait for Reply` email. | Hubungkan langsung dari `Wait for Reply` dengan channel `email`. |
| `Wait for Attachment Open` gagal dikonfigurasi | Source bukan `Send Email` atau attachment belum dipilih. | Pilih Node `Send Email` yang memiliki email dan pilih attachment yang sesuai. |
| Call tidak berjalan | Tidak ada sesi call aktif atau setting mode belum lengkap. | Pastikan `Start Call` berhasil; pada `Agent Driven`, isi `prompt_id` dan `model_id`. |
| Participant tidak masuk call | Undangan belum bergabung sampai batas waktu. | Tangani port `timeout` pada `Invite to Call`, misalnya dengan reminder. |
| Loop berjalan terlalu banyak | Batas iterasi terlalu tinggi atau graph loop tidak benar. | Gunakan `max_iterations` 1–50 dan periksa jalur kembali ke `Loop`. |

Jika pesan validasi menyebut Node tertentu, perbaiki Node tersebut lebih dulu lalu jalankan validasi ulang.
