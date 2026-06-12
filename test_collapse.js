const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:8085/index.html', { waitUntil: 'networkidle0' });

  // Try to click a category header
  const isCollapsedBefore = await page.evaluate(() => {
    const header = document.querySelector('.category-header');
    header.click();
    return document.querySelector('.char-category').classList.contains('collapsed');
  });
  
  console.log("Is collapsed after click:", isCollapsedBefore);
  
  const displayVal = await page.evaluate(() => {
    const content = document.querySelector('.char-category.collapsed .category-content');
    return content ? window.getComputedStyle(content).display : 'NOT FOUND';
  });
  
  console.log("Display value:", displayVal);

  await browser.close();
})();
