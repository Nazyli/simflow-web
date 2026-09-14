# Start

## Apa itu Start?

`Start` adalah titik awal execution. Node ini memulai jalannya Simulation dan meneruskan context awal ke langkah berikutnya.

## Kapan digunakan?

Gunakan satu `Start` sebagai awal workflow.

## Contoh

Hubungkan `started` ke action pertama, misalnya `Send Chat`.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Tidak ada | Tidak berlaku | Tidak | `Start` tidak menerima connection masuk. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `started` | Simulation berhasil dimulai. | Untuk menuju langkah pertama. |

## Output yang dihasilkan

`started` menghasilkan context awal berbentuk object.

## Konfigurasi

Tidak tersedia / tidak berlaku untuk Node ini. Tidak ada setting wajib atau opsional.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

| Dari | Port | Dapat terhubung ke | Keterangan |
|---|---|---|---|
| Tidak ada | Tidak ada | `started` ke Node berikutnya | Tidak boleh ada connection masuk ke `Start`. |

## Kesalahan Umum

- Menambahkan connection masuk ke `Start`.
- Tidak menyediakan Node setelah `Start`.

## Tips

Letakkan `Start` di sisi kiri canvas supaya arah workflow mudah dibaca.
