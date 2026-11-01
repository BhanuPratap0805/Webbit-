import React, { useState, useMemo, useRef } from 'react';
import {
  DependencyGraphView,
  type DependencyGraphViewRef,
} from './components/DependencyGraphView';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PathInput } from './components/PathInput';
import { GraphStats } from './components/GraphStats';
import { EmptyState } from './components/EmptyState';
import { analyzeProject } from './api';
import type { DependencyGraphData, SelectedNodeInfo } from './types';

export default function App() {
  const [data, setData] = useState<DependencyGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const graphRef = useRef<DependencyGraphViewRef>(null);

  const handleAnalyze = async (projectPath: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedNodeId(null);
    try {
      const result = await analyzeProject(projectPath);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze project directory');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedNodeInfo = useMemo<SelectedNodeInfo | null>(() => {
    if (!selectedNodeId || !data) return null;
    const parts = selectedNodeId.split('/');
    const fileName = parts.pop() || selectedNodeId;
    const directory = parts.join('/') || '.';
    const dot = fileName.lastIndexOf('.');
    const extension = dot !== -1 ? fileName.slice(dot) : '';

    const imports = data.edges
      .filter((e) => e.source === selectedNodeId)
      .map((e) => e.target);
    const importedBy = data.edges
      .filter((e) => e.target === selectedNodeId)
      .map((e) => e.source);

    return {
      id: selectedNodeId,
      fileName,
      directory,
      extension,
      imports,
      importedBy,
    };
  }, [selectedNodeId, data]);

  const handleCloseSidebar = () => {
    setSelectedNodeId(null);
    graphRef.current?.resetSelection();
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo">
          <div className="app__logo-icon">⬡</div>
          <span className="app__logo-text">NeuralCode Graph</span>
        </div>
        <PathInput
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          initialValue="/Users/ritvikmudgal/VS-CODE/code-parser"
        />
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">⚠️</span>
          <span>{error}</span>
          <button
            type="button"
            className="error-banner__dismiss"
            onClick={() => setError(null)}
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <main className="app__body">
        <div className="app__graph-area">
          {isLoading ? (
            <div className="loading">
              <div className="loading__spinner" />
              <div className="loading__text">Analyzing codebase dependencies...</div>
            </div>
          ) : !data || data.nodes.length === 0 ? (
            <EmptyState
              title={data ? 'No Source Files Found' : 'No Codebase Loaded'}
              description={
                data
                  ? 'No supported source files or local dependencies were found in the specified path.'
                  : 'Enter a local project directory path above to scan and visualize all file dependencies as an interactive neural graph.'
              }
            />
          ) : (
            <>
              <DependencyGraphView
                ref={graphRef}
                nodes={data.nodes}
                edges={data.edges}
                onNodeSelect={setSelectedNodeId}
              />
              <Toolbar
                onZoomIn={() => graphRef.current?.zoomIn()}
                onZoomOut={() => graphRef.current?.zoomOut()}
                onFitView={() => graphRef.current?.fitView()}
                onReset={() => {
                  graphRef.current?.resetSelection();
                  graphRef.current?.fitView();
                  setSelectedNodeId(null);
                }}
              />
              <GraphStats
                nodeCount={data.nodes.length}
                edgeCount={data.edges.length}
              />
            </>
          )}
        </div>

        {selectedNodeInfo && (
          <Sidebar
            info={selectedNodeInfo}
            onClose={handleCloseSidebar}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId);
            }}
          />
        )}
      </main>
    </div>
  );
}
