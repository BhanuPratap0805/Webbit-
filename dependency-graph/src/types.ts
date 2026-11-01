/* ─── Graph data types shared between frontend components ─── */

export interface GraphNode {
  id: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SelectedNodeInfo {
  id: string;
  fileName: string;
  directory: string;
  extension: string;
  imports: string[];
  importedBy: string[];
}
