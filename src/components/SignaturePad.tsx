import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { Clear, UploadFile } from "@mui/icons-material";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  resolveUrl?: (url: string) => string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  disabled = false,
  resolveUrl,
}) => {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [typedName, setTypedName] = useState("");
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const typedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Render typed name to hidden canvas whenever it changes
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = typedCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 450, 150);

      if (!typedName.trim()) {
        onChange(null);
        return;
      }

      ctx.font = "52px 'Dancing Script', cursive";
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, 225, 80);

      onChange(canvas.toDataURL("image/png"));
    };

    document.fonts.ready.then(render);
  }, [typedName, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (_: React.SyntheticEvent, newTab: 0 | 1 | 2) => {
    onChange(null);
    if (newTab === 0) {
      sigCanvasRef.current?.clear();
    }
    if (newTab !== 1) {
      setTypedName("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setActiveTab(newTab);
  };

  const handleDrawEnd = () => {
    if (sigCanvasRef.current?.isEmpty()) return;
    const dataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL("image/png") ?? null;
    onChange(dataUrl);
  };

  const handleClearDraw = () => {
    sigCanvasRef.current?.clear();
    onChange(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = 450;
        offscreen.height = 150;
        const ctx = offscreen.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 450, 150);
        const scale = Math.min(450 / img.width, 150 / img.height);
        const x = (450 - img.width * scale) / 2;
        const y = (150 - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        onChange(offscreen.toDataURL("image/png"));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected after clearing
    e.target.value = "";
  };

  if (disabled) {
    return (
      <Box sx={{ border: "1px dashed grey", borderRadius: 2, p: 2, bgcolor: "#f9f9f9", maxWidth: 500 }}>
        <Typography variant="subtitle2" gutterBottom>Firma del Trabajador:</Typography>
        {value ? (
          <img
            src={resolveUrl ? resolveUrl(value) : value}
            alt="Firma"
            style={{ maxWidth: "100%", maxHeight: 150 }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">Sin firma registrada</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ border: "1px dashed grey", borderRadius: 2, p: 2, bgcolor: "#f9f9f9", maxWidth: 500 }}>
      <Typography variant="subtitle2" gutterBottom>Firma del Trabajador:</Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 1 }}
        variant="fullWidth"
      >
        <Tab label="Dibujar" />
        <Tab label="Escribir" />
        <Tab label="Subir imagen" />
      </Tabs>

      {/* Tab 0 – Dibujar */}
      {activeTab === 0 && (
        <>
          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, bgcolor: "white", display: "inline-block" }}>
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              canvasProps={{ width: 450, height: 150, className: "sigCanvas" }}
              backgroundColor="white"
              onEnd={handleDrawEnd}
            />
          </Box>
          <Box>
            <Button size="small" onClick={handleClearDraw} startIcon={<Clear />} sx={{ mt: 1 }}>
              Borrar Firma
            </Button>
          </Box>
        </>
      )}

      {/* Tab 1 – Escribir */}
      {activeTab === 1 && (
        <>
          <TextField
            fullWidth
            size="small"
            label="Escriba su nombre completo"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            sx={{ mb: 1 }}
          />
          {/* Hidden canvas used for rendering the typed name */}
          <canvas ref={typedCanvasRef} width={450} height={150} style={{ display: "none" }} />
          {/* Live preview */}
          {value ? (
            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, bgcolor: "white" }}>
              <img src={value} alt="Preview firma" style={{ maxWidth: "100%", maxHeight: 150, display: "block" }} />
            </Box>
          ) : (
            <Box
              sx={{
                width: 450,
                maxWidth: "100%",
                height: 80,
                border: "1px dashed #bdbdbd",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "white",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Vista previa de la firma
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Tab 2 – Subir imagen */}
      {activeTab === 2 && (
        <>
          {value ? (
            <Box>
              <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, bgcolor: "white", mb: 1 }}>
                <img src={value} alt="Firma subida" style={{ maxWidth: "100%", maxHeight: 150, display: "block" }} />
              </Box>
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={() => {
                  onChange(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Quitar imagen
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFile />}
              sx={{ height: 80, width: "100%", borderStyle: "dashed" }}
            >
              Seleccionar imagen de firma
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleUpload}
              />
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default SignaturePad;
