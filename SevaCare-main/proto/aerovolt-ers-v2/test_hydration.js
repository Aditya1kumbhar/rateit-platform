const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let hasErrors = false;
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Hydration errors often mention "Maximum update depth exceeded" or "Hydration failed" or "A tree hydrated but"
      console.error(`Browser Error: ${text}`);
      hasErrors = true;
    }
  });

  page.on('pageerror', err => {
    console.error(`Page Error: ${err.toString()}`);
    hasErrors = true;
  });

  try {
    console.log('Navigating to http://localhost:3000/dashboard');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // wait an extra 2 seconds to make sure any client-side rendering issues show up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (hasErrors) {
      console.log('\n[RESULT] Errors detected during rendering.');
      process.exit(1);
    } else {
      console.log('\n[RESULT] No errors detected! Dashboard rendered smoothly.');
      process.exit(0);
    }
  } catch (error) {
    console.error(`Navigation Error: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
