import React from 'react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Codebase Loaded',
  description = 'Enter a local project directory path above to scan and visualize all file dependencies as an interactive neural graph.',
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">🕸️</div>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__desc">{description}</p>
    </div>
  );
};
