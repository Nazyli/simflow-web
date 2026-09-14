# Send Chat

## Apa itu Send Chat?

`Send Chat` mengirim pesan chat dari master chat kepada participant melalui Actor yang telah ditentukan oleh data chat.

## Kapan digunakan?

Gunakan saat workflow perlu memulai percakapan, memberi instruksi, atau mengirim reminder.

## Contoh

~~~mermaid
flowchart LR
    A([Start]) --> B[Send Chat]
    B -->|success| C[Wait for Reply]
    B -->|failed| D([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,D terminal
    class B action
    class C wait
~~~

Workflow mengirim chat. Jika berhasil, workflow dapat menunggu balasan; jika gagal, jalur error dijalankan.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan Node setelah Node sebelumnya selesai. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Chat berhasil dikirim. | Untuk melanjutkan workflow. |
| `failed` | Chat gagal dikirim. | Untuk error handling atau `End`. |

## Output yang dihasilkan

- `success`: `message_id` dan `sent_at`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Chat ID (`chat_id`)

**Apa fungsinya?** Memilih pesan chat master yang akan dikirim.

**Apa yang harus diisi?** Pilih satu chat dari picker `Chat`.

**Wajib diisi?** Ya.

**Contoh:** Pilih chat “Instruksi laporan mingguan”.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`Input` menerima alur dari Node sebelumnya. `success` dapat menuju action, wait, logic, AI, atau `End`. `failed` sebaiknya menuju penanganan error.

## Kesalahan Umum

- `chat_id` belum dipilih.
- Chat master tidak sesuai Actor atau isi yang diharapkan.
- Output `failed` tidak memiliki tujuan.

## Tips

Jika participant perlu membalas, hubungkan `success` ke `Wait for Reply`.
