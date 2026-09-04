import fs from 'fs';

let content = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Replace handleInitiateGoogleSync and handleExecuteGoogleSync
content = content.replace(/const handleInitiateGoogleSync[\s\S]*?setIsConfirmSyncOpen\(false\);\n    }\n  };/, `
  const handleInitiateGoogleSync = () => {
    if (!googleSheetsState.spreadsheetUrl || !googleSheetsState.spreadsheetUrl.startsWith('https://script.google.com/')) {
      setUrlUpdateMessage('⚠️ Please enter a valid Google Apps Script Web App URL below first.');
      return;
    }
    setIsConfirmSyncOpen(true);
  };

  const handleExecuteGoogleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const webAppUrl = googleSheetsState.spreadsheetUrl;
      if (!webAppUrl) throw new Error("No Web App URL configured");
      
      const payload = {
        students,
        exams,
        marks,
        subjectsMap,
      };

      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });
      
      onUpdateGoogleSheetsState({
        isConnected: true,
        spreadsheetUrl: webAppUrl,
        lastSyncedAt: new Date().toLocaleTimeString(),
        syncInProgress: false,
        error: null,
      });

      setSyncStatusMessage('✓ Successfully pushed all local database records to Google Sheets via Webhook!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Webhook synchronization failed.';
      setSyncStatusMessage(\`Sync error: \${msg}\`);
      onUpdateGoogleSheetsState({ error: msg });
    } finally {
      setIsSyncing(false);
      setIsConfirmSyncOpen(false);
    }
  };
`);

// Replace handleSaveSheetUrl
content = content.replace(/const handleSaveSheetUrl[\s\S]*?setTimeout\(\(\) => setUrlUpdateMessage\(null\), 4500\);\n  };/, `
  const handleSaveSheetUrl = () => {
    if (!sheetUrlInput.trim()) {
      setUrlUpdateMessage('Please enter a Web App URL.');
      return;
    }
    const cleanUrl = sheetUrlInput.trim();
    saveLinkedSheetId(cleanUrl); // we just overload this helper to save the URL
    onUpdateGoogleSheetsState({
      spreadsheetUrl: cleanUrl,
      spreadsheetId: cleanUrl, // overload
      isConnected: true,
      error: null,
    });
    setSheetUrlInput(cleanUrl);
    setUrlUpdateMessage(\`✓ Web App URL updated & saved!\`);
    setTimeout(() => setUrlUpdateMessage(null), 4500);
  };
`);

// Replace Google Sheets Integration Card UI
content = content.replace(/Google Sheets Database Synchronization[\s\S]*?Maintains 5 connected sheets.*?<\/p>/, `
Google Sheets Webhook Synchronization</h3>
<p className="text-xs text-slate-500 max-w-xl mt-0.5">
  Connect permanently to Google Sheets without OAuth! Deploy a Google Apps Script Web App that accepts POST requests, and paste the URL here.
</p>
`);

// Replace input placeholder and labels
content = content.replace(/Update Connected Google Sheet URL or ID:/, "Update Connected Google Apps Script Web App URL:");
content = content.replace(/placeholder="Paste full Google Sheet URL .*?"/, 'placeholder="Paste full Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec)"');

// Remove Auto-Sync button (since it's a one-way webhook for now, or keep it disabled)
content = content.replace(/<button\n\s*type="button"\n\s*id="teacher-auto-sync-pull-btn"[\s\S]*?<\/button>/, '');
content = content.replace(/Tip: You can paste the complete browser link from your Google Sheet. It auto-parses the ID and updates all persistence channels./, 'Tip: Deploy an Apps Script that handles POST requests to write to your Sheet, and paste the Web App URL here.');
content = content.replace(/Active ID:/, 'Active Webhook:');
content = content.replace(/{googleSheetsState\.spreadsheetId \? 'Sync Updates to Sheets' : 'Create & Sync Sheets DB'}/, "{googleSheetsState.spreadsheetUrl ? 'Sync Updates to Sheets' : 'Setup Webhook'}");

fs.writeFileSync('src/components/TeacherDashboard.tsx', content, 'utf8');
