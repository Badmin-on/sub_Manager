const express = require('express');
const path = require('path');

const app = express();
const port = 3001;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for any route that doesn't match a file
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Preview server running at http://0.0.0.0:${port}`);
});