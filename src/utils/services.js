const video = document.createElement('video');
video.setAttribute('playsinline', '');
video.setAttribute('autoplay', '');
video.setAttribute('muted', '');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

export async function setupVideoStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {     facingMode: 'environment'}
    });
    video.srcObject = stream;
    /* video.src = URL.createObjectURL(stream); */
  } catch (err) {
    console.error('Error accessing camera:', err);
  }

  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve({ video });
  });
}

export function drawOverlay() {
  const canvas = document.getElementById('overlay');

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function captureFrame() {
  const imageData = canvas.toDataURL('image/jpeg');

  return imageData;
}

function updateSize() {
  if (
    video.videoWidth !== canvas.width ||
    video.videoHeight !== canvas.height
  ) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
}

export function drawFrame() {
  updateSize();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas;
}

export function setupFrameStream(callback, frameRate = 200) {
  const id = setInterval(() => {
    drawFrame();
    if (callback) callback(canvas);
  }, frameRate);

  return () => clearInterval(id);
}
