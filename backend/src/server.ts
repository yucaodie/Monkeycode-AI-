import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './utils/database.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import knowledgeRoutes from './routes/knowledge.js';
import searchRoutes from './routes/search.js';
import uploadRoutes from './routes/upload.js';
import outputRoutes from './routes/output.js';
import modelRoutes from './routes/models.js';
import knowledgeBaseRoutes from './routes/knowledge-base.js';
import notesRoutes from './routes/notes.js';
import qaRoutes from './routes/qa.js';

app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/output', outputRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/qa', qaRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
