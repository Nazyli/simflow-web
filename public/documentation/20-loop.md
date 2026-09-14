# Loop

## Apa itu Loop?

`Loop` mengulangi sub-graph dengan batas iterasi. Batas ini mencegah workflow berulang tanpa akhir.

## Kapan digunakan?

Gunakan saat suatu rangkaian langkah perlu diulang dalam jumlah terbatas.

## Contoh

~~~mermaid
flowchart LR
    A[Loop] -->|loop| B[Loop Body]
    B --> A
    A -->|failed| C([End])
    classDef flow fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A flow
    class C terminal
~~~

Port `loop` menjalankan body pengulangan. Jalur `failed` dipakai jika batas atau hard limit terlampaui.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Memulai atau melanjutkan pengulangan. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `loop` | Masih boleh mengulang. | Menuju body pengulangan. |
| `failed` | Batas iterasi/hard limit terlampaui. | Untuk error handling atau `End`. |

## Output yang dihasilkan

- `loop`: `iteration`, `max_iterations`, dan `remaining`.
- `failed`: `iteration`, `max_iterations` bila ada, `error_code`, dan `error_message`.

## Konfigurasi

### Max Iterations (`max_iterations`)

**Apa fungsinya?** Membatasi jumlah pengulangan.

**Apa yang harus diisi?** Integer 1–50 bila ingin memberi batas eksplisit. Default katalog adalah kosong/null.

**Wajib diisi?** Tidak, tetapi batas eksplisit sangat disarankan.

**Contoh:** Isi `3` untuk mencoba maksimal tiga kali.

### Counter Variable (`counter_variable`)

**Apa fungsinya?** Menentukan nama counter bila workflow membutuhkan referensi counter.

**Apa yang harus diisi?** Nama variable.

**Wajib diisi?** Tidak.

**Contoh:** Isi `retry_count`.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

Hubungkan `loop` ke body pengulangan dan gunakan pola kembali ke `Loop` sesuai graph. `failed` menuju error handling atau `End`. Jangan membuat cycle bebas di luar mekanisme `Loop`.

## Kesalahan Umum

- Tidak memberi batas iterasi yang aman.
- `max_iterations` di bawah 1 atau di atas 50.
- Body tidak memiliki jalur kembali yang jelas.

## Tips

Mulai dengan batas kecil saat pengujian agar workflow mudah dilacak.
