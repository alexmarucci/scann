import { detectVideo } from './utils/detect.js';
import { setupVideoStream, drawFrame } from './utils/services.js';
import {loadModel} from './ml.js';

async function main() {
  const { video } = await setupVideoStream();

  // wait to opencv to load
  await timer(3000);
  const model = await loadModel();


  const canvas = drawFrame()

  detectVideo(video, model, canvas);
  /* const r = highlightPaper(img); */
  /* document.body.append(r); */
  document.body.append(video);
  document.body.append(canvas);
}
main();

function waitForImageToLoad(img) {
  return new Promise((resolve) => {
    img.onload = () => resolve(img);
  });
}

function timer(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

// load image
// use opencv to filter the image, resize, b&w + area of interest
// use ML to segment the image
// use opencv crop to adjust the image
// (optional) enhance to HD
