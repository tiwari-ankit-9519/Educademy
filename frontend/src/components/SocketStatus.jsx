import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSocketContext } from "./SocketProvider";

const SocketStatus = ({ showText = false, className = "" }) => {
  const { isConnected, connectionError, connectedDevices } = useSocketContext();

  const getStatusInfo = () => {
    if (connectionError) {
      return {
        icon: AlertTriangle,
        color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        text: "Connection Error",
        detail: connectionError,
      };
    }

    if (isConnected) {
      return {
        icon: Wifi,
        color:
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        text: "Connected",
        detail: `${connectedDevices} device${
          connectedDevices !== 1 ? "s" : ""
        }`,
      };
    }

    return {
      icon: WifiOff,
      color:
        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      text: "Disconnected",
      detail: "Reconnecting...",
    };
  };

  const { icon: Icon, color, text, detail } = getStatusInfo();

  if (!showText) {
    return (
      <div
        className={`inline-flex items-center ${className}`}
        title={`${text}: ${detail}`}
      >
        <Icon className="w-4 h-4" />
      </div>
    );
  }

  return (
    <Badge variant="secondary" className={`${color} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {text}
      {detail && <span className="ml-1 text-xs opacity-75">({detail})</span>}
    </Badge>
  );
};

export default SocketStatus;
