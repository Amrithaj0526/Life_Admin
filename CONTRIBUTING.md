# Contributing to LifeAdmin

Thank you for your interest in contributing to **LifeAdmin**! We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## 1. Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all discussions.

---

## 2. Getting Started

### Prerequisites
- **Node.js**: v20 or newer
- **npm**: v10 or newer
- **Git**

### Local Development Setup
1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/Amrithaj0526/Life_Admin.git
   cd Life_Admin
   ```

2. Install root and workspace dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

3. Configure environment variables:
   ```bash
   cp .env.example server/.env
   ```

4. Launch development services:
   - On Windows: Double click `run.bat`
   - Or run separately:
     - Backend: `cd server && npm run dev`
     - Frontend: `cd client && npm run dev`

---

## 3. Project Structure Guidelines
- `client/`: React 19 + TypeScript + Tailwind CSS application.
  - Keep components modular under `client/src/components/ui/` (shadcn-inspired).
  - Centralize types in `client/src/types/index.ts`.
  - Use `useToast()` for notification feedback instead of intrusive alerts.
- `server/`: Express + Node.js backend.
  - Adhere to the Controller-Service-Repository pattern.
  - Ensure any new endpoint is protected with `authenticate` middleware when user-scoped.
  - Maintain dual-database compatibility (PostgreSQL + SQLite WAL fallback).
- `docs/`: Technical and architectural documentation.

---

## 4. Pull Request Workflow
1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Verify TypeScript builds cleanly:
   ```bash
   cd client && npm run build
   cd ../server && npm run build
   ```
3. Commit your changes using conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation updates
   - `chore:` for maintenance
4. Push to your fork and submit a Pull Request to `main`.
