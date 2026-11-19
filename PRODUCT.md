# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** responsables SST and administradores working at a desk on large screens, operating dense tables and long forms (actas, matrices, programas, presupuestos, exámenes, auditorías) as daily compliance work.
- **Secondary roles in the same app:** capacitador (trainer), supervisor, and empleado. Employees take courses, evaluations, surveys, votings and sign documents; each role lands on its own dashboard.
- **Superadmin:** operates across client companies (empresas) and switches the active company.

## Product Purpose

SST Platform (Sistema de Seguridad y Salud en el Trabajo) lets Colombian companies run and evidence their occupational safety and health management system: committees (COPASST, Convivencia) and their actas, training and evaluations, occupational exams, legal matrix, annual work plan, minimum standards, inspections, ergonomics, contractors, absenteeism, and the documents and PDFs that prove compliance. Success means the SST team keeps the system complete and audit-ready with less effort.

## Positioning

A single multi-company (multi-tenant) platform built around Colombian SST regulation, where the official formats (actas, certificados, matrices) are generated from the same data the team operates daily.

## Operating Context

- Desktop-first daily work by the SST team; employees also use it from phones for courses, evaluations and signatures.
- Official documents follow controlled formats (code, version, page) and are exported as PDF; on-screen forms mirror those formats.
- Spanish (Colombia) is the interface language.
- Roles: admin, trainer, supervisor, employee, plus custom roles with dynamic permissions; superadmin switches company.

## Capabilities and Constraints

- Frontend: React 19 + TypeScript + Material-UI 7 (Emotion); a single global MUI theme in `src/App.tsx` styles ~91 pages, so theme and shell changes propagate everywhere.
- Shell: `src/components/Layout.tsx`, `Sidebar.tsx`, `Navbar.tsx`; auth screens in `src/components/` (Login, ForgotPassword, ResetPassword, ActivateAccount, ChangePassword).
- Redesign runs in phases: phase 1 is the global theme, shell (sidebar, top bar) and login; later phases rework the most-used screens one by one.
- **Open decision:** per-company branding. The `Empresa` model has no logo or color fields yet; showing each company's logo/color needs backend work (migration, upload, API). The login screen is shown before the company is known, so it carries platform branding unless a per-company login URL is introduced.

## Brand Commitments

- Each client company should see its own brand (logo, possibly color) inside the platform; the platform frame must host a company identity rather than impose one.
- Current platform assets: `public/logo.png`, `public/logo.svg` (navy #004d94). Product name in UI: "Plataforma SST" / "SST Platform".

## Evidence on Hand

- Real modules and data structures exist for every area listed in Product Purpose.
- No testimonials, customer logos, metrics, or certifications are on hand; none should be invented.

## Product Principles

1. Audit-ready by default: every screen should make missing or overdue compliance obvious.
2. The desk worker's throughput comes first: dense, scannable, keyboard-friendly screens over decoration.
3. Official formats stay recognizable: on-screen forms mirror the documents they produce.
4. The company is the protagonist: the platform frame recedes so each client's identity can lead.
