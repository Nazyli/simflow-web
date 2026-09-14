# Node Catalog

Node Catalog berisi Node yang dapat digunakan untuk menyusun Simulation. Pengelompokan di bawah ini dibuat untuk membantu proses belajar dan bukan kategori teknis backend.

| Kelompok | Node | Fungsi singkat | Input | Output utama |
|---|---|---|---|---|
| Mulai dan selesai | Start | Memulai execution. | Tidak ada | `started` |
| Mulai dan selesai | End | Mengakhiri jalur. | Flow | Tidak ada |
| Communication | Send Chat | Mengirim pesan chat. | Flow | `success`, `failed` |
| Communication | Send Email | Mengirim email. | Flow | `success`, `failed` |
| Documents | Add Document | Menambahkan dokumen ke Simulation participant. | Flow | `success`, `failed` |
| Documents | Open Document | Memeriksa jumlah pembukaan dokumen. | Flow | `success`, `not_opened`, `failed` |
| Documents | Check Reply Attachment | Memeriksa attachment email balasan. | Flow | `has_attachment`, `no_attachment`, `failed` |
| Waiting & Response | Wait for Reply | Menunggu balasan participant. | Flow | `reply`, `timeout`, `failed` |
| Waiting & Response | Wait for Read | Menunggu pesan dibaca. | Flow | `read`, `timeout`, `failed` |
| Waiting & Response | Wait for Attachment Open | Menunggu attachment dibuka. | Flow | `opened`, `timeout`, `failed` |
| Waiting & Response | Conversation Group | Menunggu subgroup percakapan selesai. | Flow | `success`, `failed` |
| AI | AI Classification | Memilih label berdasarkan respons. | Flow | Port label, `failed` |
| Call | Invite to Call | Mengundang participant ke call. | Flow | `joined`, `timeout`, `failed` |
| Call | Start Call | Memulai sesi call. | Flow | `success`, `failed` |
| Call | Send Call Speech | Mengantrikan ucapan actor. | Flow | `success`, `failed` |
| Call | Wait for Call Utterance | Menunggu ucapan participant. | Flow | `success`, `failed` |
| Call | Wait for Call End | Menunggu call berakhir. | Flow | `success`, `disconnected`, `failed` |
| Call | End Call | Meminta call berakhir. | Flow | `success`, `failed` |
| Flow Control | Loop | Mengulangi sub-graph dengan batas iterasi. | Flow | `loop`, `failed` |

Untuk detail setting, buka halaman Node dari [index](00-index.md). Untuk aturan port umum, lihat [Port Reference](30-port-reference.md).

> `Set Variable` tidak ditampilkan karena dikecualikan dari dokumentasi sesuai keputusan produk.
