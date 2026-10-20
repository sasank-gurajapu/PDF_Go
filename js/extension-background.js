/**
 * PDF_Go Chrome Extension - Background Service Worker
 * Opens PDF_Go in a new full browser tab when toolbar action is clicked.
 */

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});
