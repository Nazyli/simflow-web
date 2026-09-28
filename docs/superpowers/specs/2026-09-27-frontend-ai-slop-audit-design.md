# Frontend AI-Slop Audit & Copy Reduction Spec

**Date:** 2026-09-27  
**Status:** Implemented; automated checks clean, second visual audit and targeted polish complete
**Scope:** `simflow-web` frontend only  
**Backend:** Read-only review; no backend code or contract changes are included

## Tujuan

Membuat frontend Simulation Builder terasa seperti tool operasional yang dirancang dengan sengaja,
bukan kumpulan template UI yang dirakit cepat. Spec ini menyimpan hasil audit repository
untuk iterasi perbaikan berikutnya: sinyal AI slop, wording yang berlebihan, konsistensi
visual, aksesibilitas, responsivitas, dan urutan implementasi.

Audit ini bersifat static repository audit terhadap seluruh `simflow-web/src`, route/page
entry points, shared components, design files, dan `public/documentation`. Tidak ada kode
backend yang diubah. Visual QA dengan browser pada data runtime nyata tetap menjadi langkah
verifikasi setelah batch implementasi pertama.

## Apa yang dimaksud AI slop pada aplikasi ini

AI slop di sini bukan berarti semua kode dibuat AI. Yang dicari adalah gejala hasil yang
terasa generik, tidak kontekstual, atau tidak selesai dirapikan:

- copy yang terdengar seperti template (`Browse`, `Workspace`, `Unable to...`) dan tidak
  membantu pengguna mengambil keputusan;
- ornamen yang dipakai sebagai dekorasi tanpa memperjelas status atau tindakan;
- terlalu banyak card, pill, glow, gradient, blur, atau micro-label sehingga semua elemen
  terlihat sama penting;
- istilah, bahasa, warna, radius, dan ukuran teks yang berubah-ubah antar fitur;
- sisa starter template yang tidak lagi menjadi bagian produk;
- pesan error yang mengasumsikan penyebab tanpa memberi recovery yang tepat.

## Baseline dan temuan utama

Desain resmi di `DESIGN.md` sudah menetapkan arah **Quiet control room**: flat,
information-dense, violet sebagai interaction signal, dan tanpa dekorasi besar. Masalah
utama bukan ketiadaan design direction, tetapi drift antara direction tersebut dan
implementasi yang tersebar.

### Sinyal yang terukur

- Static scan menemukan **204** penggunaan ukuran micro-copy/metadata (`10px`, `11px`,
  `0.68rem`–`0.8rem`, atau `text-xs`) pada area UI utama. Sebagian valid untuk metadata,
  tetapi terlalu banyak dipakai untuk label, status, dan copy yang harus dibaca.
- Static scan menemukan **26** pola `rounded-full`/pill. Sebagian valid untuk avatar,
  progress, atau status; sisanya perlu dikembalikan ke radius kontrol biasa.
- Build baseline menghasilkan entry chunk utama sekitar **1.85 MB** minified dan CSS sekitar
  **172 KB**. Setelah route-level lazy loading, entry utama turun menjadi sekitar **386 KB**
  dan CSS sekitar **155 KB**; chunk besar hanya tinggal pada route yang memang berat seperti
  call/diagram.
- `npm test`: **162 passed** setelah cleanup.
- `npm run build`: **passed**.
- `npm run lint`: **passed** setelah formatting seluruh frontend dan perbaikan warning
  oxlint pada hook/export yang relevan.

## Audit kedua — 2026-09-28

### Kesimpulan

Frontend ini sudah tidak terlihat seperti AI-generated scaffold yang belum dirapikan:
starter Vite sudah hilang, controls sudah compact, copy utama lebih spesifik, dan graph/call
visuals punya alasan produk. Namun kesan yang masih muncul adalah **generic shadcn dashboard
yang diberi warna ungu**, bukan product UI yang identitasnya lahir dari workflow engine.
Perbaikannya sekarang lebih banyak menyangkut karakter, responsive QA, dan konsistensi product
language daripada cleanup besar.

### Evidence visual/runtime

- Preview browser pada viewport sekitar 485px menunjukkan Runner masih memakai dua kolom karena
  `.runner-entry-grid` baru stack pada `max-width: 480px`. Hasilnya form participant menjadi
  sangat sempit, label terpotong/terbungkus, dan selection panel mendominasi layar. Ini adalah
  bug responsive nyata dan sinyal bahwa layout belum diuji pada breakpoint yang realistis.
