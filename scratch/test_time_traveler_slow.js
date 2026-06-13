const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
      if (req.url === '/' || req.url.startsWith('/?')) {
        filePath = path.join(__dirname, '..', 'index.html');
      }

      const extname = String(path.extname(filePath)).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
      };

      const contentType = mimeTypes[extname] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if(error.code == 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found', 'utf-8');
          } else {
            res.writeHead(500);
            res.end('Error: '+error.code);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(port, () => {
      console.log(`Local test server started on port ${port}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const port = 8090;
  const server = await startServer(port);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => {
    console.error('PAGE EXCEPTION:', err.toString());
    pageErrors.push(err.toString());
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
      consoleErrors.push(msg.text());
    } else {
      console.log('CONSOLE LOG:', msg.text());
    }
  });

  console.log(`Navigating to http://localhost:${port}/index.html...`);
  await page.goto(`http://localhost:${port}/index.html`);

  console.log('Waiting for select screen...');
  await page.waitForSelector('.character-card');

  console.log('Selecting Time Traveler (left) and Guard (right)...');
  await page.click('#left-grid .character-card[data-char-id="time_traveler"]');
  await page.click('#right-grid .character-card[data-char-id="guard"]');

  console.log('Clicking start button...');
  await page.click('#start-btn');

  await delay(1000);

  console.log('Setting speed slider to 3.0x...');
  await page.evaluate(() => {
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
      speedSlider.value = 3.0;
      speedSlider.dispatchEvent(new Event('input'));
      speedSlider.dispatchEvent(new Event('change'));
    }
  });

  console.log('Monitoring battle for Temporal Field activation and enemy speed multiplier...');
  let checkedSlowSuccess = false;
  
  // Poll every 100ms for 10 seconds to detect when Guard gets caught in the Temporal Field and verify the 0.1 speed multiplier
  for (let i = 0; i < 100; i++) {
    await delay(100);
    const slowStatus = await page.evaluate(() => {
      if (!window.combatManager) return null;
      // Find the enemy (Guard on the right team)
      const enemy = window.combatManager.fightersRight[0];
      if (!enemy) return null;
      
      const inField = enemy.inTemporalField;
      const speedMult = enemy.getSpeedMultiplier();
      return { inField, speedMult };
    });

    if (slowStatus) {
      if (slowStatus.inField) {
        console.log(`Guard caught in Temporal Field! Current speed multiplier: ${slowStatus.speedMult}`);
        if (Math.abs(slowStatus.speedMult - 0.1) < 0.001) {
          console.log('SUCCESS: Guard speed multiplier is exactly 0.1 inside Temporal Field!');
          checkedSlowSuccess = true;
          break;
        } else {
          console.warn(`WARNING: Guard speed multiplier is ${slowStatus.speedMult}, expected 0.1`);
        }
      }
    }
  }

  console.log('Closing browser...');
  await browser.close();
  
  console.log('Closing server...');
  server.close();

  const fatalErrors = consoleErrors.filter(e => e.includes('ReferenceError') || e.includes('TypeError') || e.includes('SyntaxError'));

  if (pageErrors.length > 0 || fatalErrors.length > 0) {
    console.error('Test FAILED due to runtime exceptions.');
    process.exit(1);
  } else if (!checkedSlowSuccess) {
    console.error('Test FAILED: Guard was not verified to have 0.1 speed multiplier inside the Temporal Field during the 10s run.');
    process.exit(1);
  } else {
    console.log('Test PASSED successfully.');
    process.exit(0);
  }
}

runTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
