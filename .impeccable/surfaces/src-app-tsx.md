---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/Layout.tsx","src/components/Sidebar.tsx","src/components/Login.tsx"]
---

# Shell, tema global y login — Fase 1

Scope: global MUI theme (src/theme.ts via App.tsx), app shell (Layout, Sidebar) and Login. Mode: Operate. Every page inherits the theme; pages are reworked in later phases.

Audience/job: responsable SST at a desk operating dense tables and long forms; employees on phones for courses and signatures.

Constraints: MUI 7 standard controls stay standard (Operate rule). Per-company branding: shell color slot defaults to carrier navy until Empresa gets logo/color fields (backend pending). Login shows platform brand (company unknown before login).

## Direction contract

THESIS: The SG-SST as a stamped ticket book: every record is a coupon whose state is stamped on it (vigente, vencido, anulado, firmada); nothing disappears, it gets cancelled. Refuses the generic SaaS card dashboard with rounded white tiles and pastel pills.

OWN-WORLD: Carrier navy #14295C shell (the company color slot), coupon white #FFFFFF on stock ground #F2F2F0, jet red #C8102E reserved for vencido/anulado stamps and destructive actions, carbon purple #4B2E83 for every filled figure (codes, dates, counts, numerals) and focus, ok green #1F6B3F. Barlow Condensed caps tracked for labels, headers, buttons and tabs; Barlow body. 1px rules #C9CFDA, dashed perforations inside coupons, 3px radius, no shadows for structure.

STORY: The SST lead sees which records are stamped vencido at a glance, opens the coupon, acts, and the stamp changes; the auditor trail stays visible.

FIRST VIEWPORT: Navy top bar with company mark at left, "Plataforma SST" label, superadmin company switcher, user. Navy sidebar of condensed-caps groups; active item is a white coupon tab with navy text and red icon. Content on stock ground; page title in condensed caps; cards are white coupons with a condensed-caps header strip; tables with condensed-caps headers over a 2px navy rule. Primary action: navy contained button, top right of each page. Login: split screen, navy field with the platform name in large condensed caps at left, a boarding-pass coupon with perforation holding the form at right.

FORM: Challenger «Talonario sellado» (vernacular-ephemera-jet-age-ticket-wallet), chosen by the user over the assigned direction. seed:df5948f483edbbee. Translation: the world's red primary CTA becomes navy, because red carries vencido/void meaning in an SST product. Signature move: the status stamp (bordered condensed caps in state color) used for every record state, applied app-wide through Chip.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
