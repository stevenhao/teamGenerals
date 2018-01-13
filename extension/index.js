var s = document.createElement('script');
// TODO: add "script.js" to web_accessible_resources in manifest.json
s.src = chrome.extension.getURL('bundle.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

var l = document.createElement('link');
l.rel = 'stylesheet';
// TODO: add "script.js" to web_accessible_resources in manifest.json
l.href = chrome.extension.getURL('index.css');
(document.head || document.documentElement).appendChild(l);
