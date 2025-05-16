const express = require('express');
const cors = require('cors');
const gitlabRoutes = require('./routes/gitlab');
const gptRoutes = require('./routes/gpt');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', gitlabRoutes);
app.use('/api/gpt', gptRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
