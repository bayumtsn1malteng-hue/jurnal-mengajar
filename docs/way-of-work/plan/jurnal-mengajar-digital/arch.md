Markdown

# Epic Architecture Specification: Jurnal Mengajar Core (JS-Native Edition)

## 1. Epic Architecture Overview

Arsitektur ini dirancang secara pragmatis untuk **mempertahankan basis kode JavaScript (Vite)** yang sudah ada, sambil menambahkan kapabilitas *Enterprise* seperti sinkronisasi offline dan integrasi AI.

* **Approach:** *Decoupled Frontend-Backend*. Aplikasi PWA yang ada (`jurnal-mengajar`) akan tetap berjalan sebagai *Client*, dan kita akan membangun *Server API* terpisah yang ringan.
* **Language:** **JavaScript (ES Modules)** secara penuh. Tidak ada build step TypeScript yang membebani, memungkinkan pengembangan cepat (*rapid prototyping*).
* **Data Integrity:** Karena tidak menggunakan TypeScript, keamanan data akan ditangani oleh **Zod** (Schema Validation) di kedua sisi (Client & Server) untuk memastikan data JSON yang dikirim valid sebelum masuk database.

## 2. System Architecture Diagram

Diagram ini menunjukkan bagaimana PWA JavaScript yang ada berinteraksi dengan layanan baru tanpa mengubah struktur intinya.

```mermaid
graph TD
    subgraph "Existing Codebase (Vite PWA - JS)"
        User[Guru]
        Browser[Mobile Browser]
        
        subgraph "Frontend Logic (JavaScript)"
            ReactUI[React Components (.jsx)]
            LocalService[Data Service (IndexedDB Wrapper)]
            ValidationLayer[Zod Schema Validator]
            SyncManager[Sync Logic (JS Class)]
        end
        
        subgraph "Local Storage"
            IDB[(IndexedDB)]
            LocalStorage[Token Storage]
        end
    end

    subgraph "New Backend Services (Node.js - JS)"
        APIGateway[Express.js / Hono API]
        AuthGuard[JWT Middleware]
        
        subgraph "Controllers"
            SyncController[Sync Ingestion]
            AIController[Gemini Integration]
        end
        
        subgraph "Background Workers"
            QueueWorker[BullMQ (Data Processor)]
        end
    end

    subgraph "Cloud Infrastructure"
        Postgres[(PostgreSQL Database)]
        Redis[(Redis Queue)]
    end

    %% Data Flow
    User -->|Input Jurnal| ReactUI
    ReactUI -->|Validate Data| ValidationLayer
    ValidationLayer -->|Save| LocalService
    LocalService -->|Persist| IDB
    
    %% Sync Process
    SyncManager -->|Read Pending| IDB
    SyncManager -->|POST /api/sync| APIGateway
    APIGateway -->|Verify Token| AuthGuard
    AuthGuard --> SyncController
    SyncController -->|Validate Schema| ValidationLayer
    SyncController -->|Write| Postgres
3. High-Level Features & Technical Enablers
High-Level Features
Seamless Offline Mode: Guru tetap bisa Input Jurnal/Absen tanpa internet (Fitur Native kode saat ini).

Robust Data Sync: Pengiriman data ke server secara otomatis saat online, dengan validasi ketat agar data server tidak rusak ("Dirty Data").

AI Assistant Proxy: Frontend JS mengirim pertanyaan ke Backend, Backend meneruskan ke Google Gemini (menjaga API Key tetap aman di server).

Technical Enablers (JavaScript Focused)
Zod (Validation): Pengganti TypeScript untuk memastikan tipe data. Contoh: z.string() memastikan input nama adalah teks, bukan angka.

TanStack Query (React Query): Manajemen state server di client JS untuk menghindari "Callback Hell" saat sinkronisasi.

Axios / Fetch Wrapper: Utilitas HTTP dengan interceptor untuk menangani token autentikasi dan retry logic secara otomatis.

Express.js / Hono: Framework backend JavaScript yang minimalis dan sangat kompatibel dengan pola pikir developer JS frontend.

4. Technology Stack (Revised)
Frontend (Existing + Enhanced)
Core: Vite + React (JavaScript .jsx)

State: Context API + TanStack Query

Local DB: Dexie.js (Existing db.js refactored)

Validation: Zod (Sangat direkomendasikan untuk keamanan)

UI Library: Tailwind CSS (Existing)

Backend (New Service)
Runtime: Node.js

Framework: Express.js atau Hono (Simple, JS-native)

Database Interface: Drizzle ORM (Bisa berjalan dalam mode JS biasa/JSDoc)

Auth: JWT (JSON Web Tokens) sederhana

5. Technical Value
Value: High

Mempertahankan JavaScript memungkinkan tim untuk bergerak sangat cepat karena tidak ada learning curve TypeScript. Risiko kesalahan tipe data (type errors) dimitigasi dengan penggunaan Zod yang memvalidasi data saat runtime (saat aplikasi berjalan), yang sebenarnya lebih aman daripada TypeScript (yang hanya validasi saat compile time).

6. T-Shirt Size Estimate
Size: Medium (M)

Estimasi turun dari Large ke Medium karena kita tidak melakukan rewrite kode frontend. Fokus pengerjaan hanya pada:

Membuat Backend API sederhana (CRUD).

Menambahkan logika "Sync Manager" di kode frontend JavaScript yang ada.