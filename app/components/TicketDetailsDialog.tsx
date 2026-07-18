"use client";

import {
  Dialog,
  DialogContent,
  Box,
  SxProps,
  Theme,
} from "@mui/material";
import TicketDetailPage from "../app/TicketDetailPage/page";

type Props = {
  open: boolean;
  projectDetails: any;
  onClose: () => void;
  issue: any;
  onDeleted?: () => void;
  onUpdated?: (issue: any) => void;
};

const dialogContentSx: SxProps<Theme> = {
  p: 0,
  maxWidth: "90vw",
  width: "90vw",
  height: "90vh",
  overflow: "hidden",
  borderRadius: 1,
  "& .MuiDialogContent-root": {
    p: 0,
    overflow: "hidden",
  },
};

export default function TicketDetailDialog({
  open,
  projectDetails,
  onClose,
  issue,
  onDeleted,
  onUpdated,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: dialogContentSx,
      }}
    >
      <DialogContent sx={{ p: 0, overflow: "hidden", height: "100%" }}>
        <Box sx={{ height: "100%", width: "100%" }}>
          <TicketDetailPage
            initialIssue={issue}
            onDeleted={onDeleted}
            onUpdated={onUpdated}
            projectDetails={projectDetails}
            onBack={onClose}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}