const video = document.getElementById("video");
const street = document.getElementById("street");
const speedDiv = document.getElementById("speed");
const speedLimit = document.getElementById("speedLimit");

navigator.geolocation.getCurrentPosition(getSpeedlimit);

function getSpeedlimit(position) {
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  const speed = position.coords.speed;
  const resp = httpGet(
    `https://atlas.microsoft.com/search/address/reverse/json?query=${lat},${long}&returnSpeedLimit=True&subscription-key=zqlUk9tcyTyRyycwex7Kqfmdm-ym0PQ_RMG2Aws3hmw`
  );
  console.log(position);
  const address = JSON.parse(resp).addresses[0].address;
  street.innerText = JSON.stringify(address);
  speedLimit.innerText = JSON.stringify(address.speedLimit);
  if (speed === null || speed === undefined) {
  } else {
    speedDiv.innerText = speed;
  }
}

Promise.all([
  faceapi.nets.ageGenderNet.loadFromUri("./ models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./ models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./ models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("./ models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./ models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("./ models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("./ models"),
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    // faceapi.draw.BoxWithText(canvas, resizedDetections, 'some text');

    // result.innerText = "";
  }, 50);
});

function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}
