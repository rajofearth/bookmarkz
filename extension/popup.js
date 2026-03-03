const DEFAULT_APP_URL = "https://bukmarks.vercel.app";
const INTERNAL_PROTOCOLS = [
  "chrome://",
  "edge://",
  "about:",
  "chrome-extension://",
  "moz-extension://",
];

let API_BASE_URL = DEFAULT_APP_URL;
let APP_URL = DEFAULT_APP_URL;

async function init() {
  await loadBaseUrls();

  const authStatusEl = document.getElementById("authStatus");
  const loginPromptEl = document.getElementById("loginPrompt");
  const exportSectionEl = document.getElementById("exportSection");
  const loginBtn = document.getElementById("loginBtn");
  const savePageBtn = document.getElementById("savePageBtn");
  const savePageHint = document.getElementById("savePageHint");
  const exportBtn = document.getElementById("exportBtn");
  const recheckBtn = document.getElementById("recheckBtn");
  const openAppLinks = document.querySelectorAll(".open-app-link");
  const progressEl = document.getElementById("progress");
  const importProgressEl = document.getElementById("importProgress");
  const statusEl = document.getElementById("status");

  loginBtn?.addEventListener("click", () => {
    window.open(`${APP_URL}/auth`, "_blank");
  });
  savePageBtn?.addEventListener("click", handleSavePage);
  exportBtn?.addEventListener("click", handleExport);
  recheckBtn?.addEventListener("click", checkAuthentication);

  openAppLinks.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      window.open(APP_URL, "_blank");
    });
  });

  await checkAuthentication();

  async function checkAuthentication() {
    if (authStatusEl) {
      authStatusEl.textContent = "Checking authentication...";
      authStatusEl.style.display = "block";
      authStatusEl.className = "card";
    }

    if (loginPromptEl) {
      loginPromptEl.style.display = "none";
    }

    if (exportSectionEl) {
      exportSectionEl.style.display = "none";
    }

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
        if (response.status === 403) {
          throw new Error("Extension origin is not allowed by this app.");
        }
        throw new Error("Failed to check authentication.");
      }

      const data = await response.json();

      if (data.authenticated) {
        if (authStatusEl) {
          authStatusEl.style.display = "none";
        }
        if (exportSectionEl) {
          exportSectionEl.style.display = "block";
        }
        await updateSavePageButtonState();
      } else {
        if (authStatusEl) {
          authStatusEl.style.display = "none";
        }
        if (loginPromptEl) {
          loginPromptEl.style.display = "block";
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      if (authStatusEl) {
        authStatusEl.textContent = toErrorMessage(error);
        authStatusEl.className = "card error";
      }
    }
  }

  function isInternalTabUrl(url) {
    if (!url) {
      return true;
    }

    return INTERNAL_PROTOCOLS.some((protocol) => url.startsWith(protocol));
  }

  async function updateSavePageButtonState() {
    if (!savePageBtn || !savePageHint) {
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || isInternalTabUrl(tab.url)) {
        savePageBtn.disabled = true;
        savePageHint.textContent = "This tab cannot be saved.";
        savePageHint.style.display = "block";
        return;
      }

      savePageBtn.disabled = false;
      savePageHint.style.display = "none";
    } catch (error) {
      console.error("Tab state error:", error);
      savePageBtn.disabled = true;
      savePageHint.textContent = "This tab cannot be saved.";
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
          statusEl.textContent = "This page cannot be saved.";
          statusEl.className = "status error";
        }
        return;
      }

      if (savePageBtn) {
        savePageBtn.disabled = true;
      }

      if (statusEl) {
        statusEl.textContent = "Saving...";
      }

      const response = await fetch(`${API_BASE_URL}/api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookmarks: [{ title: tab.title || tab.url, url: tab.url }],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Sign in again.");
        }
        if (response.status === 403) {
          throw new Error("Extension origin is not allowed by this app.");
        }
        throw new Error("Failed to save this page.");
      }

      const data = await response.json();

      if (statusEl) {
        statusEl.textContent = data.count === 0 ? "Already saved." : "Saved.";
        statusEl.className = "status success";
      }
    } catch (error) {
      console.error("Save error:", error);
      if (statusEl) {
        statusEl.textContent = toErrorMessage(error);
        statusEl.className = "status error";
      }
    } finally {
      if (savePageBtn) {
        savePageBtn.disabled = false;
      }
      await updateSavePageButtonState();
    }
  }

  function collectFoldersAndBookmarks(tree) {
    const folders = [];
    const bookmarks = [];
    const root = tree[0];

    if (!root || !root.children) {
      return { folders, bookmarks };
    }

    function walk(node, parentChromeId) {
      if (node.url) {
        bookmarks.push({
          title: node.title || "Untitled",
          url: node.url,
          folderId: parentChromeId,
        });
        return;
      }

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

    for (const child of root.children) {
      walk(child, null);
    }

    return { folders, bookmarks };
  }

  async function handleExport() {
    if (statusEl) {
      statusEl.textContent = "Reading browser bookmarks...";
      statusEl.className = "status";
    }

    if (exportBtn) {
      exportBtn.disabled = true;
    }

    if (progressEl) {
      progressEl.style.display = "block";
    }

    if (importProgressEl) {
      importProgressEl.textContent = "";
      importProgressEl.className = "status";
    }

    try {
      const tree = await chrome.bookmarks.getTree();
      const { folders, bookmarks } = collectFoldersAndBookmarks(tree);

      if (bookmarks.length === 0) {
        if (statusEl) {
          statusEl.textContent = "No browser bookmarks found.";
          statusEl.className = "status";
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = `Importing ${bookmarks.length} bookmarks...`;
      }

      if (importProgressEl) {
        importProgressEl.textContent = `${folders.length} folders detected.`;
      }

      const response = await fetch(`${API_BASE_URL}/api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folders, bookmarks }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Sign in again.");
        }
        if (response.status === 403) {
          throw new Error("Extension origin is not allowed by this app.");
        }
        throw new Error("Failed to import bookmarks.");
      }

      const data = await response.json();
      const createdCount = Number(data.count || 0);
      const movedCount = Number(data.movedCount || 0);
      const createdLabel = `${createdCount} bookmark${createdCount === 1 ? "" : "s"}`;
      const movedLabel = `${movedCount} bookmark${movedCount === 1 ? "" : "s"}`;

      if (statusEl) {
        if (createdCount === 0 && movedCount > 0) {
          statusEl.textContent = `Moved ${movedLabel}.`;
        } else if (movedCount > 0) {
          statusEl.textContent = `Imported ${createdLabel}, moved ${movedLabel}.`;
        } else {
          statusEl.textContent = `Imported ${createdLabel}.`;
        }
        statusEl.className = "status success";
      }

      if (importProgressEl) {
        importProgressEl.textContent =
          "Metadata enrichment continues in Bukmarks.";
      }
    } catch (error) {
      console.error("Import error:", error);
      if (statusEl) {
        statusEl.textContent = toErrorMessage(error);
        statusEl.className = "status error";
      }
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
      }

      if (progressEl) {
        progressEl.style.display = "none";
      }
    }
  }
}

async function loadBaseUrls() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(["apiBaseUrl", "appUrl"]);
    if (result.apiBaseUrl) {
      API_BASE_URL = normalizeBaseUrl(result.apiBaseUrl);
    }
    if (result.appUrl) {
      APP_URL = normalizeBaseUrl(result.appUrl);
      API_BASE_URL = normalizeBaseUrl(result.apiBaseUrl || result.appUrl);
    }
  } catch (error) {
    console.error("Storage load error:", error);
  }
}

function normalizeBaseUrl(url) {
  return String(url).trim().replace(/\/+$/, "");
}

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

void init();
