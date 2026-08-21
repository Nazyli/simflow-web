/**
 * Document channel local model.
 * Mirrors the mapper-seam pattern from email-channel-page.tsx:
 * a typed local dataset that a future API mapper can replace 1:1.
 */

export type DocumentType =
  | 'agreement'
  | 'claim'
  | 'checklist'
  | 'statement'
  | 'form'
  | 'letter'

export type DocumentStatus = 'draft' | 'shared' | 'reviewed' | 'signed'

export interface SimulationDocument {
  id: string
  title: string
  type: DocumentType
  status: DocumentStatus
  workflowName: string
  versionNumber: number
  sharedBy: string
  sharedAt: string
  pageCount: number
  summary: string
  content: string
}

/** Visual metadata derived from document type. */
export interface DocumentTypeMeta {
  label: string
  color: string
  bg: string
}

export const DOCUMENT_TYPE_META: Record<DocumentType, DocumentTypeMeta> = {
  agreement: { label: 'Agreement', color: '#5b46c5', bg: '#ede9fe' },
  claim: { label: 'Claim', color: '#b45309', bg: '#fef3c7' },
  checklist: { label: 'Checklist', color: '#047857', bg: '#ecfdf5' },
  statement: { label: 'Statement', color: '#0369a1', bg: '#e0f2fe' },
  form: { label: 'Form', color: '#9333ea', bg: '#f3e8ff' },
  letter: { label: 'Letter', color: '#be123c', bg: '#ffe4e6' },
}

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  shared: { label: 'Shared', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  reviewed: { label: 'Reviewed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  signed: { label: 'Signed', className: 'bg-violet-50 text-violet-700 border-violet-200' },
}

/* -------------------------------------------------------------------------- */
/* Dummy data — grounded in SimFlow's simulated customer-service world        */
/* -------------------------------------------------------------------------- */

export const DUMMY_DOCUMENTS: SimulationDocument[] = [
  {
    id: 'doc-001',
    title: 'Perjanjian Layanan Nasabah',
    type: 'agreement',
    status: 'shared',
    workflowName: 'Onboarding Nasabah Baru',
    versionNumber: 3,
    sharedBy: 'Agent Rina',
    sharedAt: '2026-08-20T09:15:00Z',
    pageCount: 4,
    summary: 'Perjanjian layanan untuk nasabah baru dengan ketentuan standar platform.',
    content: `PERJANJIAN LAYANAN NASABAH

Pasal 1 — Pihak
Perjanjian ini dibuat antara PT SimFlow ("Penyedia") dan Nasabah terdaftar ("Pengguna") yang telah menyelesaikan proses verifikasi identitas melalui platform.

Pasal 2 — Ruang Lingkup
Penyedia memfasilitasi simulasi alur kerja otomatis termasuk tetapi tidak terbatas pada:
a) Komunikasi multi-channel (chat, email, dokumen)
b) Klasifikasi pesan berbasis kecerdasan buatan
c) Penjadwalan dan pelacakan interaksi

Pasal 3 — Kewajiban Pengguna
Pengguna wajib:
1. Menjaga kerahasiaan kredensial akun
2. Menggunakan layanan sesuai ketentuan yang berlaku
3. Memberikan respons tepat waktu saat diminta dalam alur simulasi

Pasal 4 — Durasi
Perjanjian ini berlaku sejak tanggal penandatanganan dan berakhir setelah 12 bulan, kecuali diperpanjang oleh kedua belah pihak.

Pasal 5 — Penyelesaian Sengketa
Setiap perselisihan akan diselesaikan melalui mediasi sebelum masuk ke jalur hukum.`,
  },
  {
    id: 'doc-002',
    title: 'Formulir Klaim Asuransi',
    type: 'claim',
    status: 'draft',
    workflowName: 'Penanganan Klaim Pelanggan',
    versionNumber: 1,
    sharedBy: 'Agent Dewi',
    sharedAt: '2026-08-19T14:30:00Z',
    pageCount: 2,
    summary: 'Formulir pengajuan klaim asuransi yang perlu dilengkapi oleh nasabah.',
    content: `FORMULIR KLAIM ASURANSI

Nomor Klaim: SIM-2026-0819-001
Tanggal Pengajuan: 19 Agustus 2026

DATA NASABAH
Nama Lengkap: _______________________
Nomor Polis: _______________________
Tanggal Lahir: _______________________
Nomor Telepon: _______________________

DETAIL KEJADIAN
Tanggal Kejadian: _______________________
Lokasi Kejadian: _______________________
Deskripsi Kejadian:
_______________________________________________
_______________________________________________

DOKUMEN PENDUKUNG
□ Fotokopi KTP
□ Fotokopi Polis Asuransi
□ Surat Keterangan Dokter (jika ada)
□ Foto/Bukti Kejadian

PERNYATAAN
Dengan ini saya menyatakan bahwa informasi yang saya berikan adalah benar dan lengkap. Saya memahami bahwa klaim yang palsu dapat mengakibatkan pembatalan polis.

Tanda Tangan: _______________________
Tanggal: _______________________`,
  },
  {
    id: 'doc-003',
    title: 'Checklist Verifikasi Akun',
    type: 'checklist',
    status: 'reviewed',
    workflowName: 'Onboarding Nasabah Baru',
    versionNumber: 3,
    sharedBy: 'Agent Rina',
    sharedAt: '2026-08-18T10:00:00Z',
    pageCount: 1,
    summary: 'Daftar verifikasi yang harus diselesaikan sebelum akun nasabah aktif.',
    content: `CHECKLIST VERIFIKASI AKUN

Workflow: Onboarding Nasabah Baru — v3

□ Identitas terverifikasi (KTP/Paspor)
□ Alamat domisili dikonfirmasi
□ Nomor telepon aktif dan dapat dihubungi
□ Email aktif diverifikasi
□ Dokumen perjanjian ditandatangani
□ Setoran awal diterima
□ Profil risiko selesai diisi
□ Akun aktif di sistem

Catatan:
Semua item harus selesai dalam waktu 3 hari kerja setelah nasabah mendaftar. Jika ada item yang belum selesai, workflow akan mengarah ke node "Wait for Reply" untuk follow-up dengan nasabah.

Diverifikasi oleh: Agent Rina
Tanggal: 18 Agustus 2026`,
  },
  {
    id: 'doc-004',
    title: 'Surat Pernyataan Kesediaan',
    type: 'letter',
    status: 'signed',
    workflowName: 'Persetujuan Perubahan Data',
    versionNumber: 2,
    sharedBy: 'Agent Budi',
    sharedAt: '2026-08-17T16:45:00Z',
    pageCount: 1,
    summary: 'Surat pernyataan kesediaan nasabah untuk perubahan data pada sistem.',
    content: `SURAT PERNYATAAN KESEDIAAN

Yang bertanda tangan di bawah ini:
Nama: _______________________
Nomor Nasabah: _______________________

Dengan ini menyatakan kesediaan untuk:
1. Melakukan perubahan data sesuai prosedur yang berlaku
2. Memberikan dokumen pendukung yang diperlukan
3. Menunggu proses verifikasi selama 2 hari kerja
4. Menerima konfirmasi perubahan melalui email atau chat

Perubahan yang diminta:
- Update nomor telepon: _______________________
- Update alamat: _______________________
- Update email: _______________________

Saya memahami bahwa perubahan ini akan berlaku setelah mendapat konfirmasi dari pihak PT SimFlow.

Tanggal: 17 Agustus 2026
Tanda Tangan: _______________________`,
  },
  {
    id: 'doc-005',
    title: 'Ringkasan Mutasi Rekening',
    type: 'statement',
    status: 'shared',
    workflowName: 'Laporan Bulanan Nasabah',
    versionNumber: 1,
    sharedBy: 'Agent Sari',
    sharedAt: '2026-08-16T11:20:00Z',
    pageCount: 3,
    summary: 'Ringkasan mutasi rekening untuk periode Agustus 2026.',
    content: `RINGKASAN MUTASI REKENING

Periode: 1 — 31 Agustus 2026
Nomor Rekening: ****-****-****-4521
Nama Pemegang Rekening: Nasabah Terdaftar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RINGKASAN SALDO
Saldo Awal: Rp 2.500.000
Total Pemasukan: Rp 4.750.000
Total Pengeluaran: Rp 3.200.000
Saldo Akhir: Rp 4.050.000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RIWAYAT TRANSAKSI

1 Agu — Transfer Masuk — Rp 2.500.000 — dari PT Maju Jaya
2 Agu — Pembayaran Tagihan — Rp 850.000 — Listrik & Air
5 Agu — Transfer Masuk — Rp 1.250.000 — dari Agent Sari
8 Agu — Penarikan ATM — Rp 500.000
10 Agu — Transfer Keluar — Rp 1.000.000 — ke Rekening CV Abadi
15 Agu — Transfer Masuk — Rp 1.000.000 — Cashback Promo
18 Agu — Pembayaran Tagihan — Rp 350.000 — Listrik & Air
20 Agu — Transfer Keluar — Rp 500.000 — ke Rekening Pribadi

Catatan: Transaksi di atas merupakan simulasi dari workflow "Laporan Bulanan Nasabah" v1.`,
  },
  {
    id: 'doc-006',
    title: 'Formulir Pengajuan Kredit',
    type: 'form',
    status: 'draft',
    workflowName: 'Proses Pengajuan Kredit',
    versionNumber: 2,
    sharedBy: 'Agent Doni',
    sharedAt: '2026-08-15T08:00:00Z',
    pageCount: 3,
    summary: 'Formulir pengajuan kredit yang perlu diisi lengkap sebelum diproses.',
    content: `FORMULIR PENGAJUAN KREDIT

═══════════════════════════════════════════════════
BAGIAN A — DATA PRIBADI
═══════════════════════════════════════════════════

Nama Lengkap: _______________________
Tempat/Tgl Lahir: _______________________
Nomor KTP: _______________________
Status Perkawinan: □ Belum Kawin □ Kawin □ Cerai

═══════════════════════════════════════════════════
BAGIAN B — DATA PEKERJAAN
═══════════════════════════════════════════════════

Nama Perusahaan: _______________________
Jabatan: _______________________
Lama Bekerja: _______________________ tahun
Penghasilan Bulanan: Rp _______________________

═══════════════════════════════════════════════════
BAGIAN C — DETAIL PENGAJUAN
═══════════════════════════════════════════════════

Jenis Kredit: □ KPR □ Multiguna □ Modal Kerja
Jumlah Pinjaman: Rp _______________________
Tenor: _______________________ bulan
Tujuan Pengajuan: _______________________

═══════════════════════════════════════════════════
BAGIAN D — DOKUMEN PENDUKUNG
═══════════════════════════════════════════════════

□ Fotokopi KTP (2 lembar)
□ Fotokopi Kartu Keluarga
□ Slip Gaji 3 bulan terakhir
□ Surat Keterangan Kerja
□ Rekening Koran 3 bulan terakhir
□ Bukti kepemilikan agunan (jika ada)

═══════════════════════════════════════════════════
Pernyataan: Saya menyatakan bahwa seluruh data di atas adalah benar.
Tanda Tangan: _______________________
Tanggal: _______________________`,
  },
  {
    id: 'doc-007',
    title: 'Surat Konfirmasi Pembayaran',
    type: 'letter',
    status: 'shared',
    workflowName: 'Penyelesaian Tagihan',
    versionNumber: 1,
    sharedBy: 'Agent Rina',
    sharedAt: '2026-08-14T13:10:00Z',
    pageCount: 1,
    summary: 'Konfirmasi bahwa pembayaran tagihan telah diterima dan diproses.',
    content: `SURAT KONFIRMASI PEMBAYARAN

Kepada Yth.
Nasabah Terdaftar

Dengan hormat,

Bersama surat ini kami konfirmasi bahwa pembayaran Anda telah diterima dengan rincian sebagai berikut:

Nomor Referensi: PYM-2026-0814-0078
Tanggal Pembayaran: 14 Agustus 2026
Jumlah Dibayar: Rp 850.000
Metode Pembayaran: Transfer Bank
Tagihan: Listrik & Air — Agustus 2026

Status: LUNAS

Pembayaran Anda telah tercatat di sistem kami. Silakan simpan surat ini sebagai bukti pembayaran.

Hormat kami,
Agent Rina
PT SimFlow`,
  },
  {
    id: 'doc-008',
    title: 'Formulir Perubahan Kontak',
    type: 'form',
    status: 'reviewed',
    workflowName: 'Persetujuan Perubahan Data',
    versionNumber: 2,
    sharedBy: 'Agent Budi',
    sharedAt: '2026-08-13T15:30:00Z',
    pageCount: 1,
    summary: 'Formulir untuk permintaan perubahan data kontak nasabah.',
    content: `FORMULIR PERUBAHAN KONTAK

Nomor Nasabah: _______________________

DATA YANG AKAN DIUBAH:

□ Nomor Telepon
  Lama: _______________________
  Baru: _______________________

□ Email
  Lama: _______________________
  Baru: _______________________

□ Alamat
  Lama: _______________________
  Baru: _______________________

Alasan Perubahan: _______________________

Dokumen Pendukung:
□ KTP baru
□ Surat Keterangan Pindah (untuk alamat)

Pernyataan: Saya menyetujui perubahan data di atas.
Tanda Tangan: _______________________
Tanggal: _______________________

Status: Reviewed oleh Agent Budi — 13 Agustus 2026`,
  },
]

/** Format a relative-ish date for the sidebar. */
export function formatDocumentDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
