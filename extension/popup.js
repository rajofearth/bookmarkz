document.getElementById('exportBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Exporting...';
    statusEl.className = '';

    try {
        // Get the entire bookmark tree
        const tree = await chrome.bookmarks.getTree();

        // Flatten and format bookmarks
        const bookmarks = [];

        function processNode(node) {
            if (node.url) {
                bookmarks.push({
                    id: node.id, // Use browser ID or maybe prefix it?
                    title: node.title,
                    url: node.url,
                    folderId: 'all', // For now, put everything in 'all' or mapped ID? 
                    // Note: The app expects 'favicon' and 'ogImage' but those are optional.
                    createdAt: node.dateAdded ? new Date(node.dateAdded).toISOString() : new Date().toISOString()
                });
            }
            if (node.children) {
                node.children.forEach(processNode);
            }
        }

        tree.forEach(processNode);

        if (bookmarks.length === 0) {
            statusEl.textContent = 'No bookmarks found to export.';
            return;
        }

        // Send to API
        const response = await fetch('http://localhost:3000/api/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookmarks }),
        });

        if (response.ok) {
            const result = await response.json();
            statusEl.textContent = `Success! Exported ${result.count} bookmarks.`;
            statusEl.className = 'success';
        } else {
            throw new Error('Server responded with error');
        }
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Failed to export. Is the app running?';
        statusEl.className = 'error';
    }
});