- Browser title, shell, sidebar, dan dokumentasi sekarang konsisten memakai `Simulation Builder`.
- Label sidebar yang terlalu generik sudah diganti menjadi `Build & operate` dan `Reference`.
- Halaman daftar Studio sekarang memakai registry list full-width dengan divider, status, jumlah
  simulation, dan aksi per baris; pola white-card grid generik sudah dihapus.
- Font Plus Jakarta Sans sudah konsisten dan compact; masalahnya bukan font yang buruk, melainkan
  hampir semua hierarchy memakai keluarga dan treatment yang sama. Identitas teknis workflow
  sebaiknya dibawa oleh metadata node, port, execution ID, dan state—not by adding another
  decorative display font.

### Sinyal yang masih perlu dipoles

- **P0 responsive:** selesai; Runner sekarang menumpuk pada breakpoint 760px agar aman pada tablet
  kecil dan mobile lebar.
- **P1 brand language:** selesai; seluruh UI user-facing memakai nama resmi `Simulation Builder`.
- **P1 product-specific hierarchy:** selesai; landing list Studio menjadi compact workflow registry.
- **P1 labels:** selesai untuk shell; label utama memakai `Build & operate` dan `Reference`.
- **P2 micro-copy:** selesai pada area audit utama; label keputusan dinaikkan ke `text-xs`, sementara
  nilai teknis tetap boleh compact bila masih sekunder.
- **Documentation typography:** selesai; halaman referensi sekarang memakai density compact, body
  artikel `14px` dengan line-height `1.6`, heading dan spacing yang lebih rapat, tanpa mengorbankan
  readability atau table overflow behavior.
- **Operational table typography:** selesai; shared `DataTable` sekarang memakai header 11px
  semibold tanpa uppercase/tracking lebar, body cell 12px, dan row/header height yang lebih rapat.
- **Mobile canvas toolbar:** selesai; Studio floating toolbar dan kontrol React Flow pada Studio/
  History tidak lagi membesar ke 44px pada breakpoint 760px. Utility controls, node search, dan
  flow toolbar actions memakai 24px agar toolbar tetap compact dan tidak mengambil ruang graph;
  generic command dialog dan kontrol form di luar canvas tidak ikut diubah.
- **Node search placement:** selesai; pencarian node sekarang berada di pojok kanan atas canvas.
  Studio menempatkan toolbar graph dan search dalam satu alignment wrapper sehingga margin atasnya
  sama. Pada viewport sangat sempit wrapper berubah menjadi kolom; History tetap mengikuti tepi kanan
  area flow.
- **P2 recovery copy:** pola `Unable to...` dan `No ... yet` masih tersebar. Sebagian valid, tetapi
  setiap empty/error state sebaiknya menjawab apa yang terjadi dan tindakan berikutnya.

### Hal yang bukan AI slop dan sebaiknya dipertahankan

- Rounded-full pada React Flow handles, slider, avatar/status primitives, dan indicator yang memang
  membutuhkan bentuk pill.
- Shadow pada dialog/popover/focus/selected state dan blur pada audio visualizer; ini memiliki
  fungsi interaction/runtime, bukan dekorasi default.
- Raw colors pada Mermaid node diagrams dan audio shader; itu adalah visual encoding/renderer,
  bukan inkonsistensi surface UI.
- Compact controls `h-7`/`h-8`, semantic color tokens, reduced-motion fallback, dan route-level
  lazy loading karena semuanya mendukung tool operasional yang padat.

## Temuan prioritas

### P0 — Hapus atau rapikan sebelum menambah polish

#### P0.1 Sisa starter Vite

`src/App.css` masih berisi selector `.counter`, `.hero`, `#next-steps`, dan `.vite`,
sedangkan `App.tsx` tidak mengimpor file tersebut. `src/assets/vite.svg` juga masih ada.
Ini adalah sinyal paling jelas bahwa repository belum dipangkas setelah scaffold awal.

Evidence:

- `src/App.css:1-139`
- `src/assets/vite.svg:1`
- `src/App.tsx:1-5`

Rencana: hapus file/aset yang benar-benar tidak direferensikan setelah verifikasi `rg`,
tanpa menghapus asset runtime yang masih dipakai.

#### P0.2 Brand dan konteks diulang terlalu banyak

