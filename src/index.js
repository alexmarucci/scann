import { setupFrameStream, setupVideoStream } from './utils/services.js';
/* import {loadModel} from './ml.js'; */
/* import {detectVideo} from './utils/detect.js'; */
import { highlightPaper } from '../scanner.js';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

async function main() {
  const { video } = await setupVideoStream();
  /* const model = await loadModel(); */
  /* detectVideo(video, model, result); */

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let count = 0;
  const stop = setupFrameStream((img) => {
    if (!img.width) return;

    ctx.clearRect(0, 0, img.width, img.height);
    highlightPaper(img, null, ctx);
  }, 2000);

  document.body.append(video);
  document.body.append(canvas);
};
main();
