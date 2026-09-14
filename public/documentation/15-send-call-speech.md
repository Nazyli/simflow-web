# Send Call Speech

## Apa itu Send Call Speech?

`Send Call Speech` mengantrikan ucapan Actor ke sesi call aktif.

## Kapan digunakan?

Gunakan setelah `Start Call` berhasil, atau setelah participant memberikan jawaban yang perlu dibalas.

## Contoh

~~~mermaid
flowchart LR
    A[Start Call] -->|success| B[Send Call Speech]
    B -->|success| C[Wait for Call Utterance]
    B -->|failed| D([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,B action
    class C wait
    class D terminal
~~~

Speech dikirim lebih dulu, lalu workflow dapat menunggu ucapan participant.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan pengiriman speech. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Speech berhasil diantrikan. | Untuk wait atau speech berikutnya. |
| `failed` | Speech gagal dikirim. | Untuk error handling. |

## Output yang dihasilkan

`success` menghasilkan `participant_call_session_id`, `speech_command_id`, `call_id`, `actor_id`, `content`, dan `queued_at`. `failed` menghasilkan error.

## Konfigurasi

### Call ID (`call_id`)

**Apa fungsinya?** Menentukan call aktif tempat speech dikirim.

**Apa yang harus diisi?** Pilih call dari picker `Call`.

**Wajib diisi?** Ya.

**Contoh:** Pilih call yang dibuat oleh `Start Call`.

### Variables (`variables`)

**Apa fungsinya?** Menyediakan nilai tambahan untuk speech.

**Apa yang harus diisi?** Object variable.

**Wajib diisi?** Tidak.

**Contoh:** Berikan context nama participant.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Membutuhkan call aktif. `success` dapat menuju `Wait for Call Utterance`, `Send Call Speech` berikutnya, atau `End Call`; `failed` menuju error handling.

## Kesalahan Umum

- Call ID salah atau sesi belum aktif.
- Menganggap Node ini memulai call.
- Tidak menangani `failed`.

## Tips

Gunakan speech pendek dan sambungkan ke wait bila percakapan membutuhkan respons.
