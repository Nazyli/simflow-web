# Wait for Attachment Open

## Apa itu Wait for Attachment Open?

`Wait for Attachment Open` menunggu attachment dari email tertentu dibuka participant.

## Kapan digunakan?

Gunakan setelah `Send Email` jika Anda perlu memastikan satu atau beberapa attachment telah dibuka.

## Contoh

~~~mermaid
flowchart LR
    A[Send Email] --> B{Wait for Attachment Open}
    B -->|opened| C[Continue]
    B -->|timeout| D[Send Reminder]
    B -->|failed| E([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,C,D action
    class B wait
    class E terminal
~~~

Workflow melanjutkan saat syarat pembukaan terpenuhi, mengirim reminder saat timeout, atau menangani failure.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan penantian attachment. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `opened` | Syarat attachment terbuka terpenuhi. | Untuk melanjutkan workflow. |
| `timeout` | Masih ada attachment yang belum dibuka sampai deadline. | Untuk reminder atau jalur alternatif. |
| `failed` | Penantian gagal. | Untuk error handling. |

## Output yang dihasilkan

- `opened`: `opened_attachment_ids`, `opened_count`, `required_count`, dan `completed_at` beserta ID execution/node.
- `timeout`: daftar attachment terbuka dan tertunda, jumlah, durasi, serta waktu timeout.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Source Send Email Node (`source_send_email_node_id`)

**Apa fungsinya?** Menentukan Node `Send Email` yang mengirim attachment.

**Apa yang harus diisi?** Pilih Node `Send Email` yang sudah memiliki email.

**Wajib diisi?** Ya.

**Contoh:** Pilih `Send Email - Kirim Kebijakan`.

### Attachment Selection (`attachment_selection`)

**Apa fungsinya?** Menentukan apakah attachment dipilih satu per satu atau semuanya dipantau.

**Apa yang harus diisi?** `selected` atau `all`.

**Wajib diisi?** Ya.

**Contoh:** Gunakan `selected` jika hanya dokumen kontrak yang penting.

### Attachment IDs (`attachment_ids`)

**Apa fungsinya?** Menentukan attachment yang dipantau pada mode `selected`.

**Apa yang harus diisi?** Satu atau beberapa attachment dari email source.

**Wajib diisi?** Kondisional: wajib pada mode `selected`; kosong pada mode `all`.

**Contoh:** Pilih attachment `contract.pdf`.

### Completion Mode (`completion_mode`)

**Apa fungsinya?** Menentukan kapan penantian dianggap selesai.

**Apa yang harus diisi?** `minimum` atau `all`.

**Wajib diisi?** Ya.

**Contoh:** Pilih `minimum` jika cukup satu dokumen dibuka.

### Minimum Opened (`minimum_opened`)

**Apa fungsinya?** Menentukan jumlah minimum attachment yang harus dibuka.

**Apa yang harus diisi?** Integer positif.

**Wajib diisi?** Kondisional: wajib pada mode `minimum`.

**Contoh:** Isi `1` untuk menunggu minimal satu attachment.

### Enable Timeout (`enable_timeout`)

**Apa fungsinya?** Menentukan apakah penantian memiliki deadline.

**Apa yang harus diisi?** Checkbox; default `true`.

**Wajib diisi?** Ya.

**Contoh:** Aktifkan agar workflow dapat mengirim reminder.

### Timeout Seconds (`timeout_seconds`)

**Apa fungsinya?** Menentukan durasi penantian dalam detik.

**Apa yang harus diisi?** Integer positif; default `600`.

**Wajib diisi?** Jika timeout aktif.

**Contoh:** `86400` untuk satu hari.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Source wajib Node `Send Email`. Hubungkan `opened`, `timeout`, dan `failed` ke tujuan masing-masing.

## Kesalahan Umum

- Source bukan `Send Email`.
- Mode `selected` tetapi tidak ada attachment yang dipilih.
- Mode `all` tetapi daftar `attachment_ids` masih berisi item.
- `minimum_opened` lebih besar dari jumlah attachment terpilih.

## Tips

Gunakan mode `all` untuk memantau semua attachment tanpa memilih satu per satu.
