# Invite to Call

## Apa itu Invite to Call?

`Invite to Call` mengirim undangan melalui chat dan menunggu participant bergabung ke call.

## Kapan digunakan?

Gunakan sebelum `Start Call` ketika participant perlu menerima dan membuka undangan terlebih dahulu.

## Contoh

~~~mermaid
flowchart LR
    A[Invite to Call] -->|joined| B[Start Call]
    A -->|timeout| C[Send Reminder]
    A -->|failed| D([End])
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B,C action
    class D terminal
~~~

Jika participant bergabung, call dapat dimulai. Jika tidak, workflow dapat mengirim reminder.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan pengiriman undangan. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `joined` | Participant bergabung sebelum deadline. | Untuk memulai call. |
| `timeout` | Participant belum bergabung sampai deadline. | Untuk reminder atau akhir. |
| `failed` | Undangan gagal diproses. | Untuk error handling. |

## Output yang dihasilkan

- `joined`: `execution_id`, `node_execution_id`, `invitation_id`, `participant_id`, `joined_at`.
- `timeout`: ID undangan, ID execution/node, `timeout_seconds`, `timed_out_at`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Chat ID (`chat_id`)

**Apa fungsinya?** Memilih chat yang dipakai untuk mengirim undangan.

**Apa yang harus diisi?** Pilih chat dari picker.

**Wajib diisi?** Ya.

**Contoh:** Pilih chat undangan call.

### Enable Timeout (`enable_timeout`)

**Apa fungsinya?** Mengaktifkan batas waktu menunggu participant.

**Apa yang harus diisi?** Checkbox; default `true`.

**Wajib diisi?** Ya.

**Contoh:** Tetap aktif agar workflow tidak menunggu selamanya.

### Timeout Seconds (`timeout_seconds`)

**Apa fungsinya?** Menentukan batas tunggu dalam detik.

**Apa yang harus diisi?** Integer positif; default `300`.

**Wajib diisi?** Jika timeout aktif.

**Contoh:** `300` berarti 5 menit.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`joined` dapat menuju `Start Call`; `timeout` menuju reminder; `failed` menuju error handling.

## Kesalahan Umum

- Chat invitation belum dipilih.
- Timeout tidak memiliki durasi positif.
- Tidak menangani participant yang tidak bergabung.

## Tips

Gunakan `timeout` untuk memberi pengalaman yang jelas saat participant terlambat bergabung.