`Simulation Builder` muncul di header shell dan dua tempat di sidebar; `Workspace` juga
muncul sebagai group label, breadcrumb fallback, dan subtitle footer. Pengulangan ini
membuat shell terasa seperti template dashboard generik.

Evidence:

- `src/app/layouts/app-shell.tsx:11-19`
- `src/app/layouts/app-sidebar.tsx:128-161`

Rencana: pertahankan satu brand label di sidebar/header yang paling membantu orientasi;
hapus subtitle `Workspace` jika tidak memuat informasi tenant atau konteks nyata.

#### P0.3 Efek visual bertentangan dengan design direction

Beberapa efek memang tepat untuk visualizer audio atau status graph, tetapi default shell
dan surface tidak seharusnya membawa bahasa visual yang sama. Area yang perlu dipisahkan:

- `backdrop-blur-md` pada app header;
- `brand-gradient` pada timer/history;
- glow/drop-shadow pada node/path history;
- conic-gradient spinner;
- translucent group node dengan `backdrop-blur`;
- shader/audio visualizer yang perlu dibatasi ke call experience.

Evidence:

- `src/app/layouts/app-shell.tsx:38`
- `src/index.css:285-311, 556-557, 657-678`
- `src/features/history/participant-flow-view.tsx:88`
- `src/features/simulation_studio/visual-groups/simulation-visual-group-node.tsx:77`

Rencana: pertahankan efek yang menyampaikan status runtime secara eksplisit; hapus efek
dekoratif dari shell dan operations pages. Semua animasi status wajib punya reduced-motion
fallback.

#### P0.4 Copy yang cacat atau tidak kontekstual

`ErrorState` selalu menambahkan `Check your connection and retry.` walaupun error bisa
berasal dari validasi, permission, atau domain operation. Ini menghasilkan copy template
yang tidak selalu benar.

Evidence:

- `src/shared/components/async-state.tsx:52-59`

Rencana: komponen menerima `message` dan optional `recoveryAction`; caller menentukan
penyebab dan tindakan pemulihan. Jangan menebak masalah jaringan secara global.

#### P0.5 Typo/wording hasil operasi Runner

Toast saat batch berhasil berbunyi `simulation simulation(s) ready.`.

Evidence:

- `src/features/simulation_runner/simulation-entry-page.tsx:54`

Rencana copy: `N simulations ready.` atau, bila tetap singular-aware, `1 simulation ready.` /
`N simulations ready.`.

## Implemented pada pass ini

- Menghapus starter Vite yang tidak direferensikan (`src/App.css` dan `src/assets/vite.svg`).
- Mengurangi brand/context repetition pada shell, menghapus blur header, serta memangkas helper
  copy yang tidak menambah keputusan pengguna.
- Menetapkan kontrol bersama yang lebih compact: default button `h-8`, input shared `h-8`, body
  default `14px`, label operasional `12px`, dan mempertahankan hit area mobile `44px` untuk
  kontrol yang membutuhkan touch target besar.
- Mengecualikan utility canvas yang padat dari inflasi mobile 44px: toolbar Studio dan React Flow
  controls memakai 24px pada lebar <=760px agar tidak membungkus atau mendominasi viewport. Ini
  sengaja scoped; aksi utama, input, dan kontrol operasional tetap mengikuti target sentuh mobile.
- Menghapus nama/class gradient palsu dan glow dekoratif pada history/graph; efek status runtime
  tetap dipertahankan dan semua motion shared menghormati `prefers-reduced-motion`.
- Memperbaiki `ErrorState`, wording Runner/Settings/Documentation, mixed-language copy chat,
  mojibake, serta warna raw hex utama ke semantic tokens.
- Menambahkan `aria-sort` dan accessible label pada header sort DataTable.
- Mengaktifkan lazy loading per route sehingga halaman Studio/Runner tidak membayar bundle
  Documentation/Call sebelum route tersebut dibuka.
- Menambahkan regression tests pada `tests/page-density.test.mjs` dan memperbarui kontrak visual
  Studio yang memang berubah.

## Hasil pass kedua dan QA manual

- Formatting legacy pada seluruh frontend sudah dirapikan setelah user meminta repository
  frontend bersih. Perubahan formatting bersifat mekanis; lint dan Prettier sekarang lolos.
- Warning `only-export-components` ditangani dengan memisahkan context hook/storage dari provider
  dan menghapus export helper UI yang tidak dipakai. Warning dependency hook ditangani dengan
  dependency yang stabil serta callback yang eksplisit, bukan disembunyikan.
