# Port Reference

## Input Port

Input Port menerima alur dari Node sebelumnya. Pada katalog saat ini, hampir semua Node memiliki satu Input Port flow standar. Input tersebut hanya menandakan bahwa Node boleh dijalankan; data konfigurasi Node diisi melalui panel konfigurasi, bukan dengan membuat port data baru.

`Start` tidak memiliki Input Port karena merupakan titik awal.

## Output Port

Output Port menentukan hasil dan jalur yang dipilih setelah Node selesai.

| Jenis hasil | Contoh port | Arti |
|---|---|---|
| Berhasil | `success`, `started`, `joined`, `read` | Langkah selesai atau event yang ditunggu terjadi. |
| Respons | Port Actor, `has_attachment`, `no_attachment` | Participant membalas ke Actor terpilih atau memenuhi kondisi bisnis tertentu. |
| Dokumen dibuka | `opened` | Jumlah pembukaan dokumen mencapai target. |
| Waktu habis | `timeout` | Event yang ditunggu belum terjadi sampai batas waktu. |
| Batas iterasi | `limit_reached` | Batas Loop yang dikonfigurasi tercapai; ini bukan error teknis. |
| Gagal | `failed` | Node tidak dapat menyelesaikan prosesnya. |
| Call berakhir tidak normal | `disconnected` | Sesi call terputus. |
| Hasil AI | Port sesuai label | Classification memilih salah satu label yang dikonfigurasi. |

## Aturan connection

- Tarik connection dari Output Port sumber ke Input Port tujuan.
- Gunakan nama port yang benar-benar tersedia pada Node.
- Hubungkan setiap hasil yang perlu ditangani; khususnya `failed` dan `timeout`.
- `Check Reply Attachment` hanya menerima input langsung dari port Actor milik `Wait for Reply` dengan channel `email`.
- `Wait for Attachment Open` harus merujuk ke Node `Send Email` sebagai sumber email.
- `End` tidak memiliki Output Port dan tidak boleh menjadi sumber connection.
- Hindari cycle biasa. Pengulangan harus menggunakan pola `Loop` yang memiliki batas iterasi.

## Output dan data

Output Port membawa dua hal: nama port yang dipilih dan data hasilnya. Contohnya, `Send Chat` memilih `success` dan menghasilkan `message_id` serta `sent_at`. Data tersebut adalah hasil runtime; pengguna tidak perlu membuat Output Port baru untuk menampungnya.

Jika suatu Node memiliki output dinamis, seperti `AI Classification` atau `Wait for Reply`, backend membentuk port dari label atau ID Actor yang dikonfigurasi, lalu menambahkan port status seperti `timeout` dan `failed` sesuai kontrak Node.
