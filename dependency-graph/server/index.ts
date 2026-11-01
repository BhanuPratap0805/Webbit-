/**
 * Express backend — bridges the web UI to the code-parser module.
 * POST /api/analyze { projectPath } → { nodes, edges }
 */
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { buildDependencyGraph } = require('@anthropic/code-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req: express.Request, res: express.Response) => {
  const { projectPath } = req.body;

  if (!projectPath || typeof projectPath !== 'string') {
    res.status(400).json({ error: 'projectPath is required' });
    return;
  }

  try {
    const graph = await buildDependencyGraph(projectPath.trim());
    res.json(graph);
  } catch (err: any) {
    console.error('[server] Analysis error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to analyze project' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Dependency graph API running at http://localhost:${PORT}`);
});
