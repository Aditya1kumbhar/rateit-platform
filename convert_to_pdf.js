const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

// Simple Markdown to HTML parser
function mdToHtml(md) {
  let html = md
    // Headers
    .replace(/^# (.*$)/gim, '<h1 id="$1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 id="$1">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 id="$1">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 id="$1">$1</h4>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Bold & Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Inline Code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // HR
    .replace(/^---$/gim, '<hr>');

  // Process code blocks
  html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre><code>${p1.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });

  // Process tables
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  let resultLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes(':---') || line.includes('---:')) {
        continue; // Skip header separator
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!inTable) {
        inTable = true;
        tableHtml = '<table><thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHtml += '</tbody></table>';
        resultLines.push(tableHtml);
        tableHtml = '';
      }
      resultLines.push(line);
    }
  }
  if (inTable) {
    tableHtml += '</tbody></table>';
    resultLines.push(tableHtml);
  }

  // Wrap paragraphs
  return resultLines.map(line => {
    if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<table') || line.startsWith('<pre') || line.startsWith('<hr') || line === '') {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('\n');
}

async function main() {
  const mdPath = path.join(__dirname, 'hackathon_submission_document.md');
  const pdfPath = path.join(__dirname, 'hackathon_submission_document.pdf');
  const mdText = fs.readFileSync(mdPath, 'utf-8');

  const bodyHtml = mdToHtml(mdText);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RateIT Hackathon Submission Document</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-top: 30px;
      margin-bottom: 20px;
      page-break-before: always;
    }

    h1:first-of-type {
      page-break-before: avoid;
    }

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    p {
      margin-bottom: 14px;
      font-size: 14px;
      color: #334155;
    }

    blockquote {
      background: #f8fafc;
      border-left: 4px solid #4f46e5;
      margin: 16px 0;
      padding: 12px 16px;
      font-style: italic;
      color: #475569;
      border-radius: 0 6px 6px 0;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12.5px;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 30px 0;
    }

    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  console.log('Launching browser via Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(fullHtml, { waitUntil: 'networkidle' });
  
  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    },
    printBackground: true,
  });

  await browser.close();
  console.log('PDF successfully created at: ' + pdfPath);
}

main().catch(err => {
  console.error('Error converting PDF:', err);
  process.exit(1);
});
