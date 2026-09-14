# Check Reply Attachment

## Apa itu Check Reply Attachment?

`Check Reply Attachment` memeriksa apakah balasan email participant memiliki attachment.

## Kapan digunakan?

Gunakan hanya setelah output `reply` dari `Wait for Reply` dengan channel `email`.

## Contoh

~~~mermaid
flowchart LR
    A[Wait for Reply] -->|reply| B{Check Reply Attachment}
    B -->|has_attachment| C[Process Attachment]
    B -->|no_attachment| D[Request Attachment]
    B -->|failed| E([End])
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef condition fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B condition
    class C,D action
    class E terminal
~~~

Balasan dengan attachment dan balasan tanpa attachment dapat ditangani melalui jalur yang berbeda.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow dari `reply` | Ya | Harus berasal langsung dari `Wait for Reply` email. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `has_attachment` | Balasan memiliki satu atau lebih attachment. | Untuk memproses attachment. |
| `no_attachment` | Balasan tidak memiliki attachment. | Untuk meminta attachment atau melanjutkan alur. |
| `failed` | Balasan atau attachment tidak dapat dibaca. | Untuk error handling. |

## Output yang dihasilkan

Port normal menghasilkan `message_id`, `attachment_ids`, dan `attachment_count`. `failed` menghasilkan `error_code` dan `error_message`.

## Konfigurasi

Tidak tersedia / tidak berlaku. Node ini tidak memiliki setting wajib atau opsional.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Input wajib langsung dari port `reply` `Wait for Reply` dengan channel `email`. `has_attachment`, `no_attachment`, dan `failed` harus menjadi cabang terpisah.

## Kesalahan Umum

- Menghubungkan dari `Wait for Reply` channel `chat`.
- Menghubungkan dari port selain `reply`.
- Menganggap `no_attachment` sebagai error.

## Tips

Gunakan `no_attachment` untuk meminta participant mengirim ulang dokumen.
