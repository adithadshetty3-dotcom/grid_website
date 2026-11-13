import express from 'express';
import timelineApp from './backend/src/server.js';

const app = express();
app.use(timelineApp);

export default app;