- Detector Impeccable masih memberi advisory untuk font/radius/color yang sudah ditetapkan oleh
  `DESIGN.md`, dan beberapa metadata teknis 10–11px yang valid. Warning kontras pada call/history
  perlu visual QA browser pada data runtime nyata.
- QA browser pada 485px sudah mengonfirmasi Runner tidak lagi terjepit karena panel ditumpuk pada
  breakpoint 760px. QA data runtime nyata pada 360px, 768px, 1024px, dan desktop lebar tetap
  direkomendasikan sebagai follow-up sebelum release.

### P1 — Konsolidasi visual dan UX

#### P1.1 Micro-copy terlalu kecil untuk fungsi yang bukan metadata

Ukuran `10px`/`11px` dan tracking uppercase dipakai pada banyak label form, toolbar,
heading section, status, dan body pendukung. Ini cocok untuk ID teknis atau metadata
sekunder, bukan untuk instruksi yang perlu dipindai cepat.

Evidence representatif:

- `src/app/layouts/app-sidebar.tsx:59, 136-161`
- `src/components/layout/page-header.tsx:24-31`
- `src/components/layout/summary-strip.tsx:40-51`
- `src/features/simulation_runner/simulation-entry-page.tsx:23-25, 181-195`
- `src/features/simulation_runner/document/document-editor.tsx:97, 166-210`
- `src/features/simulation_runner/chat/message-bubble.tsx:30-33`

Rencana token:

- body/instruction: minimum 13–14px desktop dan 16px untuk input mobile;
- label normal: 12px, sentence case;
- 10–11px hanya untuk ID, timestamp, count, atau data teknis yang memang sekunder;
- hindari uppercase tracking sebagai default section heading; gunakan hanya untuk kategori
  pendek yang benar-benar berfungsi sebagai navigational label.

#### P1.2 Token warna dan surface tersebar

Feature langsung memakai hex seperti `#9929EA`, `#F5E7FF`, `#1a1a2e`, `#5f6368`,
`#e8eaed`, sementara design system menyediakan token semantic. Ini membuat tone antar
channel drift dan memperbesar biaya perubahan.

Evidence representatif:

- `src/features/simulation_runner/document/document-workspace.tsx:75-153`
- `src/features/simulation_runner/email/attachment-picker-dialog.tsx:126-203`
- `src/features/simulation_runner/email/conversation-sidebar.tsx:9-16, 84-117`
- `src/features/simulation_runner/chat/conversation-header.tsx:21`

Rencana: map warna ke semantic tokens (`--color-brand-primary`, surface, text-muted,
success, warning, danger) dan gunakan satu icon/color language. Status tetap boleh memakai
semantic status colors, tetapi tidak berdasarkan feature/channel secara arbitrer.

#### P1.3 Terlalu banyak surface untuk satu konteks

Runner entry, settings, documentation navigation, conversation panes, dan studio sidebars
sering membentuk card di dalam card atau panel dengan border + shadow + rounded container.
Result-nya adalah visual nesting tanpa informasi baru.

Rencana: satu boundary per konteks; gunakan spacing/divider untuk hubungan internal. Shadow
hanya untuk overlay/floating control. Prioritaskan task surface, bukan framing dekoratif.

#### P1.4 DataTable perlu semantik sort dan selection yang lebih jelas

Header sort saat ini menampilkan arrow sebagai teks dan belum terlihat ada `aria-sort` pada
`TableHead`. Filter, column toggle, selection, dan pagination juga memakai copy yang sangat
generic.

Evidence:

- `src/shared/components/data-table.tsx:72-145`
- `src/shared/components/data-table.tsx:164-198`

Rencana: expose sort direction pada `aria-sort`, gunakan icon yang konsisten, beri label
lebih kontekstual dari page caller, dan pastikan selection summary tidak menjadi noise saat
tidak ada row yang dipilih.

#### P1.5 Motion belum menjadi sistem

Framer Motion, Tailwind animate, CSS spinner, graph glow, dan audio shader hidup bersama.
`index.css` hanya memiliki reduced-motion exception untuk sebagian history flow, sementara
`LoadingState`, `ErrorState`, dan `EmptyState` selalu menganimasikan mount.

Evidence:

- `src/shared/components/async-state.tsx:1-82`
- `src/index.css:552-553, 657-680`

