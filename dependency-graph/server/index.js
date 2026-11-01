"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Express backend — bridges the web UI to the code-parser module.
 * POST /api/analyze { projectPath } → { nodes, edges }
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const module_1 = require("module");
const require = (0, module_1.createRequire)(import.meta.url);
const { buildDependencyGraph } = require('@anthropic/code-parser');
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/api/analyze', async (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({ error: 'projectPath is required' });
        return;
    }
    try {
        const graph = await buildDependencyGraph(projectPath.trim());
        res.json(graph);
    }
    catch (err) {
        console.error('[server] Analysis error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to analyze project' });
    }
});
app.listen(PORT, () => {
    console.log(`[server] Dependency graph API running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map