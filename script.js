const video = document.getElementById("video");
const street = document.getElementById("street");
const speedDiv = document.getElementById("speed");
const speedLimit = document.getElementById("speedLimit");

let facematcher;
let labeledFaceDescriptors;

navigator.geolocation.getCurrentPosition(getSpeedlimit);

Promise.all([
  faceapi.nets.ageGenderNet.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("https://darthratz.github.io/Face-Detection-JavaScript/models"),
]).then(startVideo);

async function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
  labeledFaceDescriptors = await loadLabeledImages();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
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
      .withFaceDescriptors()
      .withFaceExpressions()
      .withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
    navigator.geolocation.getCurrentPosition(getSpeedlimit);
  }, 5000);
});

function httpGet(theUrl) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, false); // false for synchronous request
  xmlHttp.send(null);
  return xmlHttp.responseText;
}

function getSpeedlimit(position) {
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  const speed = position.coords.speed;
  const resp = httpGet(`https://atlas.microsoft.com/search/address/reverse/json?query=${lat},${long}&returnSpeedLimit=True&subscription-key=zqlUk9tcyTyRyycwex7Kqfmdm-ym0PQ_RMG2Aws3hmw`);
  console.log(position);
  const address = JSON.parse(resp).addresses[0].address;
  street.innerText = `Street Name: ${JSON.stringify(address.streetName)}`;
  speedLimit.innerText = `Speed Limit: ${JSON.stringify(address.speedLimit)}`;
  if (!(speed === null || speed === undefined)) {
    speedDiv.innerText = `Speed: ${speed}`;
  }
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark', 'Mick'];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `people/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

