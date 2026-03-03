(() => {
  if (window.__bukmarksExtensionBridgeInstalled) {
    return;
  }

  window.__bukmarksExtensionBridgeInstalled = true;

  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    const data = event.data;
    if (!data || data.type !== "BUKMARKS_EXTENSION_PING") {
      return;
    }

    window.postMessage(
      {
        type: "BUKMARKS_EXTENSION_PONG",
        source: "bukmarks-extension",
      },
      "*",
    );
  });
})();
