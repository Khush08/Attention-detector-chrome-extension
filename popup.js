var video = document.querySelector('#webcamVideo');
var eyes = 0;
var mouth = 0;
function setupCam() {
    navigator.mediaDevices.getUserMedia({
      video: true
    }).then(mediaStream => {
      video.srcObject = mediaStream;
    }).catch((error) => {
      console.warn(error);
    });
  }
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]).then(setupCam);
  function aspectRation(data){
    const [x0, y0] = Object.values(data[0]);
    const [x1, y1] = Object.values(data[1]) 
    const [x2, y2] = Object.values(data[2])
    const [x3, y3] = Object.values(data[3]) 
    const [x4, y4] = Object.values(data[4]);
    const [x5, y5] = Object.values(data[5]); 
    const a = Math.sqrt((x1-x5)*(x1-x5)+(y1-y5)*(y1-y5));
    const b = Math.sqrt((x2-x4)*(x2-x4)+(y2-y4)*(y2-y4));
    const c = Math.sqrt((x0-x3)*(x0-x3)+(y0-y3)*(y0-y3));
    const res = (a+b)/(2*c);
    return res;
  }
  
  function mouthDistance(data){
    const [x0, y0] = Object.values(data[13]);
    const [x1, y1] = Object.values(data[14]) 
    const [x2, y2] = Object.values(data[15])
    const [x3, y3] = Object.values(data[17]) 
    const [x4, y4] = Object.values(data[18]);
    const [x5, y5] = Object.values(data[19]); 
    const ux = (x0+x1+x2)/3;
    const uy = (y0+y2+y3)/3;
    const lx = (x3+x4+x5)/3;
    const ly = (y3+y4+y5)/3;
    const res = Math.sqrt((ux-lx)*(ux-lx)+(uy-ly)*(uy-ly));
    return res;
  }
  
  function processCoords(left, right, mouthCords){
  
    const lar = aspectRation(left);
    const rar = aspectRation(right);
    const ear = (lar+rar)/2;
    if(ear<0.34) eyes += 1;
    const lipdistance = mouthDistance(mouthCords);
    if(lipdistance>20) mouth += 1;
    console.log("lip "+lipdistance+ " ear "+ear);
  }
  
  setInterval(()=>{
    if(eyes>15 || mouth>5){
      document.getElementById('alertAudio').play();
    }
    eyes = 0;
    mouth = 0;
  }, 60000);
  
  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.getElementById("rightpane").append(canvas)
    const displaySize = { width: 200, height: 200 }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      if(detections['landmarks'] && detections['expressions']){
        var exp = detections['expressions'].asSortedArray()[0]['expression'];
        var prob = detections['expressions'].asSortedArray()[0]['probability'];
        prob = Math.floor(prob*100);
        var text = exp.toUpperCase() + " " + prob + "%";
        document.getElementById("mood").innerText = text;
        await processCoords(detections['landmarks'].getLeftEye(), detections['landmarks'].getRightEye(), detections['landmarks'].getMouth())
      }
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    }, 100);
  })
  
  