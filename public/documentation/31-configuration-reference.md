# Configuration Reference

Gunakan halaman ini untuk mencari setting tanpa membaca seluruh halaman Node. Label di Studio berasal dari nama setting dengan underscore diubah menjadi spasi; key teknis dicantumkan agar mudah dicocokkan.

| Node | Setting | Wajib | Keterangan singkat |
|---|---|:---:|---|
| AI Classification | `prompt_id` | Ya | Prompt yang dipakai untuk classification. |
| AI Classification | `labels` | Ya | Daftar `{id, label}` yang menjadi pilihan output. |
| Send Chat | `chat_id` | Ya | Chat master yang dikirim. |
| Send Email | `email_id` | Ya | Email master yang dikirim. |
| Add Document | `document_ids` | Ya | Daftar dokumen yang ditambahkan. |
| Open Document | `document_id` | Ya | Dokumen yang diperiksa. |
| Open Document | `required_open_count` | Ya | Jumlah minimal pembukaan; default `1`, minimal `1`. |
| Wait for Reply | `channel` | Tidak | `chat` atau `email`; default `chat`. |
| Wait for Reply | `reply_targets` | Ya | Array ID Actor unik; tiap Actor menjadi output port tersendiri. |
| Wait for Reply | `enable_timeout` | Ya | Menentukan apakah batas waktu aktif. |
| Wait for Reply | `timeout_seconds` | Kondisional | Wajib positif jika timeout aktif; default `600`. |
| Wait for Reply | `is_read` | Kondisional | Menentukan perilaku timer setelah pesan dibaca; default `false`. |
| Wait for Read | `channel` | Tidak | Channel pesan; default `chat`. |
| Wait for Read | `enable_timeout` | Ya | Mengaktifkan timeout; default `true`. |
| Wait for Read | `timeout_seconds` | Kondisional | Wajib positif jika aktif; default `600`. |
| Wait for Attachment Open | `source_send_email_node_id` | Ya | Node `Send Email` sumber attachment. |
| Wait for Attachment Open | `attachment_selection` | Ya | `selected` atau `all`. |
| Wait for Attachment Open | `attachment_ids` | Kondisional | Wajib saat memilih `selected`. |
| Wait for Attachment Open | `completion_mode` | Ya | `minimum` atau `all`. |
| Wait for Attachment Open | `minimum_opened` | Kondisional | Wajib positif pada mode `minimum`. |
| Wait for Attachment Open | `enable_timeout` | Ya | Mengaktifkan timeout. |
| Wait for Attachment Open | `timeout_seconds` | Kondisional | Wajib positif jika aktif; default `600`. |
| Conversation Group | `groups` | Ya | Subgroup percakapan yang harus diselesaikan. |
| Conversation Group | `enable_timeout` | Ya | Mengaktifkan timeout; default `false`. |
| Conversation Group | `timeout_seconds` | Kondisional | Wajib positif jika timeout aktif. |
| Conversation Group | `default_group_id` | Kondisional | Group default saat timeout aktif. |
| Loop | `max_iterations` | Tidak | Batas iterasi 1–50 jika diisi. |
| Invite to Call | `chat_id` | Ya | Chat yang dipakai untuk mengirim undangan. |
| Invite to Call | `enable_timeout` | Ya | Mengaktifkan timeout; default `true`. |
| Invite to Call | `timeout_seconds` | Kondisional | Wajib positif jika aktif; default `300`. |
| Start Call | `actor_id` | Ya | Actor yang digunakan dalam call. |
| Start Call | `mode` | Ya | `Workflow Driven` atau `Agent Driven`. |
| Start Call | `voice_id` | Ya | Voice actor; default `id-ID-Chirp3-HD-Orus`. |
| Start Call | `prompt_id` | Kondisional | Wajib pada mode `Agent Driven`. |
| Start Call | `model_id` | Kondisional | Wajib pada mode `Agent Driven`. |
| Start Call | `knowledge_ids` | Kondisional | Knowledge source untuk mode `Agent Driven`. |
| Start Call | prompt lifecycle | Tidak | Prompt `on_enter`, `idle`, `reconnected`, `before_expiry`, `on_timeout`. |
| Start Call | timeout/reconnect settings | Tidak | Nilai numerik harus 0 atau lebih. |
| Start Call | `variables` | Tidak | Nilai tambahan untuk sesi call. |
| Send Call Speech | `call_id` | Ya | Call yang sedang aktif. |
| Send Call Speech | `variables` | Tidak | Nilai tambahan untuk speech. |
| End Call | `reason` | Tidak | Alasan pengakhiran; default `workflow_requested`. |

Untuk `End Call`, beberapa field runtime (`call_id`, `mode`, `agent_ready_at`) muncul pada implementasi call tetapi belum ditentukan konsisten sebagai setting katalog. Informasi tersebut tidak boleh dianggap sebagai konfigurasi Studio yang pasti.
