# Contoh Workflow

Semua contoh di bawah hanya menggunakan Node yang tersedia.

## Contoh 1 — Percakapan sederhana

```mermaid
flowchart LR
    A([Start]) -->|started| B[Send Chat]
    B -->|success| C([End])
    B -->|failed| D([End])
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,C,D terminal
    class B action
```

Workflow dimulai dari `Start`, mengirim chat, lalu selesai pada hasil `success` atau `failed`.

## Contoh 2 — Menunggu respons participant

```mermaid
flowchart LR
    A([Start]) --> B[Send Chat]
    B -->|success| C[Wait for Reply]
    C -->|reply| D[Process Reply]
    C -->|timeout| E[Send Reminder]
    C -->|failed| F([End])
    D --> G([End])
    E --> G
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,F,G terminal
    class B,D,E action
    class C wait
```

Setelah chat terkirim, workflow menunggu balasan. Balasan diproses, sedangkan timeout dapat menjalankan reminder.

## Contoh 3 — Percabangan berdasarkan classification

```mermaid
flowchart LR
    A[Wait for Reply] -->|reply| B{AI Classification}
    B -->|complaint| C[Handle Complaint]
    B -->|question| D[Answer Question]
    B -->|failed| E([End])
    C --> F([End])
    D --> F
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef ai fill:#fce7f3,stroke:#db2777,color:#831843
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A wait
    class B ai
    class C,D action
    class E,F terminal
```

`AI Classification` menyediakan port sesuai label yang dikonfigurasi. Masing-masing label dapat diarahkan ke penanganan berbeda.

## Contoh 4 — Follow-up email

```mermaid
flowchart LR
    A([Start]) --> B[Send Email]
    B -->|success| C[Wait for Reply]
    C -->|reply| D[Check Reply Attachment]
    C -->|timeout| E[Send Email Reminder]
    D -->|has_attachment| F[Process Attachment]
    D -->|no_attachment| G[Request Attachment]
    D -->|failed| H([End])
    E --> I([End])
    F --> I
    G --> I
    classDef action fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef wait fill:#f3e8ff,stroke:#9333ea,color:#581c87
    classDef condition fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef terminal fill:#dcfce7,stroke:#16a34a,color:#14532d
    class A,H,I terminal
    class B,E,F,G action
    class C wait
    class D condition
```

Workflow mengirim email, menunggu balasan email, lalu memeriksa attachment. Balasan tanpa attachment dapat diarahkan ke permintaan attachment tambahan.
