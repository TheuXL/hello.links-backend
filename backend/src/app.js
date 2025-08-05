const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const linkRoutes = require('./routes/linkRoutes');
const contentRoutes = require('./routes/contentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/links', linkRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);

// Placeholder for user auth routes
app.get('/api/auth', (req, res) => res.json({ msg: 'Auth routes placeholder' }));

// Content serving routes should be last to catch all non-api requests
app.use('/', contentRoutes);

app.use(errorHandler);

module.exports = app;
