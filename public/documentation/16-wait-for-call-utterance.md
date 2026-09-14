# Wait for Call Utterance

## Apa itu Wait for Call Utterance?

`Wait for Call Utterance` menunggu ucapan participant berikutnya pada call aktif.

## Kapan digunakan?

Gunakan setelah `Send Call Speech` saat workflow perlu menunggu jawaban suara.

## Contoh

~~~mermaid
flowchart LR
    A[Send Call Speech] --> B[Wait for Call Utterance]
    B -->|success| C[AI Classification]
    B -->|failed| D([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef ai fill:#fce7f3,stroke:#db2777,color:#831843
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A action
    class B wait
    class C ai
    class D terminal
~~~

Ucapan participant tersedia pada output `success` untuk diproses langkah berikutnya.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai penantian ucapan. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Participant berbicara. | Untuk memproses ucapan. |
| `failed` | Penantian gagal. | Untuk error handling. |

## Output yang dihasilkan

`success` menghasilkan `participant_call_session_id`, `utterance_id`, `speaker_id`, `content`, dan `spoken_at`. `failed` menghasilkan error.

## Konfigurasi

Tidak tersedia / tidak berlaku. Tidak ada setting wajib atau opsional.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Membutuhkan call aktif. `success` dapat menuju `AI Classification`, `Send Call Speech`, atau Node lain; `failed` menuju error handling.

## Kesalahan Umum

- Menjalankan tanpa call aktif.
- Menganggap `success` berarti call sudah selesai.

## Tips

Gunakan `content` hasil utterance sebagai konteks untuk langkah AI atau balasan berikutnya.
