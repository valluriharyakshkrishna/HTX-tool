# HTX Tool 🛡️

A full-stack secure document viewer with live surveillance capture — built with **HTML, CSS, JavaScript, Node.js & Express.js**.

---

## 📁 Project Structure

```
htx-tool/
├── public/
│   ├── index.html       ← Main UI (consent dialog, PDF viewer, surveillance panel)
│   ├── style.css        ← Dark premium UI styles
│   ├── script.js        ← Camera, geolocation, capture logic
│   └── pdfs/            ← ⬅ Place your PDF files here
├── uploads/             ← Captured images saved here (auto-created)
├── locations/           ← JSON location records saved here (auto-created)
├── logs/
│   └── upload.log       ← Activity log (auto-created)
├── server.js            ← Express.js backend
├── package.json
└── README.md
```

---

## 🚀 How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Add a PDF (optional but recommended)
Copy any `.pdf` file into:
```
public/pdfs/your-document.pdf
```

### 3. Start the server
```bash
node server.js
```

### 4. Open the app
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ Use **Chrome or Edge** for best camera/geolocation support.
> 
> ⚠️ Camera and geolocation only work on **localhost** or **HTTPS** origins.

---

## ⚙️ How It Works

### Consent Dialog
- On first load, a consent dialog explains that the app will:
  - Access the **front camera**
  - Access your **GPS location**
  - Capture an image **every 30 seconds**
  - Store data **locally on this server**
- The user must explicitly click **Allow & Continue** to proceed.
- Clicking **Deny Access** blocks all features.

### Image Capture
- Uses `getUserMedia({ video: { facingMode: "user" } })` to access the front camera.
- A `<canvas>` element captures a JPEG snapshot every 30 seconds.
- Images are uploaded via `POST /upload` (multipart/form-data).
- Saved to `uploads/capture_<timestamp>.jpg`.

### Geolocation
- Uses `navigator.geolocation.watchPosition()` for continuous GPS tracking.
- Latitude, longitude, and accuracy are displayed in real-time.
- Each capture includes the latest known location.

### Backend (server.js)
| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Serves `public/index.html` |
| `/upload` | POST | Saves image + location JSON |
| `/stats` | GET | Returns capture counts + recent logs |
| `/pdfs` | GET | Lists available PDF files |

### Data Storage
| Type | Location | Format |
|------|----------|--------|
| Images | `uploads/` | `capture_<timestamp>.jpg` |
| Locations | `locations/` | `location_<timestamp>.json` |
| Log | `logs/upload.log` | Plain text, timestamped |

---

## 🖥️ UI Features
- 🔒 **Consent overlay** with animated shield icon
- 📄 **PDF viewer** with dropdown to switch documents
- 📷 **Live camera feed** with corner brackets & REC badge
- ⏱️ **Animated countdown ring** (30 sec)
- 📍 **Real-time GPS coordinates** with Google Maps link
- 📋 **Activity log** with color-coded entries
- ⏹️ **Stop Capture** button to end session gracefully

---

## 📦 Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | HTTP server & routing |
| `multer` | ^1.4.5-lts.1 | Multipart image uploads |
| `cors` | ^2.8.5 | Cross-origin support |
| `morgan` | ^1.10.0 | HTTP request logging |

---

## ⚠️ Notes
- **No database is used** — all data is stored as flat files.
- Camera access requires browser permission approval.
- Works best on **Chrome / Edge / Firefox** with HTTPS or localhost.
- Captured data is stored **only locally** on the server machine.

---

## 📝 License
MIT
