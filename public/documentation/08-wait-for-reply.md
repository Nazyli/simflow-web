# Wait for Reply

## Apa itu Wait for Reply?

`Wait for Reply` menunda workflow sampai participant membalas melalui channel `chat` atau `email`, atau sampai batas waktu tercapai.

## Kapan digunakan?

Gunakan setelah `Send Chat` atau `Send Email` ketika langkah berikutnya bergantung pada balasan participant.

## Contoh

~~~mermaid
flowchart LR
    A[Send Chat] --> B{Wait for Reply}
    B -->|reply| C[Process Reply]
    B -->|timeout| D[Send Reminder]
    B -->|failed| E([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,C,D action
    class B wait
    class E terminal
~~~

Workflow melanjutkan ke `Process Reply` jika balasan datang. Jika tidak, cabang `timeout` dapat mengirim reminder.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai penantian untuk pesan sebelumnya. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `reply` | Balasan diterima. | Untuk memproses jawaban participant. |
| `timeout` | Tidak ada balasan sampai deadline. | Untuk follow-up atau jalur alternatif. |
| `failed` | Penantian gagal didaftarkan/diproses. | Untuk error handling. |

## Output yang dihasilkan

- `reply`: `execution_id`, `node_execution_id`, `message_id`, `content`, `replied_at`.
- `timeout`: `execution_id`, `node_execution_id`, `timeout_seconds`, `timed_out_at`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Channel (`channel`)

**Apa fungsinya?** Menentukan channel balasan yang ditunggu.

**Apa yang harus diisi?** `chat` atau `email`; default `chat`.

**Wajib diisi?** Tidak, karena ada default.

**Contoh:** Pilih `email` bila pesan sebelumnya dikirim sebagai email.

### To (`to`)

**Apa fungsinya?** Menentukan Actor yang wajib menerima balasan.

**Apa yang harus diisi?** Pilih Actor dari picker.

**Wajib diisi?** Ya.

**Contoh:** Pilih Actor yang mengirim instruksi kepada participant.

### Enable Timeout (`enable_timeout`)

**Apa fungsinya?** Menentukan apakah penantian memiliki batas waktu.

**Apa yang harus diisi?** Checkbox; default aktif.

**Wajib diisi?** Ya.

**Contoh:** Matikan bila workflow memang boleh menunggu tanpa deadline.

### Timeout Seconds (`timeout_seconds`)

**Apa fungsinya?** Menentukan lama penantian dalam detik.

**Apa yang harus diisi?** Integer positif; default `600`.

**Wajib diisi?** Hanya jika timeout aktif.

**Contoh:** `600` berarti menunggu 10 menit.

### Is Read (`is_read`)

**Apa fungsinya?** Menentukan apakah timer mengikuti event pesan dibaca.

**Apa yang harus diisi?** Checkbox; default `false`.

**Wajib diisi?** Tidak.

**Contoh:** Aktifkan jika waktu tunggu baru boleh dihitung setelah participant membaca pesan.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`reply` dapat menuju proses balasan. `timeout` dapat menuju reminder atau jalur alternatif. `failed` menuju error handling. Untuk `Check Reply Attachment`, input harus langsung berasal dari `reply` pada channel `email`.

## Kesalahan Umum

- `to` belum dipilih.
- `timeout_seconds` kosong, nol, atau negatif saat timeout aktif.
- Menganggap `timeout` adalah error teknis.
- Menghubungkan `Check Reply Attachment` dari channel chat.

## Tips

Selalu rancang apa yang harus terjadi jika participant tidak membalas.
