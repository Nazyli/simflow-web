# Wait for Call End

## Apa itu Wait for Call End?

`Wait for Call End` menunggu sesi call aktif berakhir.

## Kapan digunakan?

Gunakan ketika workflow perlu melanjutkan langkah setelah call berakhir, baik karena normal maupun terputus.

## Contoh

~~~mermaid
flowchart LR
    A[Wait for Call End] -->|success| B[Next Node]
    A -->|disconnected| C[Handle Disconnect]
    A -->|failed| D([End])
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B,C action
    class D terminal
~~~

Call yang selesai normal menuju `success`; call yang terputus dapat ditangani berbeda melalui `disconnected`.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai penantian akhir call. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Call berakhir. | Untuk melanjutkan workflow. |
| `disconnected` | Call terputus. | Untuk menangani disconnect. |
| `failed` | Penantian gagal. | Untuk error handling. |

## Output yang dihasilkan

- `success`: `participant_call_session_id`, `status`, `end_reason`, `ended_at`.
- `disconnected`: sesi, status, alasan, dan waktu disconnect.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

Tidak tersedia / tidak berlaku. Tidak ada setting wajib atau opsional.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Membutuhkan sesi call yang dapat dilacak. Hubungkan `success`, `disconnected`, dan `failed` ke jalur masing-masing.

## Kesalahan Umum

- Menjalankan tanpa call aktif.
- Tidak menangani `disconnected`.
- Menggunakan Node ini untuk meminta call berakhir secara aktif.

## Tips

Gunakan `End Call` jika workflow yang meminta penghentian call.
