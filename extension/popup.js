// Default to production URL; override via chrome.storage.local.set({ apiBaseUrl: '...' })
let API_BASE_URL = "https://bukmark.vercel.app";
let APP_URL = "https://bukmark.vercel.app";

// Initialize: read storage overrides, then check auth
(async function init() {
  if (typeof chrome !== "undefined" && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(["apiBaseUrl", "appUrl"]);
      if (result.apiBaseUrl) API_BASE_URL = result.apiBaseUrl;
      if (result.appUrl) APP_URL = result.appUrl;
    } catch (e) {
      // storage unavailable — keep defaults
    }
  }

  // UI Elements
  const authStatusEl = document.getElementById("authStatus");
  const loginPromptEl = document.getElementById("loginPrompt");
  const exportSectionEl = document.getElementById("exportSection");
  const savePageBtn = document.getElementById("savePageBtn");
  const savePageHint = document.getElementById("savePageHint");
  const exportBtn = document.getElementById("exportBtn");
  const recheckBtn = document.getElementById("recheckBtn");
  const openAppLinks = document.querySelectorAll(".open-app-link");
  const progressEl = document.getElementById("progress");
  const importProgressEl = document.getElementById("importProgress");
  const statusEl = document.getElementById("status");

  // Event listeners
  if (savePageBtn) savePageBtn.addEventListener("click", handleSavePage);
  if (exportBtn) exportBtn.addEventListener("click", handleExport);
  if (recheckBtn) recheckBtn.addEventListener("click", checkAuthentication);
  openAppLinks.forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(APP_URL, "_blank");
    }),
  );

  // Check authentication after storage is ready
  checkAuthentication();

  async function checkAuthentication() {
    if (authStatusEl) {
      authStatusEl.textContent = "Checking authentication...";
      authStatusEl.style.display = "block";
      authStatusEl.className = "card";
    }
    if (loginPromptEl) loginPromptEl.style.display = "none";
    if (exportSectionEl) exportSectionEl.style.display = "none";
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "status";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/import`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to check authentication");
      }

      const data = await response.json();

      if (data.authenticated) {
        if (authStatusEl) authStatusEl.style.display = "none";
        if (exportSectionEl) exportSectionEl.style.display = "block";
        updateSavePageButtonState();
      } else {
        if (authStatusEl) authStatusEl.style.display = "none";
        if (loginPromptEl) loginPromptEl.style.display = "block";
      }
    } catch (err) {
      console.error("Auth check error:", err);
      if (authStatusEl) {
        authStatusEl.textContent =
          "Can't reach the app. Check that it's open and try again.";
        authStatusEl.className = "card error";
      }
    }
  }

  function isInternalTabUrl(url) {
    if (!url) return true;
    return (
      url.startsWith("chrome://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url.startsWith("chrome-extension://")
    );
  }

  async function updateSavePageButtonState() {
    if (!savePageBtn || !savePageHint) return;
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || isInternalTabUrl(tab.url)) {
        savePageBtn.disabled = true;
        savePageHint.textContent = "Can't save this page";
        savePageHint.style.display = "block";
      } else {
        savePageBtn.disabled = false;
        savePageHint.style.display = "none";
      }
    } catch {
      savePageBtn.disabled = true;
      savePageHint.textContent = "Can't save this page";
      savePageHint.style.display = "block";
    }
  }

  async function handleSavePage() {
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = "status";
    }
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url || isInternalTabUrl(tab.url)) {
        if (statusEl) {
          statusEl.textContent = "Can't save this page.";
          statusEl.className = "status error";
        }
        return;
      }
      if (savePageBtn) savePageBtn.disabled = true;
      if (statusEl) statusEl.textContent = "Saving...";

      const response = await fetch(`${API_BASE_URL}/api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookmarks: [
            { title: tab.title || tab.url || "Untitled", url: tab.url },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (statusEl) {
            statusEl.textContent = "Please log in again.";
            statusEl.className = "status error";
          }
          return;
        }
        throw new Error("Failed to save");
      }
      const data = await response.json();
      if (statusEl) {
        if (data.count === 0) {
          statusEl.textContent = "Already saved.";
          statusEl.className = "status success";
        } else {
          statusEl.textContent = "Saved.";
          statusEl.className = "status success";
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      if (statusEl) {
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className = "status error";
      }
    } finally {
      if (savePageBtn) savePageBtn.disabled = false;
      updateSavePageButtonState();
    }
  }

  /**
   * Walk Chrome bookmark tree and collect folders and bookmarks with hierarchy.
   * Skips root node (id "0"). parentChromeId is null when parent is root.
   */
  function collectFoldersAndBookmarks(tree) {
    const folders = [];
    const bookmarks = [];
    const root = tree[0];
    if (!root || !root.children) return { folders, bookmarks };

    function walk(node, parentChromeId) {
      if (node.url) {
        bookmarks.push({
          title: node.title || "Untitled",
          url: node.url,
          folderId: parentChromeId,
        });
      } else {
        if (node.id !== "0" && node.title !== undefined) {
          folders.push({
            id: node.id,
            name: node.title || "Unnamed",
            parentId: parentChromeId,
          });
        }
        const nextParent = node.id === "0" ? null : node.id;
        for (const child of node.children || []) {
          walk(child, nextParent);
        }
      }
    }

    for (const child of root.children) {
      walk(child, null);
    }
    return { folders, bookmarks };
  }

  async function handleExport() {
    if (statusEl) {
      statusEl.textContent = "Extracting bookmarks from browser...";
      statusEl.className = "";
    }
    if (exportBtn) exportBtn.disabled = true;
    if (progressEl) progressEl.style.display = "block";
    if (importProgressEl) {
      importProgressEl.textContent = "";
      importProgressEl.className = "";
    }

    try {
      const tree = await chrome.bookmarks.getTree();
      const { folders, bookmarks } = collectFoldersAndBookmarks(tree);

      if (bookmarks.length === 0) {
        if (statusEl) {
          statusEl.textContent =
            "No browser bookmarks to import. You can still save this page.";
          statusEl.className = "status";
        }
        if (exportBtn) exportBtn.disabled = false;
        if (progressEl) progressEl.style.display = "none";
        return;
      }

      if (importProgressEl)
        importProgressEl.textContent = `Importing ${folders.length} folders, ${bookmarks.length} bookmarks...`;
      if (statusEl)
        statusEl.textContent = `Found ${bookmarks.length} bookmarks. Importing...`;

      const importResponse = await fetch(`${API_BASE_URL}/api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folders, bookmarks }),
      });

      if (!importResponse.ok) {
        if (importResponse.status === 401) {
          throw new Error("Authentication expired. Please log in again.");
        }
        throw new Error("Failed to import bookmarks");
      }

      const importResult = await importResponse.json();
      const createdCount = Number(importResult.count || 0);
      const movedCount = Number(importResult.movedCount || 0);
      const createdLabel = `${createdCount} bookmark${createdCount === 1 ? "" : "s"}`;
      const movedLabel = `${movedCount} existing bookmark${movedCount === 1 ? "" : "s"}`;

      if (statusEl) {
        if (createdCount === 0 && movedCount > 0) {
          statusEl.textContent = `Moved ${movedLabel}.`;
        } else if (movedCount > 0) {
          statusEl.textContent = `Imported ${createdLabel}, moved ${movedLabel}.`;
        } else {
          statusEl.textContent = `Successfully imported ${createdLabel}!`;
        }
        statusEl.className = "status success";
      }
      if (importProgressEl)
        importProgressEl.textContent =
          "Check the website to see metadata enrichment in progress.";

      if (exportBtn) exportBtn.disabled = false;
      if (progressEl) progressEl.style.display = "none";
    } catch (err) {
      console.error("Export error:", err);
      if (statusEl) {
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className = "status error";
      }
      if (exportBtn) exportBtn.disabled = false;
      if (progressEl) progressEl.style.display = "none";
    }
  }
})();
