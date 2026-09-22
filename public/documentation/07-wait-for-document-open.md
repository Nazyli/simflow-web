# Wait for Document Open

## Fungsi

`wait_for_document_open` menahan workflow sampai participant membuka dokumen yang dipilih sebanyak jumlah minimum, atau sampai batas waktu habis. Saat node dimasuki, backend memeriksa `trans_participant_document.counter`; jika target sudah terpenuhi, node langsung memilih `opened`.

Gunakan node ini setelah dokumen ditambahkan atau setelah participant diminta membacanya. Node ini tidak membuka dokumen untuk participant.

## Contoh alur

```text
Add Document
└── success -> Wait for Document Open (1 kali, 10 menit)
                ├── opened  -> Continue Simulation
                ├── timeout -> Send Reminder
                └── failed  -> Handle Error
```

## Input

Satu input port `input`. Node tidak memerlukan data input.

## Konfigurasi

| Field | Wajib | Default | Aturan |
| --- | --- | --- | --- |
| `document_id` | Ya | — | ID dokumen dari resource picker `documents`. |
| `required_open_count` | Ya | `1` | Integer positif. |
| `enable_timeout` | Ya | `true` | Jika `false`, node menunggu tanpa batas waktu dan port `timeout` tidak tersedia. |
| `timeout_seconds` | Saat timeout aktif | `600` | Integer positif dalam detik. |

## Output ports

### `opened`

Participant telah membuka dokumen hingga jumlah yang diminta. Data berisi `execution_id`, `node_execution_id`, `document_id`, `open_count`, `required_open_count`, dan `completed_at`.

```json
{
  "type": "object",
  "properties": {
    "execution_id": { "type": "string" },
    "node_execution_id": { "type": "string" },
    "document_id": { "type": "string" },
    "open_count": { "type": "integer", "minimum": 0 },
    "required_open_count": { "type": "integer", "minimum": 1 },
    "completed_at": { "type": "string", "format": "date-time" }
  },
  "required": ["execution_id", "node_execution_id", "document_id", "open_count", "required_open_count", "completed_at"]
}
```

### `timeout`

Deadline tercapai sebelum jumlah pembukaan terpenuhi. Port ini hanya tersedia saat `enable_timeout: true`. Data berisi `execution_id`, `node_execution_id`, `document_id`, `open_count` saat deadline, `required_open_count`, `timeout_seconds`, dan `timed_out_at`.

```json
{
  "type": "object",
  "properties": {
    "execution_id": { "type": "string" },
    "node_execution_id": { "type": "string" },
    "document_id": { "type": "string" },
    "open_count": { "type": "integer", "minimum": 0 },
    "required_open_count": { "type": "integer", "minimum": 1 },
    "timeout_seconds": { "type": "integer" },
    "timed_out_at": { "type": "string", "format": "date-time" }
  },
  "required": ["execution_id", "node_execution_id", "document_id", "open_count", "required_open_count", "timeout_seconds", "timed_out_at"]
}
```

### `failed`

Dokumen tidak tersedia pada session participant saat ini, atau wait gagal didaftarkan/diproses. Data berisi `error_code` dan `error_message`.

```json
{
  "type": "object",
  "properties": {
    "error_code": { "type": "string" },
    "error_message": { "type": "string" }
  },
  "required": ["error_code", "error_message"]
}
```

## Contoh hasil runtime

```json
{
  "selected_port": "timeout",
  "data": {
    "execution_id": "execution-123",
    "node_execution_id": "node-execution-456",
    "document_id": "document-policy",
    "open_count": 0,
    "required_open_count": 1,
    "timeout_seconds": 600,
    "timed_out_at": "2026-09-22T10:10:00Z"
  }
}
```

## Aturan koneksi

- Hubungkan `opened` ke langkah yang hanya boleh berjalan setelah pembukaan dokumen memenuhi target.
- Hubungkan `timeout` ke reminder atau jalur alternatif. Jika timeout dimatikan, jangan buat edge ke port ini.
- Hubungkan `failed` ke penanganan error.
- Event pembukaan berasal dari endpoint Runner. Event itu menaikkan `trans_participant_document.counter` dan menyelesaikan wait secara atomik saat target tercapai.

## Kesalahan umum dan tips

- `enable_timeout: false` berarti menunggu tanpa batas; node tidak mengeluarkan hasil sebelum target pembukaan tercapai.
- Jika target sudah terpenuhi sebelum node dimasuki, node langsung memilih `opened`.
- `open_count` menghitung setiap pembukaan yang berhasil, bukan hanya pembukaan pertama.
- Gunakan `Add Document` lebih dulu agar snapshot dokumen tersedia bagi participant.
