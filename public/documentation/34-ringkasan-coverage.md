# Ringkasan Coverage

## Pemeriksaan Node

| # | Node | Status |
|---:|---|:---:|
| 1 | Start | ✅ |
| 2 | Send Chat | ✅ |
| 3 | Send Email | ✅ |
| 4 | Add Document | ✅ |
| 5 | Wait for Document Open | ✅ |
| 6 | Wait for Reply | ✅ |
| 7 | Wait for Read | ✅ |
| 8 | Check Reply Attachment | ✅ |
| 9 | Wait for Attachment Open | ✅ |
| 10 | AI Classification | ✅ |
| 11 | Invite to Call | ✅ |
| 12 | Start Call | ✅ |
| 13 | Send Call Speech | ✅ |
| 14 | Wait for Call Utterance | ✅ |
| 15 | Wait for Call End | ✅ |
| 16 | End Call | ✅* |
| 17 | Conversation Group | ✅ |
| 18 | Loop | ✅ |
| 19 | End | ✅ |

**Jumlah Node didokumentasikan: 19.**

## Ringkasan teknis

- **Jumlah Input Port:** 18 Input Port standar yang ditemukan pada 19 Node; `Start` tidak memiliki Input Port.
- **Jumlah Output Port:** 41 port tetap, ditambah port label dinamis pada `AI Classification` sesuai jumlah label yang dikonfigurasi.
- **Jumlah configuration/setting:** Semua setting katalog yang tersedia untuk 19 Node telah dicantumkan di [Configuration Reference](31-configuration-reference.md). Setting kondisional dihitung satu kali.
- **Connection rule:** Aturan umum, koneksi khusus attachment, koneksi wait, terminal, dan loop telah dijelaskan di [Port Reference](30-port-reference.md) dan halaman Node terkait.
- **Informasi belum dapat dipastikan:** Beberapa field runtime pada `End Call` belum konsisten sebagai setting katalog Studio; hal ini ditandai di halaman Node dan Configuration Reference.

`*` `End Call` didokumentasikan, tetapi sebagian detail setting runtime diberi tanda belum dapat dipastikan karena definisi katalog dan implementasinya tidak konsisten.
