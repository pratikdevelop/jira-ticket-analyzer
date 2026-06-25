"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import TicketDetailPage from "./TicketDetailPage/page";

type Props = {
  open: boolean;
  projectDetails: any;
  onClose: () => void;
  issue: any;

  onDeleted?: () => void;
  onUpdated?: (issue: any) => void;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
      showCloseButton={false}
        className="
          p-0
          !max-w-[90vw]
          w-[90vw]
          h-[90vh]
          overflow-hidden
        "
      >
        <TicketDetailPage
          initialIssue={issue}
          onDeleted={onDeleted}
          onUpdated={onUpdated}
          projectDetails={projectDetails}
          onBack={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}