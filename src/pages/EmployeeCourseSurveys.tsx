import { Assignment as SurveyIcon, ArrowBack } from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import api from "../services/api";

interface SurveyItem {
  id: number;
  title: string;
  description: string;
  required_for_completion: boolean;
}

const EmployeeCourseSurveys: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequiredSurveys = async () => {
      try {
        setLoading(true);
        const resp = await api.get(`/surveys/course/${id}/required`);
        setSurveys(resp.data || []);
      } catch (e: any) {
        console.error("Error fetching required surveys:", e);
        setError(
          e?.response?.data?.detail || "Error al cargar las encuestas del curso"
        );
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRequiredSurveys();
  }, [id]);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Typography variant="h4" gutterBottom>
        Encuestas del Curso
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : surveys.length === 0 ? (
        <Alert severity="info">
          No hay encuestas pendientes para este curso.
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Completa las siguientes encuestas requeridas para finalizar el
              proceso del curso.
            </Typography>
            <List>
              {surveys.map((survey) => (
                <ListItem
                  key={survey.id}
                  secondaryAction={
                    <Button
                      variant="contained"
                      onClick={() =>
                        navigate(`/employee/surveys?survey_id=${survey.id}`)
                      }
                    >
                      Responder
                    </Button>
                  }
                >
                  <ListItemIcon>
                    <SurveyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="subtitle1">
                          {survey.title}
                        </Typography>
                        {survey.required_for_completion && (
                          <Chip size="small" color="error" label="Requerida" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {survey.description || "Sin descripción"}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EmployeeCourseSurveys;

