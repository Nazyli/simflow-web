# AI Classification

## Apa itu AI Classification?

`AI Classification` memilih satu label berdasarkan respons atau context yang tersedia. Setiap label menghasilkan Output Port sendiri.

## Kapan digunakan?

Gunakan untuk memisahkan alur berdasarkan intent atau kategori jawaban participant, misalnya `complaint`, `question`, dan `spam`.

## Contoh

~~~mermaid
flowchart LR
    A[Wait for Reply] --> B{AI Classification}
    B -->|complaint| C[Handle Complaint]
    B -->|question| D[Answer Question]
    B -->|failed| E([End])
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef ai fill:#fce7f3,stroke:#db2777,color:#831843
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B ai
    class C,D action
    class E terminal
~~~

Port label pada diagram harus sama dengan label yang dikonfigurasi pada Node.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan proses classification. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| Satu port per label | Hasil classification sesuai label. | Untuk menjalankan cabang label tersebut. |
| `failed` | Classification tidak dapat diselesaikan. | Untuk error handling. |

## Output yang dihasilkan

Port label menghasilkan object dengan `label`. Port `failed` menghasilkan `error_code` dan `error_message`.

## Konfigurasi

### Prompt ID (`prompt_id`)

**Apa fungsinya?** Memilih prompt yang digunakan untuk classification.

**Apa yang harus diisi?** Pilih satu prompt dari picker.

**Wajib diisi?** Ya.

**Contoh:** Pilih prompt klasifikasi intent customer.

### Labels (`labels`)

**Apa fungsinya?** Menentukan pilihan hasil dan Output Port dinamis.

**Apa yang harus diisi?** Daftar object `{id, label}`. ID harus unik dan tidak kosong.

**Wajib diisi?** Ya.

**Contoh:** `[{id: "complaint", label: "Complaint"}, {id: "question", label: "Question"}]`.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Buat satu tujuan untuk setiap port label yang ingin ditangani. Jangan membuat connection ke label yang belum ada. `failed` menuju error handling.

## Kesalahan Umum

- `prompt_id` kosong.
- Label tidak memiliki ID atau ID duplikat.
- Connection masih memakai label lama setelah labels diubah.
- Lupa menghubungkan `failed`.

## Tips

Gunakan ID label yang stabil dan label tampilan yang mudah dimengerti.