Rencana: buat motion tokens untuk enter/exit/feedback; tambahkan reduced-motion behavior
untuk shared async states; jangan menganimasikan dekorasi yang tidak memberi konteks.

#### P1.6 Performance visual: dokumentasi terlalu berat di jalur awal

Build memuat Mermaid dan dependency diagram besar ke bundle aplikasi. Untuk pengguna yang
langsung membuka Studio/Runner, cost ini tidak memberi nilai sebelum Documentation dibuka.

Rencana: route-level/dynamic import untuk Mermaid, markdown renderer berat, dan diagram
renderer. Ukur kembali entry chunk dan time-to-interactive setelah perubahan.

### P2 — QA dan konsistensi lanjutan

- Uji semua route pada 360px, 768px, 1024px, dan desktop lebar; pastikan hanya tabel/canvas
  yang scroll horizontal secara lokal.
- Audit icon-only button di Runner call/chat/document dan graph controls; setiap kontrol
  harus memiliki accessible name, state, dan hit area yang tetap usable.
- Audit contrast semua muted text karena banyak copy memakai `text-slate-400`/`#9aa0a6`.
- Audit focus order saat sidebar menjadi overlay di bawah breakpoint `1100px`.
- Audit `prefers-reduced-motion` pada call visualizer, graph path, loading states, dialog,
  sheet, dan page transitions.
- Hapus import/asset mati hanya setelah static reference scan dan production build tetap
  lulus.

## Copy reduction backlog

| Lokasi                                                                | Saat ini                                                               | Usulan                                         | Alasan                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `src/features/simulation_runner/simulation-entry-page.tsx:54`         | `simulation simulation(s) ready.`                                      | `N simulations ready.`                         | Perbaiki typo dan singkatkan hasil operasi.              |
| `src/shared/components/async-state.tsx:56`                            | `{message} Check your connection and retry.`                           | `{message}` + action `Try again` bila tersedia | Jangan mengarang penyebab error.                         |
| `src/app/layouts/app-sidebar.tsx:160-161`                             | `Simulation Builder` / `Workspace`                                     | `SimFlow` atau hapus subtitle                  | Hilangkan brand/context repetition.                      |
| `src/features/documentation/documentation-page.tsx:65`                | `Browse` lalu `Documentation`                                          | `Documentation` saja                           | Eyebrow tidak menambah orientasi.                        |
| `src/features/documentation/documentation-page.tsx:148`               | `Searching documentation contents...`                                  | `Searching...`                                 | State sudah berada di halaman documentation.             |
| `src/features/documentation/documentation-page.tsx:153`               | `No documentation matches "{query}".`                                  | `No matches for "{query}".`                    | Lebih cepat dipindai.                                    |
| `src/features/simulation_runner/document/document-editor.tsx:195-211` | `End of document` + `New pages are added at the end of this document.` | Pertahankan `Add page`, hapus helper sentence  | Tombol dan posisi sudah menjelaskan aksi.                |
| `src/features/master_data/actor-crud-dialog.tsx:110`                  | `Create an actor profile that can be selected in simulation nodes.`    | `Used by workflow nodes.`                      | Hindari kalimat panjang untuk konteks yang jelas.        |
| `src/features/simulation_studio/simulation-studio-page.tsx:1969`      | `Duplicate to Edit`                                                    | `Duplicate and edit`                           | Grammar lebih natural dan langsung.                      |
| `src/features/simulation_studio/simulation-studio-page.tsx:1979`      | `Select or create a version to start editing nodes.`                   | `Select or create a version to edit nodes.`    | Hapus kata pengantar yang tidak perlu.                   |
| `src/features/settings/settings-page.tsx:51-58, 82-99`                | `Reset Database`, `Yes, reset everything`                              | `Reset demo data`, `Reset demo data`           | Aksi menjadi spesifik dan konsisten dengan page section. |
| `src/features/simulation_runner/chat/conversation-body.tsx:20`        | `No messages in this conversation yet.`                                | `No messages yet.`                             | Konteks conversation sudah terlihat.                     |
| `src/features/simulation_runner/chat/simulation-sidebar.tsx:61`       | `No simulations in this session.`                                      | `No simulations yet.`                          | Lebih ringkas; session sudah ada di layout.              |

Copy policy untuk implementasi:

- gunakan sentence case, bukan Title Case untuk semua label;
- satu pesan = satu status + satu tindakan berikutnya;
- jangan menambahkan kalimat “for a better experience”, “easily”, “seamlessly”, atau
  deskripsi promosi pada tool operasional;
