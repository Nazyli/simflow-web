# Open Document

## Apa itu Open Document?

`Open Document` memeriksa apakah participant sudah membuka dokumen tertentu sebanyak jumlah minimum. Node ini tidak membuka dokumen dan tidak menunggu event pembukaan baru.

## Kapan digunakan?

Gunakan untuk membuat cabang berdasarkan apakah participant telah membaca dokumen sesuai target.

## Contoh

~~~mermaid
flowchart LR
    A{Open Document} -->|success| B[Continue]
    A -->|not_opened| C[Send Chat Reminder]
    A -->|failed| D([End])
    classDef condition fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A condition
    class C action
    class D terminal
~~~

`success` berarti target pembukaan terpenuhi. `not_opened` adalah hasil bisnis normal saat target belum terpenuhi.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan pemeriksaan dokumen. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Jumlah pembukaan sudah memenuhi target. | Untuk melanjutkan alur utama. |
| `not_opened` | Jumlah pembukaan belum memenuhi target. | Untuk reminder atau langkah alternatif. |
| `failed` | Snapshot dokumen tidak tersedia atau state tidak dapat dibaca. | Untuk error handling. |

## Output yang dihasilkan

`success` dan `not_opened` menghasilkan `document_id`, `open_count`, dan `required_open_count`. `failed` menghasilkan `error_code` dan `error_message`.

## Konfigurasi

### Document ID (`document_id`)

**Apa fungsinya?** Menentukan dokumen yang statusnya diperiksa.

**Apa yang harus diisi?** Pilih satu dokumen dari picker.

**Wajib diisi?** Ya.

**Contoh:** Pilih dokumen `document-policy`.

### Required Open Count (`required_open_count`)

**Apa fungsinya?** Menentukan jumlah minimal pembukaan.

**Apa yang harus diisi?** Integer positif; default `1`.

**Wajib diisi?** Ya menurut validation rule; nilai default tersedia.

**Contoh:** Isi `2` jika dokumen harus dibuka setidaknya dua kali.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`success`, `not_opened`, dan `failed` harus diperlakukan sebagai tiga jalur yang berbeda. `not_opened` tidak boleh dianggap sebagai `failed`.

## Kesalahan Umum

- Dokumen belum ditambahkan ke participant.
- `required_open_count` nol atau negatif.
- Tidak membuat jalur untuk `not_opened`.

## Tips

Gunakan `not_opened` untuk mengirim reminder, bukan untuk mencatat error teknis.
