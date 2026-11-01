import React, { useState } from 'react';

export interface PathInputProps {
  onAnalyze: (path: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const PathInput: React.FC<PathInputProps> = ({
  onAnalyze,
  isLoading,
  initialValue = '',
}) => {
  const [path, setPath] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim() && !isLoading) {
      onAnalyze(path.trim());
    }
  };

  return (
    <form className="path-input" onSubmit={handleSubmit}>
      <div className="path-input__field">
        <span className="path-input__icon">📁</span>
        <input
          type="text"
          className="path-input__input"
          placeholder="/path/to/project (e.g. /Users/.../my-app)"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          disabled={isLoading}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="path-input__button"
        disabled={isLoading || !path.trim()}
      >
        {isLoading ? (
          <>
            <span className="path-input__spinner" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>Analyze Graph</span>
            <span>→</span>
          </>
        )}
      </button>
    </form>
  );
};
