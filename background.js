let extensionEnabled = false;

chrome.action.onClicked.addListener(async (tab) => {
    extensionEnabled = true;
    if (extensionEnabled) {
        await chrome.scripting.insertCSS({
            target: {tabId: tab.id},
            files: ["popup.css"]
        });

        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content_script.js']
        });
    }
});