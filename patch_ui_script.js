import fs from 'fs';

let content = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

const appsScriptSnippet = `
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Example: just write raw JSON or process it
  // You can expand this to write to multiple tabs
  sheet.getRange(1, 1).setValue("Last Synced: " + new Date());
  sheet.getRange(2, 1).setValue(JSON.stringify(data));
  
  return ContentService.createTextOutput(JSON.stringify({"status":"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
`.trim();

const UI_ADDITION = `
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-xs font-bold text-slate-900 mb-2">Google Apps Script Web App Code (doPost)</h4>
            <p className="text-[10px] text-slate-500 mb-2">Copy this into your Google Sheet's Apps Script editor (Extensions &gt; Apps Script), deploy as a Web App (Access: Anyone), and paste the URL above.</p>
            <textarea readOnly className="w-full h-32 p-2 text-[10px] font-mono text-slate-700 bg-white border border-slate-200 rounded-lg outline-none" defaultValue={\`${appsScriptSnippet}\`} />
          </div>
`;

content = content.replace(/(<label className="block text-\[10px\] font-black uppercase tracking-widest text-slate-400 mb-1\.5">)/, UI_ADDITION + "\n$1");

fs.writeFileSync('src/components/TeacherDashboard.tsx', content, 'utf8');
