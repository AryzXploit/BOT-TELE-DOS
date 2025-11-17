# 📦 Installing Advanced Reporting System

## Quick Installation Guide

---

## 🚀 Basic Installation (HTML + JSON Reports)

### Already Included! ✅

The basic reporting system (HTML + JSON) works out of the box with no additional dependencies!

Just run your attacks and reports will be generated automatically in the `reports/` folder.

---

## 📄 PDF Export (Optional)

### Install Puppeteer:

```bash
npm install puppeteer
```

### Or with specific version:

```bash
npm install puppeteer@21.5.2
```

### For GitHub Workspace / Codespaces:

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y \
    chromium-browser \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils

# Install puppeteer
npm install puppeteer
```

---

## 🧪 Test Installation

### Test Basic Reporting:

```bash
# Run a quick attack
node index.js attack -t https://example.com -m GET -th 100 -d 30

# Check reports folder
ls -lh reports/

# Open HTML report in browser
```

### Test PDF Generation:

```javascript
// Create test file: test-pdf.js
import { ReportGenerator } from './src/utils/report-generator.js';

const testData = {
    target: 'https://example.com',
    method: 'GET',
    threads: 100,
    duration: 30,
    elapsed: 30,
    rpc: 1,
    requestsSent: 150000,
    bytesSent: 50000000,
    proxiesUsed: 0,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString()
};

const generator = new ReportGenerator(testData);
const report = await generator.generateReport();

console.log('✅ Report generated!');
console.log('HTML:', report.html);
console.log('JSON:', report.json);

// Test PDF
if (report.html) {
    const pdf = await generator.generatePDF(report.html);
    if (pdf) {
        console.log('✅ PDF generated!', pdf);
    } else {
        console.log('⚠️  PDF generation skipped (puppeteer not installed)');
    }
}
```

Run test:
```bash
node test-pdf.js
```

---

## 🐛 Troubleshooting

### Problem: Puppeteer fails to install

**Solution 1:** Use specific version
```bash
npm install puppeteer@21.5.2
```

**Solution 2:** Skip chromium download, use system chromium
```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer
```

Then configure puppeteer to use system chromium:
```javascript
const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    // or '/usr/bin/google-chrome'
});
```

---

### Problem: PDF generation fails

**Solution:** Install missing dependencies
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Or install Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f
```

---

### Problem: Reports not generating

**Solution:** Check permissions
```bash
# Create reports directory manually
mkdir -p reports
chmod 755 reports

# Check if reports are being created
ls -la reports/
```

---

## 📁 Directory Structure

After installation, your project should have:

```
BOT-TELE-DOS/
├── src/
│   └── utils/
│       └── report-generator.js  ✅ Report generator
├── reports/                      ✅ Auto-created
│   ├── *.html                   ✅ HTML reports
│   ├── *.json                   ✅ JSON reports
│   └── *.pdf                    ✅ PDF reports (if puppeteer installed)
├── REPORTING-GUIDE.md           ✅ Documentation
└── INSTALL-REPORTING.md         ✅ This file
```

---

## ✅ Verification Checklist

- [ ] Basic reporting works (HTML + JSON)
- [ ] Reports folder created automatically
- [ ] HTML reports open in browser
- [ ] JSON reports are valid
- [ ] PDF generation works (optional)
- [ ] Reports contain all sections
- [ ] Recommendations are generated
- [ ] Success score calculated correctly

---

## 🎯 Next Steps

1. **Run your first attack** and check the report
2. **Review recommendations** in the HTML report
3. **Implement suggestions** to improve performance
4. **Compare reports** over time to track improvements

---

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Check file permissions
4. Review error logs

**Developer:** Aryzz-Dev (@AryzXploit)
**GitHub:** https://github.com/AryzXploit
**Telegram:** @AryzzXploit

---

**🔥 HAPPY REPORTING! 🔥**
