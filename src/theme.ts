import { alpha, createTheme } from "@mui/material/styles";

/**
 * Mundo visual «Talonario sellado».
 * Cada registro es un cupón y su estado se estampa como un sello.
 * `shell` es el color de la empresa: hoy azul de cabina por defecto,
 * mañana el color que cada empresa tenga configurado.
 */
export const brand = {
  shell: "#14295C",
  shellDark: "#0B1A3D",
  shellText: "#C9D3EA",
  stock: "#F2F2F0",
  coupon: "#FFFFFF",
  carbon: "#4B2E83",
  red: "#C8102E",
  green: "#1F6B3F",
  amber: "#9A5A00",
  ink: "#111A2E",
  mute: "#5A6478",
  rule: "#C9CFDA",
  ruleSoft: "#E3E6EC",
  // Marca de datos de una sola serie (validada: banda de luminosidad, croma y contraste)
  chart: "#3A5BA0",
};

export const condensed = '"Barlow Condensed", "Arial Narrow", sans-serif';
const body = '"Barlow", "Segoe UI", Roboto, sans-serif';

const capsLabel = {
  fontFamily: condensed,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  palette: {
    primary: { main: brand.shell, dark: brand.shellDark, light: "#2A4A8C", contrastText: "#fff" },
    secondary: { main: brand.carbon, contrastText: "#fff" },
    error: { main: brand.red },
    success: { main: brand.green },
    warning: { main: brand.amber },
    info: { main: "#2B5CAB" },
    background: { default: brand.stock, paper: brand.coupon },
    text: { primary: brand.ink, secondary: brand.mute },
    divider: brand.rule,
    action: { hover: alpha(brand.shell, 0.05), selected: alpha(brand.shell, 0.09) },
  },
  shape: { borderRadius: 3 },
  typography: {
    fontFamily: body,
    fontSize: 14,
    h1: { fontFamily: condensed, fontWeight: 700, letterSpacing: "0.005em" },
    h2: { fontFamily: condensed, fontWeight: 700, letterSpacing: "0.005em" },
    h3: { fontFamily: condensed, fontWeight: 700, letterSpacing: "0.01em" },
    h4: { fontFamily: condensed, fontWeight: 700, letterSpacing: "0.01em", fontSize: "2rem" },
    h5: { fontFamily: condensed, fontWeight: 700, letterSpacing: "0.015em", fontSize: "1.6rem" },
    h6: { fontFamily: condensed, fontWeight: 600, letterSpacing: "0.02em", fontSize: "1.25rem" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { ...capsLabel, fontSize: "0.95rem" },
    overline: { ...capsLabel, fontSize: "0.78rem", lineHeight: 1.6 },
    caption: { letterSpacing: "0.01em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: brand.stock, fontVariantNumeric: "lining-nums" },
        "::selection": { backgroundColor: alpha(brand.carbon, 0.22), color: brand.ink },
        "*:focus-visible": { outlineColor: brand.carbon },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 3, paddingInline: 18, minHeight: 38, lineHeight: 1.2 },
        sizeSmall: { minHeight: 30, paddingInline: 12, fontSize: "0.85rem" },
        sizeLarge: { minHeight: 46, fontSize: "1.05rem" },
        outlined: { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } },
        text: { paddingInline: 10 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 3 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: 3 },
        outlined: { borderColor: brand.rule },
        elevation0: { border: `1px solid ${brand.rule}` },
        elevation1: { border: `1px solid ${brand.rule}`, boxShadow: "none" },
        elevation2: { border: `1px solid ${brand.rule}`, boxShadow: "none" },
        elevation3: { border: `1px solid ${brand.rule}`, boxShadow: "none" },
        elevation4: { border: `1px solid ${brand.rule}`, boxShadow: "none" },
        // Superficies flotantes (menús, diálogos): profundidad real
        elevation8: { border: `1px solid ${brand.rule}`, boxShadow: "0 8px 24px rgba(17, 26, 46, 0.14)" },
        elevation24: { border: `1px solid ${brand.rule}`, boxShadow: "0 16px 48px rgba(17, 26, 46, 0.22)" },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "primary" },
      styleOverrides: { root: { border: 0 } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { border: 0 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${brand.rule}`, borderRadius: 3 } },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${brand.ruleSoft}`, paddingBlock: 12 },
        title: { ...capsLabel, fontSize: "1.05rem", letterSpacing: "0.05em" },
        subheader: { fontSize: "0.85rem" },
      },
    },
    MuiTableHead: {
      styleOverrides: { root: { "& .MuiTableRow-root": { backgroundColor: "transparent" } } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: brand.ruleSoft, fontVariantNumeric: "tabular-nums" },
        head: {
          ...capsLabel,
          fontSize: "0.8rem",
          color: brand.mute,
          backgroundColor: brand.coupon,
          borderBottom: `2px solid ${brand.shell}`,
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.MuiTableRow-hover:hover": { backgroundColor: alpha(brand.shell, 0.035) },
          "&.Mui-selected": { backgroundColor: alpha(brand.carbon, 0.07) },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { borderRadius: 3 } },
    },
    // Firma del mundo: los estados se estampan como sellos
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState, theme: t }) => {
          const tone =
            ownerState.color && ownerState.color !== "default"
              ? t.palette[ownerState.color].main
              : null;
          return {
            ...capsLabel,
            borderRadius: 3,
            fontSize: "0.78rem",
            letterSpacing: "0.07em",
            ...(tone && ownerState.variant !== "outlined"
              ? {
                  backgroundColor: alpha(tone, 0.08),
                  color: tone,
                  border: `1.5px solid ${tone}`,
                  "&.MuiChip-clickable:hover": { backgroundColor: alpha(tone, 0.16) },
                  "& .MuiChip-icon, & .MuiChip-deleteIcon": { color: tone },
                }
              : {}),
            ...(ownerState.variant === "outlined" ? { borderWidth: 1.5 } : {}),
            ...(!tone && ownerState.variant !== "outlined"
              ? { backgroundColor: "#EDEFF3", color: brand.ink }
              : {}),
          };
        },
        sizeSmall: { height: 22 },
        label: { paddingInline: 8 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          backgroundColor: brand.coupon,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.rule },
          "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
            borderColor: "#8C96A8",
          },
          "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
            borderColor: brand.carbon,
            borderWidth: 2,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { "&.Mui-focused:not(.Mui-error)": { color: brand.carbon } },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${brand.rule}`, minHeight: 44 },
        indicator: { height: 3, backgroundColor: brand.shell },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...capsLabel,
          fontSize: "0.92rem",
          minHeight: 44,
          color: brand.mute,
          "&.Mui-selected": { color: brand.shell },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 3, border: "1px solid", alignItems: "flex-start" },
        standardSuccess: { borderColor: alpha(brand.green, 0.35) },
        standardError: { borderColor: alpha(brand.red, 0.35) },
        standardWarning: { borderColor: alpha(brand.amber, 0.35) },
        standardInfo: { borderColor: alpha("#2B5CAB", 0.3) },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 4 } },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: condensed,
          fontWeight: 700,
          fontSize: "1.4rem",
          letterSpacing: "0.02em",
          borderBottom: `1px solid ${brand.ruleSoft}`,
          marginBottom: 8,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: { root: { borderTop: `1px dashed ${brand.rule}`, padding: "12px 24px" } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: brand.shellDark, fontSize: "0.8rem", borderRadius: 3 },
        arrow: { color: brand.shellDark },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 1, height: 6, backgroundColor: brand.ruleSoft },
        bar: { borderRadius: 1 },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: brand.rule } },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: "0.92rem", minHeight: 38 } },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: { root: { border: `1px solid ${brand.rule}`, "&::before": { display: "none" } } },
    },
    MuiBadge: {
      styleOverrides: { badge: { fontFamily: condensed, fontWeight: 700, borderRadius: 3 } },
    },
    MuiFab: {
      styleOverrides: { root: { boxShadow: "0 6px 16px rgba(17, 26, 46, 0.2)" } },
    },
  },
});

export default theme;
