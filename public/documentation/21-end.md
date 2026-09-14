# End

## Apa itu End?

`End` mengakhiri jalur execution saat ini. Setelah Node ini tidak ada langkah lanjutan.

## Kapan digunakan?

Gunakan pada setiap cabang yang memang selesai, termasuk cabang error jika tidak ada recovery.

## Contoh

Hubungkan output `success` dari Node terakhir ke `End`.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menerima alur dari Node sebelumnya. |

## Output Port

Tidak tersedia / tidak berlaku. `End` tidak memiliki Output Port.

## Output yang dihasilkan

`selected_port: null` dan `data: {}`.

## Konfigurasi

Tidak tersedia / tidak berlaku. Tidak ada setting wajib atau opsional.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`End` dapat menerima connection dari Node sebelumnya. `End` tidak boleh memiliki connection keluar.

## Kesalahan Umum

- Menarik garis keluar dari `End`.
- Membiarkan cabang workflow berhenti tanpa Node terminal.

## Tips

Gunakan `End` untuk membuat akhir setiap jalur mudah terlihat saat meninjau canvas.
