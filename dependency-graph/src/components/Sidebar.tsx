import React from 'react';
import type { SelectedNodeInfo } from '../types';

export interface SidebarProps {
  info: SelectedNodeInfo | null;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

function getFileIcon(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.tsx':
    case '.jsx':
      return '⚛️';
    case '.ts':
      return '🔷';
    case '.js':
    case '.mjs':
    case '.cjs':
      return '🟨';
    case '.py':
      return '🐍';
    case '.css':
    case '.scss':
      return '🎨';
    case '.json':
      return '📋';
    case '.html':
      return '🌐';
    default:
      return '📄';
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  info,
  onClose,
  onSelectNode,
}) => {
  if (!info) return null;

  return (
    <aside className="sidebar" aria-label="Selected file details">
      <div className="sidebar__header">
        <span className="sidebar__title">File Details</span>
        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Close details"
          title="Close details"
        >
          ✕
        </button>
      </div>

      <div className="sidebar__content">
        <div className="sidebar__file-info">
          <div className="sidebar__file-icon">{getFileIcon(info.extension)}</div>
          <div className="sidebar__file-name">{info.fileName}</div>
          <div className="sidebar__file-path">{info.id}</div>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <span className="sidebar__section-icon">↗</span>
            <span>Imports</span>
            <span className="sidebar__badge">{info.imports.length}</span>
          </div>

          {info.imports.length === 0 ? (
            <div className="sidebar__empty">No outgoing imports</div>
          ) : (
            <ul className="sidebar__list">
              {info.imports.map(target => (
                <li
                  key={target}
                  className="sidebar__list-item"
                  title={target}
                  style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
                  onClick={() => onSelectNode?.(target)}
                >
                  {target}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <span className="sidebar__section-icon">↙</span>
            <span>Imported By</span>
            <span className="sidebar__badge">{info.importedBy.length}</span>
          </div>

          {info.importedBy.length === 0 ? (
            <div className="sidebar__empty">Not imported by any file</div>
          ) : (
            <ul className="sidebar__list">
              {info.importedBy.map(source => (
                <li
                  key={source}
                  className="sidebar__list-item"
                  title={source}
                  style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
                  onClick={() => onSelectNode?.(source)}
                >
                  {source}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};
