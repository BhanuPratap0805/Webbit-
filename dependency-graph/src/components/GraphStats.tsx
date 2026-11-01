import React from 'react';

export interface GraphStatsProps {
  nodeCount: number;
  edgeCount: number;
}

export const GraphStats: React.FC<GraphStatsProps> = ({ nodeCount, edgeCount }) => {
  return (
    <div className="graph-stats">
      <div className="graph-stats__item">
        <span>Files</span>
        <span className="graph-stats__value">{nodeCount}</span>
      </div>
      <div className="graph-stats__item">
        <span>Dependencies</span>
        <span className="graph-stats__value">{edgeCount}</span>
      </div>
    </div>
  );
};
