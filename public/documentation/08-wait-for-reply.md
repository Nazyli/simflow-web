# Wait for Reply

## Apa itu Wait for Reply?

`Wait for Reply` menunda workflow sampai participant membalas melalui channel `chat` atau `email`, atau sampai batas waktu tercapai.

## Kapan digunakan?

Gunakan setelah `Send Chat` atau `Send Email` ketika langkah berikutnya bergantung pada balasan participant.

## Contoh

~~~mermaid
flowchart LR
    A[Send Chat] --> B{Wait for Reply}
    B -->|actor-a| C[Process Reply A]
    B -->|actor-b| D[Process Reply B]
    B -->|timeout| E[Send Reminder]
    B -->|failed| F([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,C,D,E action
    class B wait
    class F terminal
~~~

Setiap Actor yang dikonfigurasi mendapat port sendiri. Balasan ke `actor-a` memilih port `actor-a`; balasan ke `actor-b` memilih port `actor-b`. Jika tidak ada balasan, cabang `timeout` dapat mengirim reminder.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai penantian untuk pesan sebelumnya. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `<actor_id>` | Participant membalas ke Actor dengan ID yang sama. | Untuk memproses jawaban dari Actor tersebut. |
| `timeout` | Tidak ada balasan sampai deadline. | Untuk follow-up atau jalur alternatif. |
| `failed` | Penantian gagal didaftarkan/diproses. | Untuk error handling. |

## Output yang dihasilkan

- `<actor_id>`: `execution_id`, `node_execution_id`, `actor_id`, `message_id`, `content`, `replied_at`.
- `timeout`: `execution_id`, `node_execution_id`, `timeout_seconds`, `timed_out_at`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Channel (`channel`)

**Apa fungsinya?** Menentukan channel balasan yang ditunggu.

**Apa yang harus diisi?** `chat` atau `email`; default `chat`.

**Wajib diisi?** Tidak, karena ada default.

**Contoh:** Pilih `email` bila pesan sebelumnya dikirim sebagai email.

### Reply Targets (`reply_targets`)

**Apa fungsinya?** Menentukan satu atau lebih Actor yang balasannya dapat menyelesaikan wait. Setiap ID Actor menjadi output port tersendiri dengan ID dan label yang sama.

**Apa yang harus diisi?** Tambahkan Actor satu per satu dari picker; nilai disimpan sebagai array ID Actor unik.

**Wajib diisi?** Ya.

**Contoh:** `"reply_targets": ["actor-a", "actor-b"]`. Balasan ke salah satunya memilih cabang port Actor yang bersangkutan.

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

Hubungkan setiap port Actor ke jalur pemrosesan yang sesuai. `timeout` dapat menuju reminder atau jalur alternatif; `failed` menuju error handling. Untuk `Check Reply Attachment`, edge harus berasal langsung dari salah satu port Actor yang dikonfigurasi pada wait ber-channel `email`.

## Kesalahan Umum

- `reply_targets` kosong, memiliki ID duplikat, atau memakai ID port cadangan `timeout`/`failed`.
- `timeout_seconds` kosong, nol, atau negatif saat timeout aktif.
- Menganggap `timeout` adalah error teknis.
- Menghubungkan `Check Reply Attachment` dari channel chat.

## Tips

Selalu rancang apa yang harus terjadi jika participant tidak membalas.