- gunakan istilah domain yang konsisten: pilih `simulation`, `workflow`, `actor`,
  `participant`, `document`, dan `execution`, lalu jangan berganti sinonim tanpa alasan;
- pertahankan bahasa utama yang dipilih produk. Saat ini UI mencampur English dan Indonesian
  (contoh `Memuat actors...`, `Tidak ada actor cocok`, `No actors available`); tetapkan
  keputusan lokalisasi sebelum copy pass besar.

## Rencana implementasi secara looping

Setiap loop harus menghasilkan perubahan kecil yang bisa diverifikasi sebelum lanjut.

### Loop 0 — Inventory dan guardrail

1. Tandai komponen shared, page shell, route entry, dan asset mati.
2. Tambahkan/rapikan token semantic tanpa mengubah API atau domain behavior.
3. Buat daftar route dan viewport QA.

Exit criteria: tidak ada asset starter yang belum diputuskan; semua perubahan terbatas di
frontend presentation/copy.

### Loop 1 — Copy dan terminology

1. Terapkan backlog copy P0/P1.
2. Pilih bahasa UI dan glossary produk.
3. Pisahkan error cause, recovery action, dan status text.

Exit criteria: tidak ada typo `simulation simulation(s)`, copy template network pada error
umum, atau brand/context repetition yang tidak perlu.

### Loop 2 — Tokens, surfaces, dan typography

1. Ganti raw hex feature-level dengan token semantic.
2. Turunkan label default dari 10–11px ke token yang readable.
3. Kurangi card nesting, pill dekoratif, shadow, blur, dan gradient yang tidak bermakna.

Exit criteria: halaman Studio, Runner, History, Timers, Master Data, Documentation, dan
Settings memakai hierarki yang sama; perbedaan hanya berasal dari kebutuhan tugas.

### Loop 3 — Accessibility dan interaction

1. Perbaiki `aria-sort`, accessible names, focus order, error placement, dan hit area.
2. Tambahkan reduced-motion behavior pada shared async states dan efek status.
3. Verifikasi mobile overflow dan keyboard navigation.

Exit criteria: tidak ada critical control yang hanya dapat dipahami lewat hover, warna, atau
tooltip; focus visible dan recovery action tersedia.

### Loop 4 — Performance dan visual QA

1. Dynamic-import Mermaid/renderer berat.
2. Jalankan production build dan ukur chunk awal.
3. Buka seluruh route pada empat viewport dengan data empty/loading/error/success.
4. Bandingkan screenshot sebelum/sesudah terhadap `DESIGN.md`.

Exit criteria: tidak ada page-level horizontal scroll, layout shift besar, reduced-motion
regression, atau surface dekoratif yang kembali masuk tanpa alasan produk.

## Acceptance checklist

- [x] Backend `simflow-api` tidak berubah.
- [x] Route, API contract, workflow behavior, dan data behavior tidak berubah.
- [x] Sisa Vite starter dipangkas atau diberi alasan penggunaan.
- [x] Satu brand/context label yang jelas per shell, tanpa pengulangan template.
- [x] Copy operation/error memberi status dan recovery yang benar.
- [x] UI tidak memakai gradient/glow/blur sebagai dekorasi default.
- [x] Label normal readable; micro text hanya untuk metadata teknis.
- [x] Semantic color tokens digunakan lintas fitur.
- [x] Shared motion menghormati `prefers-reduced-motion`.
- [x] Icon-only controls punya accessible name dan hit area yang cukup.
- [x] Table sort/selection dapat dipahami screen reader.
- [x] Dokumentasi/diagram tidak membebani initial bundle tanpa kebutuhan.
- [x] `npm test`, `npm run build`, dan `npm run lint` diverifikasi ulang setelah implementasi.
- [x] QA browser responsif pada viewport sempit untuk regression breakpoint Runner.
- [ ] QA browser kontras dan overflow pada data runtime nyata di semua route utama.

## Out of scope

- Perubahan backend, database, executor, API contract, atau engine workflow.
- Penambahan fitur baru atau perubahan navigation taxonomy.
- Redesign total brand tanpa keputusan produk terpisah.
- Penghapusan visualizer audio yang memang memberi feedback pada call; yang dibutuhkan adalah
  pembatasan konteks, aksesibilitas, dan reduced-motion fallback.
