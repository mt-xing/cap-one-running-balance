chrome.tabs.onUpdated.addListener((tabId, changeInfo, _) => {
    if (changeInfo.url) {
        console.log('Sending message');
        chrome.tabs.sendMessage(tabId, {
            message: 'changedUrl',
            url: changeInfo.url
        })
    }
});