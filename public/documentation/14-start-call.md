# Start Call

## Apa itu Start Call?

`Start Call` memulai sesi call LiveKit dengan Actor yang dipilih.

## Kapan digunakan?

Gunakan setelah undangan berhasil atau saat Simulation langsung memulai percakapan suara.

## Contoh

~~~mermaid
flowchart LR
    A[Invite to Call] -->|joined| B[Start Call]
    B -->|success| C[Send Call Speech]
    B -->|failed| D([End])
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B,C action
    class D terminal
~~~

Participant yang sudah bergabung diteruskan ke sesi call; speech dapat dikirim setelah `success`.

## Input

| Input | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Input | Flow | Ya | Menjalankan pembuatan sesi call. |

## Output Port

| Output Port | Arti | Kapan digunakan? |
|---|---|---|
| `success` | Sesi call berhasil dibuat. | Untuk speech atau wait call. |
| `failed` | Call tidak dapat dimulai. | Untuk error handling. |

## Output yang dihasilkan

`success` menghasilkan `participant_call_session_id`, `room_name`, `mode`, `actor_id`, `status`, dan `created_at`. `failed` menghasilkan error.

## Konfigurasi

### Actor ID (`actor_id`)

**Apa fungsinya?** Menentukan Actor dalam call.

**Apa yang harus diisi?** Pilih Actor dari picker.

**Wajib diisi?** Ya.

**Contoh:** Pilih Actor “Sarah”.

### Mode (`mode`)

**Apa fungsinya?** Menentukan apakah alur call dikontrol workflow atau agent.

**Apa yang harus diisi?** `Workflow Driven` atau `Agent Driven`.

**Wajib diisi?** Ya. Default `Workflow Driven`.

**Contoh:** Pilih `Workflow Driven` jika speech dan wait diatur oleh Node.

### Voice ID (`voice_id`)

**Apa fungsinya?** Memilih voice Actor.

**Apa yang harus diisi?** Voice ID; default `id-ID-Chirp3-HD-Orus`.

**Wajib diisi?** Ya.

**Contoh:** Gunakan default untuk voice Bahasa Indonesia.

### Prompt ID (`prompt_id`), Model ID (`model_id`), dan Knowledge IDs (`knowledge_ids`)

**Apa fungsinya?** Mengatur agent dan sumber knowledge pada mode `Agent Driven`.

**Apa yang harus diisi?** Pilih prompt, model, atau knowledge source yang tersedia.

**Wajib diisi?** `prompt_id` dan `model_id` wajib pada mode `Agent Driven`; `knowledge_ids` bersifat opsional/kondisional.

**Contoh:** Pilih prompt agent dan model yang sesuai skenario call.

### Prompt lifecycle

**Apa fungsinya?** Mengatur pesan pada `prompt_on_enter`, `prompt_idle`, `prompt_reconnected`, `prompt_before_expiry`, dan `prompt_on_timeout`.

**Apa yang harus diisi?** Teks prompt. Beberapa field hanya tampil pada `Agent Driven`.

**Wajib diisi?** Tidak, kecuali aturan mode menentukan sebaliknya.

**Contoh:** Isi `prompt_on_enter` dengan sapaan pembuka.

### Timeout dan reconnect settings

**Apa fungsinya?** Mengatur perilaku saat participant pergi, reconnect, atau agent idle.

**Apa yang harus diisi?** Nilai numerik 0 atau lebih: `user_away_timeout`, `user_away_ping_retries`, `user_away_ping_interval`, `user_reconnect_threshold`, `user_disconnect_threshold`, `user_reconnect_timeout`, `agent_idle_timeout`, `reminder_before_expiry`, `call_session_duration`.

**Wajib diisi?** Tidak; default tersedia.

**Contoh:** Pertahankan default saat pertama kali menguji workflow.

### Variables (`variables`)

**Apa fungsinya?** Menyediakan nilai tambahan untuk sesi call.

**Apa yang harus diisi?** Object variable.

**Wajib diisi?** Tidak.

**Contoh:** Kirim context tambahan yang dibutuhkan agent.

## Required / Optional configuration

Status wajib atau opsional setiap setting dijelaskan pada bagian Konfigurasi di atas. Jika Node tidak memiliki setting, bagian Konfigurasi menyatakan bahwa informasi tersebut tidak tersedia atau tidak berlaku.

## Connection

`success` menuju `Send Call Speech`, `Wait for Call Utterance`, atau `Wait for Call End`. `failed` menuju error handling.

## Kesalahan Umum

- Actor atau voice belum valid.
- Mode `Agent Driven` tanpa `prompt_id` atau `model_id`.
- Nilai timeout/reconnect negatif.

## Tips

Uji dulu dengan `Workflow Driven` dan setting default sebelum menambah konfigurasi agent.
