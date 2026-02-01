const API_BASE_URL = 'http://localhost:3000';

// UI Elements
const authStatusEl = document.getElementById('authStatus');
const loginPromptEl = document.getElementById('loginPrompt');
const exportSectionEl = document.getElementById('exportSection');
const exportBtn = document.getElementById('exportBtn');
const recheckBtn = document.getElementById('recheckBtn');
const progressEl = document.getElementById('progress');
const importProgressEl = document.getElementById('importProgress');
const statusEl = document.getElementById('status');

// Check authentication on popup load
checkAuthentication();

// Event listeners
exportBtn.addEventListener('click', handleExport);
recheckBtn.addEventListener('click', checkAuthentication);

async function checkAuthentication() {
    authStatusEl.textContent = 'Checking authentication...';
    authStatusEl.style.display = 'block';
    loginPromptEl.style.display = 'none';
    exportSectionEl.style.display = 'none';
    statusEl.textContent = '';
    statusEl.className = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/import`, {
            method: 'GET',
            credentials: 'include', // Important: include cookies
        });

        if (!response.ok) {
            throw new Error('Failed to check authentication');
        }

        const data = await response.json();

        if (data.authenticated) {
            authStatusEl.style.display = 'none';
            exportSectionEl.style.display = 'block';
        } else {
            authStatusEl.style.display = 'none';
            loginPromptEl.style.display = 'block';
        }
    } catch (err) {
        console.error('Auth check error:', err);
        authStatusEl.textContent = 'Error checking authentication. Is the app running?';
        authStatusEl.className = 'error';
    }
}

async function handleExport() {
    statusEl.textContent = 'Extracting bookmarks from browser...';
    statusEl.className = '';
    exportBtn.disabled = true;
    progressEl.style.display = 'block';
    importProgressEl.textContent = '';
    importProgressEl.className = '';

    try {
        // Step 1: Get bookmarks from browser
        const tree = await chrome.bookmarks.getTree();
        const bookmarks = [];

        function processNode(node, path = '') {
            if (node.url) {
                bookmarks.push({
                    title: node.title || 'Untitled',
                    url: node.url,
                    // We'll skip folder mapping for now and add all to root
                });
            }
            if (node.children) {
                node.children.forEach(child => processNode(child, path));
            }
        }

        tree.forEach(processNode);

        if (bookmarks.length === 0) {
            statusEl.textContent = 'No bookmarks found to export.';
            exportBtn.disabled = false;
            progressEl.style.display = 'none';
            return;
        }

        // Step 2: Import bookmarks to server
        importProgressEl.textContent = `Importing ${bookmarks.length} bookmarks...`;
        statusEl.textContent = `Found ${bookmarks.length} bookmarks. Importing...`;

        const importResponse = await fetch(`${API_BASE_URL}/api/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important: include cookies
            body: JSON.stringify({ bookmarks }),
        });

        if (!importResponse.ok) {
            if (importResponse.status === 401) {
                throw new Error('Authentication expired. Please log in again.');
            }
            throw new Error('Failed to import bookmarks');
        }

        const importResult = await importResponse.json();

        statusEl.textContent = `✓ Successfully imported ${importResult.count} bookmarks!`;
        statusEl.className = 'success';
        importProgressEl.textContent = 'Check the website to see metadata enrichment in progress.';

        exportBtn.disabled = false;

    } catch (err) {
        console.error('Export error:', err);
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className = 'error';
        exportBtn.disabled = false;
        progressEl.style.display = 'none';
    }
}
