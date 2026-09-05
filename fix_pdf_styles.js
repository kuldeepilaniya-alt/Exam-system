const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf8');

// Update font family to use standard crisp system fonts for better html2canvas rendering
code = code.replace(
  /fontFamily = "'.*?", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"/g,
  'fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif"'
);

// Remove monospace font as it often has different baseline metrics causing vertical alignment issues in html2canvas
code = code.replace(/font-family:\s*monospace;/g, 'font-weight: 700;'); 

// Add a standard line-height to table cells to help html2canvas calculate baseline correctly
code = code.replace(/vertical-align:\s*middle;/g, 'vertical-align: middle; line-height: 1.5;');

// Ensure padding is generous enough
code = code.replace(/padding:\s*([0-9.]+)px ([0-9.]+)px;/g, (match, p1, p2) => {
  const topBot = Math.max(parseFloat(p1), 8);
  return `padding: ${topBot}px ${p2}px;`;
});

fs.writeFileSync('src/utils/pdfGenerator.ts', code);
