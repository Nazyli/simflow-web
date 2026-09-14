# Wait for Read

## Apa itu Wait for Read?

`Wait for Read` menunggu sampai pesan channel sebelumnya dibaca participant.

## Kapan digunakan?

Gunakan setelah `Send Chat` atau `Send Email` jika langkah berikutnya baru boleh berjalan setelah pesan dibaca.

## Contoh

~~~mermaid
flowchart LR
    A[Send Chat] --> B{Wait for Read}
    B -->|read| C[Next Node]
    B -->|timeout| D[Reminder]
    B -->|failed| E([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,C,D action
    class B wait
    class E terminal
~~~

Workflow melanjutkan saat pesan dibaca, atau menjalankan reminder saat deadline terlewati.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai penantian status read dari pesan sebelumnya. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `read` | Pesan telah dibaca. | Untuk melanjutkan workflow. |
| `timeout` | Pesan belum dibaca sampai deadline. | Untuk reminder atau jalur alternatif. |
| `failed` | Penantian gagal. | Untuk error handling. |

## Output yang dihasilkan

- `read`: `execution_id`, `node_execution_id`, `message_id`, `read_at`.
- `timeout`: `message_id`, `timeout_seconds`, dan `timed_out_at`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Channel (`channel`)

**Apa fungsinya?** Menentukan channel pesan yang dipantau.

**Apa yang harus diisi?** `chat` atau `email`; default `chat`.

**Wajib diisi?** Tidak, karena ada default.

**Contoh:** Pilih `email` untuk menunggu email dibaca.

### Enable Timeout (`enable_timeout`)

**Apa fungsinya?** Mengaktifkan atau menonaktifkan batas waktu.

**Apa yang harus diisi?** Checkbox; default `true`.

**Wajib diisi?** Ya.

**Contoh:** Matikan hanya jika tidak ada batas waktu bisnis.

### Timeout Seconds (`timeout_seconds`)

**Apa fungsinya?** Menentukan batas tunggu dalam detik.

**Apa yang harus diisi?** Integer positif; default `600`.

**Wajib diisi?** Jika timeout aktif.

**Contoh:** `3600` untuk satu jam.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`read`, `timeout`, dan `failed` adalah cabang berbeda. Input harus mengikuti pesan channel yang dapat dilacak status bacanya.

## Kesalahan Umum

- Tidak ada pesan sebelumnya yang dapat dikorelasikan.
- Timeout nol atau negatif.
- Tidak menangani `timeout`.

## Tips

Pilih channel yang sama dengan channel pesan pendahulunya.
