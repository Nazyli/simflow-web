# Conversation Group

## Apa itu Conversation Group?

`Conversation Group` menunggu participant menyelesaikan semua conversation subgroup yang dipilih, satu per satu.

## Kapan digunakan?

Gunakan untuk skenario yang terdiri dari beberapa kelompok percakapan berurutan.

## Contoh

~~~mermaid
flowchart LR
    A[Conversation Group] -->|success| B[Next Node]
    A -->|failed| C([End])
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B action
    class C terminal
~~~

Workflow baru melanjutkan setelah semua subgroup selesai.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai penantian subgroup. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Semua subgroup selesai. | Untuk melanjutkan workflow. |
| `failed` | Group tidak dapat diselesaikan. | Untuk error handling. |

## Output yang dihasilkan

- `success`: `groups_done`, yaitu daftar subgroup yang selesai.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Groups (`groups`)

**Apa fungsinya?** Menentukan subgroup percakapan yang harus diselesaikan.

**Apa yang harus diisi?** Satu atau beberapa group dari form group.

**Wajib diisi?** Ya.

**Contoh:** Tambahkan group “Pembukaan”, lalu “Evaluasi”.

### Enable Timeout (`enable_timeout`)

**Apa fungsinya?** Mengaktifkan batas waktu untuk group.

**Apa yang harus diisi?** Checkbox; default `false`.

**Wajib diisi?** Ya.

**Contoh:** Aktifkan jika workflow perlu memiliki deadline.

### Timeout Seconds (`timeout_seconds`)

**Apa fungsinya?** Menentukan batas waktu group dalam detik.

**Apa yang harus diisi?** Integer positif; default `600`.

**Wajib diisi?** Jika timeout aktif.

**Contoh:** `1800` untuk 30 menit.

### Default Group ID (`default_group_id`)

**Apa fungsinya?** Menentukan group default saat timeout aktif.

**Apa yang harus diisi?** Pilih salah satu group yang sudah ditambahkan.

**Wajib diisi?** Jika timeout aktif.

**Contoh:** Pilih group “Pembukaan” sebagai default.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`success` berjalan setelah seluruh group selesai; `failed` menuju error handling atau `End`.

## Kesalahan Umum

- Tidak menambahkan group.
- Timeout aktif tetapi durasi atau default group kosong.
- Default group bukan group yang dikonfigurasi.

## Tips

Susun subgroup sesuai urutan percakapan yang diharapkan participant.
