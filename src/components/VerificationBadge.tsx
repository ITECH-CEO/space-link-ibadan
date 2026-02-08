import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

const config: Record<Status, { icon: typeof CheckCircle; label: string; className: string }> = {
  approved: {
    icon: CheckCircle,
    label: "Verified",
    className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
};

export function VerificationBadge({ status }: { status: Status }) {
  const { icon: Icon, label, className } = config[status];
  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}
