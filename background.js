chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason.search(/install/g) === -1) {
      return;
    }
    chrome.tabs.create({
      url: chrome.extension.getURL('welcome.html'),
      active: true
    });
  });

  const vid = document.querySelector('#webcamVideo');

// Setup webcam
async function setupCam() {
  navigator.mediaDevices.getUserMedia({
    video: true
  }).then(mediaStream => {
    vid.srcObject = mediaStream;
  }).catch((error) => {
    console.warn(error);
  });
}

// If cam acecss has already been granted to this extension, setup webcam.
chrome.storage.local.get('camAccess', items => {
  if (!!items['camAccess']) {
    console.log('cam access already exists');
    setupCam();
  }
});

// If cam acecss gets granted to this extension, setup webcam.
chrome.storage.onChanged.addListener((changes, namespace) => {
  if ('camAccess' in changes) {
    console.log('cam access granted');
    setupCam();
  }
});