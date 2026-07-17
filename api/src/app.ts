import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from './routes/auth.js'

import issuesRoutes from './routes/issues.js';

import projectsRoutes from './routes/projects.js';


const app = express();


// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());


app.use('/api/projects', projectsRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/auth', authRoutes);


// Routes
app.get("/", (req: any, res: any) => {
  res.send("API Running");
});



export default app;