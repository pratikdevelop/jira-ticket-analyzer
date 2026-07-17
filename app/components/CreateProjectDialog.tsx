"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Avatar,
  Stack,
} from "@mui/material";

import AppsIcon from "@mui/icons-material/Apps";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CampaignIcon from "@mui/icons-material/Campaign";
import FolderIcon from "@mui/icons-material/Folder";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateProjectDialog({
  open,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
const [loading, setLoading] = useState(false);
  const [type, setType] = useState("software");
  const [template, setTemplate] = useState("kanban");
  const [visibility, setVisibility] = useState("private");

  useEffect(() => {
    const projectKey = name
      .toUpperCase()
      .replace(/[^A-Z ]/g, "")
      .split(" ")
      .map((x) => x[0])
      .join("")
      .substring(0, 5);

    setKey(projectKey);
  }, [name]);
const handleCreate = async () => {
  try {
    setLoading(true);

    const response = await fetch("/api/projects/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        key,
        description,
        type: type.toUpperCase(),
        template: template.toUpperCase(),
        visibility: visibility.toUpperCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error?.message || "Failed to create project");
      return;
    }

    alert("Project created successfully");

    setName("");
    setKey("");
    setDescription("");
    setType("software");
    setTemplate("kanban");
    setVisibility("private");

    onClose();

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Create Project</DialogTitle>

      <DialogContent dividers>

        <Grid container spacing={3}>

          <Grid item size={{
            xs: 12,
            md: 8,
          }}>

            <Stack spacing={3}>

              <TextField
                label="Project Name"
                fullWidth
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <TextField
                label="Project Key"
                fullWidth
                value={key}
                onChange={(e) =>
                  setKey(e.target.value.toUpperCase())
                }
              />

              <TextField
                label="Description"
                multiline
                rows={5}
                fullWidth
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />

              <FormControl fullWidth>
                <InputLabel>
                  Visibility
                </InputLabel>

                <Select
                  value={visibility}
                  label="Visibility"
                  onChange={(e) =>
                    setVisibility(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="private">
                    Private
                  </MenuItem>

                  <MenuItem value="public">
                    Public
                  </MenuItem>
                </Select>
              </FormControl>

            </Stack>

          </Grid>
<Grid item size={{
            xs: 12,
            md: 4,
          }}>
  <Card
    variant="outlined"
    sx={{
      borderRadius: 2,
      height: "100%",
      bgcolor: "#fafafa",
    }}
  >
    <CardContent>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
          >
            Project Type
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
              }}
            >
              <AppsIcon />
            </Avatar>

            <Box>
              <Typography fontWeight={600}>
                Software Development
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Default project type
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
          >
            Board Template
          </Typography>

          <Typography fontWeight={600}>
            Kanban Board
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Default workflow for all projects
          </Typography>
        </Box>

        {/* ------------------------------------------------------------------

        Future Version

        <ProjectTypeSelector />
        <TemplateSelector />

        ------------------------------------------------------------------- */}
      </Stack>
    </CardContent>
  </Card>
</Grid>

        </Grid>

      </DialogContent>

      <DialogActions>
<Button
  onClick={onClose}
  sx={{
    textTransform: "none",
    fontWeight: 600,
  }}
>
  Cancel
</Button>
<Button
  variant="contained"
  startIcon={<FolderIcon />}
  onClick={handleCreate}
  disabled={!name || loading}
  sx={{
    px: 4,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
  }}
>
  {loading ? "Creating..." : "Create Project"}
</Button>

      </DialogActions>

    </Dialog>
  );
}