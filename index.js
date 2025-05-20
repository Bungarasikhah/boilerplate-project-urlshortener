require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3002;

app.use(cors());

// Middleware untuk parsing data form (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory storage untuk URL, key = short_url id, value = original URL
const urlDatabase = {};
let urlCounter = 1;

// POST endpoint untuk membuat short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Parse URL untuk mendapatkan hostname dan protokol
  const urlObj = urlParser.parse(originalUrl);

  // Validasi protokol harus http: atau https:
  if (!urlObj.protocol || !(urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
    return res.json({ error: 'invalid url' });
  }

  // Validasi hostname menggunakan dns.lookup
  dns.lookup(urlObj.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Cek apakah URL sudah ada di database
    let shortUrl = Object.keys(urlDatabase).find(key => urlDatabase[key] === originalUrl);

    if (!shortUrl) {
      shortUrl = urlCounter++;
      urlDatabase[shortUrl] = originalUrl;
    }

    res.json({
      original_url: originalUrl,
      short_url: Number(shortUrl)
    });
  });
});

// GET endpoint untuk redirect ke URL asli berdasar short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    return res.redirect(originalUrl);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
