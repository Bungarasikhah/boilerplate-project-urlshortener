require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urlDatabase = {};
let urlCounter = 1;

// POST endpoint untuk membuat short url
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Parse URL
  const urlObj = urlParser.parse(originalUrl);

  // Cek format protokol URL (harus http atau https)
  if (!urlObj.protocol || !(urlObj.protocol === 'http:' || urlObj.protocol === 'https:')) {
    return res.json({ error: 'invalid url' });
  }

  // Gunakan dns.lookup untuk verifikasi hostname
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

// GET endpoint untuk redirect ke original URL berdasarkan short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    return res.redirect(originalUrl);
  }
  res.json({ error: 'No short URL found for given input' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
