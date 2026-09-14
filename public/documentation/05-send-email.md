# Send Email

## Apa itu Send Email?

`Send Email` mengirim email master yang telah disiapkan sebelumnya.

## Kapan digunakan?

Gunakan untuk mengirim instruksi, informasi, reminder, atau pesan follow-up melalui email.

## Contoh

~~~mermaid
flowchart LR
    A[Send Email] -->|success| B[Wait for Reply]
    A -->|failed| C([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A action
    class B wait
    class C terminal
~~~

Email yang berhasil dikirim dapat diikuti oleh penantian balasan; kegagalan diarahkan ke error handling.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan pengiriman email. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Email berhasil dikirim. | Untuk melanjutkan workflow atau menunggu balasan. |
| `failed` | Email gagal dikirim. | Untuk error handling atau `End`. |

## Output yang dihasilkan

- `success`: `message_id` dan `sent_at`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Email ID (`email_id`)

**Apa fungsinya?** Memilih email master yang akan dikirim.

**Apa yang harus diisi?** Pilih satu email dari picker `Email`.

**Wajib diisi?** Ya.

**Contoh:** Pilih email “Reminder laporan mingguan”.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`success` dapat menuju `Wait for Reply`, `Wait for Read`, `Wait for Attachment Open`, action lain, atau `End`. `failed` menuju jalur error.

## Kesalahan Umum

- `email_id` belum dipilih.
- Email master tidak memiliki data penerima/pengirim yang sesuai.
- Menghubungkan wait attachment ke Node selain `Send Email`.

## Tips

Jika email memiliki attachment dan harus dipantau, simpan Node ini sebagai source untuk `Wait for Attachment Open`.
