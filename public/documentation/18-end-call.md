# End Call

## Apa itu End Call?

`End Call` meminta sesi call aktif berakhir dan menunggu konfirmasi.

## Kapan digunakan?

Gunakan saat workflow memutuskan percakapan suara harus dihentikan.

## Contoh

~~~mermaid
flowchart LR
    A[End Call] -->|success| B([End])
    A -->|failed| C[Handle Error]
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A action
    class B terminal
    class C action
~~~

Workflow berakhir setelah call berhasil dihentikan; failure dapat diteruskan ke penanganan error.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan permintaan pengakhiran call. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Call berhasil diakhiri. | Untuk `End` atau langkah berikutnya. |
| `failed` | Permintaan mengakhiri call gagal. | Untuk error handling. |

## Output yang dihasilkan

`success` menghasilkan hasil akhir call. `failed` menghasilkan `error_code` dan `error_message`.

## Konfigurasi

### Reason (`reason`)

**Apa fungsinya?** Menjelaskan alasan workflow meminta call berakhir.

**Apa yang harus diisi?** Teks alasan; default `workflow_requested`.

**Wajib diisi?** Tidak.

**Contoh:** Biarkan default untuk pengakhiran yang diminta workflow.

### Field runtime call

**Apa fungsinya?** Implementasi call mengenal `call_id`, `mode`, dan `agent_ready_at`.

**Apa yang harus diisi?** Tidak tersedia sebagai setting katalog Studio yang konsisten.

**Wajib diisi?** Informasi ini tidak ditentukan secara konsisten dalam implementasi yang tersedia.

**Contoh:** Jangan mengandalkan field ini sebagai konfigurasi yang selalu tersedia di form.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Membutuhkan call aktif. `success` biasanya menuju `End`; `failed` menuju error handling.

## Kesalahan Umum

- Menjalankan tanpa call aktif.
- Mengira Node ini sama dengan `Wait for Call End`.

## Tips

Gunakan `Wait for Call End` jika hanya perlu menunggu call berakhir karena event eksternal.
