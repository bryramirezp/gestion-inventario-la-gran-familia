import React from 'react';
import { useAlerts, Alert } from '../contexts/AlertContext';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from './icons/Icons';

const alertConfig = {
  success: {
    icon: CheckCircleIcon,
    bgClass: 'bg-success/10 border-success/50 text-success',
  },
  error: {
    icon: XCircleIcon,
    bgClass: 'bg-destructive/10 border-destructive/50 text-destructive',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgClass: 'bg-warning/10 border-warning/50 text-yellow-600',
  },
  info: {
    icon: InformationCircleIcon,
    bgClass: 'bg-primary/10 border-primary/50 text-primary',
  },
};

const AlertItem: React.FC<{ alert: Alert; onDismiss: (id: number) => void }> = ({
  alert,
  onDismiss,
}) => {
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  return (
    <div
      className={`w-full max-w-sm p-4 rounded-lg border shadow-medium flex items-start space-x-3 animate-slide-in-right bg-card ${config.bgClass}`}
    >
      <div className={`flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{alert.message}</p>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="text-muted-foreground hover:text-foreground"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export const AlertContainer: React.FC = () => {
  const { alerts, removeAlert } = useAlerts();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-sm">
      {alerts.map((alert) => (
        <AlertItem key={`${alert.id}-${alert.message}-${alert.type}`} alert={alert} onDismiss={removeAlert} />
      ))}
    </div>
  );
};
