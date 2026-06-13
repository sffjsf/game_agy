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
  const port = 8091;
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

  // --- PART 1: Verify Time Traveler Temporal Field is 0.5 slow ---
  console.log(`Navigating to http://localhost:${port}/index.html for Time Traveler slow test...`);
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForSelector('.character-card');

  console.log('Selecting Time Traveler (left) and Guard (right)...');
  await page.click('#left-grid .character-card[data-char-id="time_traveler"]');
  await page.click('#right-grid .character-card[data-char-id="guard"]');
  await page.click('#start-btn');
  await delay(1000);

  // Set speed to 3.0x
  await page.evaluate(() => {
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
      speedSlider.value = 3.0;
      speedSlider.dispatchEvent(new Event('input'));
    }
  });

  let verifiedTimeTravelerSlow = false;
  for (let i = 0; i < 80; i++) {
    await delay(100);
    const slowStatus = await page.evaluate(() => {
      if (!window.combatManager) return null;
      const enemy = window.combatManager.fightersRight[0];
      if (!enemy) return null;
      return { inField: enemy.inTemporalField, speedMult: enemy.getSpeedMultiplier() };
    });

    if (slowStatus && slowStatus.inField) {
      console.log(`Guard in Time Traveler Field. Speed multiplier: ${slowStatus.speedMult}`);
      if (Math.abs(slowStatus.speedMult - 0.5) < 0.001) {
        console.log('SUCCESS: Time Traveler slow multiplier is exactly 0.5!');
        verifiedTimeTravelerSlow = true;
        break;
      }
    }
  }

  // --- PART 2: Verify Celestial Sword Deity Zhuxian Sword Array is 0.1 slow ---
  console.log(`Reloading page to http://localhost:${port}/index.html for Celestial Sword Deity slow test...`);
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForSelector('.character-card');

  console.log('Selecting Celestial Sword Deity (left) and Guard (right)...');
  await page.click('#left-grid .character-card[data-char-id="celestial_sword_deity"]');
  await page.click('#right-grid .character-card[data-char-id="guard"]');
  await page.click('#start-btn');
  await delay(1000);

  // Set speed to 3.0x
  await page.evaluate(() => {
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
      speedSlider.value = 3.0;
      speedSlider.dispatchEvent(new Event('input'));
    }
  });

  let verifiedDeitySlow = false;
  for (let i = 0; i < 100; i++) {
    await delay(100);
    const slowStatus = await page.evaluate(() => {
      if (!window.combatManager) return null;
      const enemy = window.combatManager.fightersRight[0];
      if (!enemy) return null;
      return { inSwordArray: enemy.inSwordArray, speedMult: enemy.getSpeedMultiplier() };
    });

    if (slowStatus && slowStatus.inSwordArray) {
      console.log(`Guard in Zhuxian Sword Array. Speed multiplier: ${slowStatus.speedMult}`);
      if (Math.abs(slowStatus.speedMult - 0.1) < 0.001) {
        console.log('SUCCESS: Celestial Sword Deity slow multiplier is exactly 0.1!');
        verifiedDeitySlow = true;
        break;
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
  } else if (!verifiedTimeTravelerSlow) {
    console.error('Test FAILED: Time Traveler slow multiplier was not verified to be 0.5.');
    process.exit(1);
  } else if (!verifiedDeitySlow) {
    console.error('Test FAILED: Celestial Sword Deity slow multiplier was not verified to be 0.1.');
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

runTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
