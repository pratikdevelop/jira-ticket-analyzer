"use client";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Box,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";

interface ProjectsAccordionProps {
  projects: any[];
  showProjectDetails: (project: any) => void;
}

export default function ProjectsAccordion({
  projects,
  showProjectDetails,
}: ProjectsAccordionProps) {
  return (
    <Accordion defaultExpanded elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Projects</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        {projects.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: "center" }}
          >
            No projects found
          </Typography>
        ) : (
          <List disablePadding>
            {projects.map((project: any) => (
              <ListItemButton
                key={project.id}
                onClick={() => showProjectDetails(project)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  "&:hover": {
                    bgcolor: "primary.light",
                  },
                }}
              >
                <FolderIcon
                  color="primary"
                  sx={{ mr: 2 }}
                />

                <ListItemText
                  primary={project.name}
                  secondary={project.description || "No description"}
                />

                <Box display="flex" gap={1}>
                  <Chip
                    label={project.key}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  );
}