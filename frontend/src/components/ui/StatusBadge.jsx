import React from 'react';
import Badge from './Badge';

export default function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    Submitted: { variant: 'info', label: 'Submitted' },
    Registered: { variant: 'saffron', label: 'Registered' },
    Assigned: { variant: 'warning', label: 'Assigned' },
    'In Progress': { variant: 'warning', label: 'In Progress' },
    Resolved: { variant: 'success', label: 'Resolved' },
    Closed: { variant: 'neutral', label: 'Closed' },
    Pending: { variant: 'neutral', label: 'Pending' }
  };

  const config = statusConfig[status] || { variant: 'neutral', label: status || 'Unknown' };

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {config.label}
    </Badge>
  );
}
