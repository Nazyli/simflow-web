# Add Document

## Apa itu Add Document?

`Add Document` menambahkan snapshot dokumen master ke Simulation participant. Dokumen yang sudah tersedia tidak disalin ulang.

## Kapan digunakan?

Gunakan sebelum participant diminta membaca dokumen atau sebelum memakai `Wait for Document Open`.

## Contoh

~~~mermaid
flowchart LR
    A[Add Document] -->|success| B[Wait for Document Open]
    A -->|failed| C([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef logic fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A action
    class B logic
    class C terminal
~~~

Dokumen ditambahkan terlebih dahulu, kemudian workflow dapat menunggu hingga participant membukanya.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan penambahan dokumen. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Dokumen berhasil tersedia atau sudah tersedia. | Untuk melanjutkan workflow. |
| `failed` | Dokumen tidak dapat ditambahkan. | Untuk error handling. |

## Output yang dihasilkan

- `success`: `added_document_ids`, `existing_document_ids`, dan `added_count`.
- `failed`: `error_code` dan `error_message`.

## Konfigurasi

### Document IDs (`document_ids`)

**Apa fungsinya?** Menentukan dokumen yang akan ditambahkan.

**Apa yang harus diisi?** Pilih satu atau beberapa dokumen dari picker `Document`.

**Wajib diisi?** Ya. Nilainya berupa array ID dokumen.

**Contoh:** Pilih `Panduan Produk` dan `Kebijakan Pengembalian`.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`success` dapat menuju `Wait for Document Open` atau Node berikutnya. `failed` menuju error handling atau `End`.

## Kesalahan Umum

- Tidak memilih dokumen.
- Mengira Node ini juga membuka dokumen.
- Menganggap dokumen yang sudah ada akan selalu dibuat sebagai salinan baru.

## Tips

Gunakan `Wait for Document Open` untuk menunggu event pembukaan dokumen dan mengatur jalur timeout.
