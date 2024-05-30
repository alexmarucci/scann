import cv from '@techstark/opencv-js';

const distance = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

const canvas = () => document.querySelector('body > canvas');

// Write a function that renders cv.Mat into a canvas
function renderImage(mat) {
  cv.imshow(canvas(), mat);
}

function grabCut(img) {
  const [width, height] = img.matSize;
  const bgdModel = new cv.Mat();
  const fgdModel = new cv.Mat();
  const border = 50
  const rect = new cv.Rect(border, border, width - border, height - border);
  const mask = new cv.Mat.zeros(width, height, cv.CV_8UC1);

  cv.grabCut(img, mask, rect, bgdModel, fgdModel, 1, cv.GC_INIT_WITH_RECT);

  for (let i = 0; i < img.rows; i++) {
      for (let j = 0; j < img.cols; j++) {
          if (mask.ucharPtr(i, j)[0] == 0 || mask.ucharPtr(i, j)[0] == 2) {
              img.ucharPtr(i, j)[0] = 0;
              img.ucharPtr(i, j)[1] = 0;
              img.ucharPtr(i, j)[2] = 0;
          }
      }
  }
}

export function findPaperContour(img) {
  cv.cvtColor(img, img, cv.COLOR_RGBA2RGB, 0);

  grabCut(img)

  const imgGray = new cv.Mat();
  cv.cvtColor(img, imgGray, cv.COLOR_RGB2GRAY);

  const imgBlur = new cv.Mat();
  cv.GaussianBlur(imgGray, imgBlur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  const imgThresh = new cv.Mat();
  cv.threshold(imgBlur, imgThresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  // Render the base B&W image
  /* renderImage(imgThresh) */

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    imgThresh,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_NONE
  );
  let maxArea = 0;
  let maxContourIndex = -1;
  for (let i = 0; i < contours.size(); ++i) {
    let contourArea = cv.contourArea(contours.get(i));
    if (contourArea > maxArea) {
      maxArea = contourArea;
      maxContourIndex = i;
    }
  }

  const maxContour = contours.get(maxContourIndex);

  imgGray.delete();
  imgBlur.delete();
  imgThresh.delete();
  contours.delete();
  hierarchy.delete();

  return maxContour;
}

export function highlightPaper(image, options, ctx) {
  options = options || {};
  options.color = options.color || 'orange';
  options.thickness = options.thickness || 10;
  const img = cv.imread(image);

  const maxContour = findPaperContour(img);
  if (maxContour) {
    const {
      topLeftCorner,
      topRightCorner,
      bottomLeftCorner,
      bottomRightCorner,
    } = getCornerPoints(maxContour, img);

    if (
      topLeftCorner &&
      topRightCorner &&
      bottomLeftCorner &&
      bottomRightCorner
    ) {
      ctx.strokeStyle = options.color;
      ctx.lineWidth = options.thickness;
      ctx.beginPath();
      ctx.moveTo(...Object.values(topLeftCorner));
      ctx.lineTo(...Object.values(topRightCorner));
      ctx.lineTo(...Object.values(bottomRightCorner));
      ctx.lineTo(...Object.values(bottomLeftCorner));
      ctx.lineTo(...Object.values(topLeftCorner));
      ctx.stroke();
    }
  }

  img.delete();
  return canvas;
}

export function extractPaper(image, resultWidth, resultHeight, cornerPoints) {
  const canvas = document.createElement('canvas');

  const img = cv.imread(image);

  const maxContour = findPaperContour(img);

  const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } =
    cornerPoints || getCornerPoints(maxContour, img);
  let warpedDst = new cv.Mat();

  let dsize = new cv.Size(resultWidth, resultHeight);
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    topLeftCorner.x,
    topLeftCorner.y,
    topRightCorner.x,
    topRightCorner.y,
    bottomLeftCorner.x,
    bottomLeftCorner.y,
    bottomRightCorner.x,
    bottomRightCorner.y,
  ]);

  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    resultWidth,
    0,
    0,
    resultHeight,
    resultWidth,
    resultHeight,
  ]);

  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(
    img,
    warpedDst,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );

  cv.imshow(canvas, warpedDst);

  img.delete();
  warpedDst.delete();
  return canvas;
}

function getCornerPoints(contour) {
  let rect = cv.minAreaRect(contour);
  const center = rect.center;

  let topLeftCorner;
  let topLeftCornerDist = 0;

  let topRightCorner;
  let topRightCornerDist = 0;

  let bottomLeftCorner;
  let bottomLeftCornerDist = 0;

  let bottomRightCorner;
  let bottomRightCornerDist = 0;

  for (let i = 0; i < contour.data32S.length; i += 2) {
    const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
    const dist = distance(point.x, point.y, center.x, center.y);
    if (point.x < center.x && point.y < center.y) {
      // top left
      if (dist > topLeftCornerDist) {
        topLeftCorner = point;
        topLeftCornerDist = dist;
      }
    } else if (point.x > center.x && point.y < center.y) {
      // top right
      if (dist > topRightCornerDist) {
        topRightCorner = point;
        topRightCornerDist = dist;
      }
    } else if (point.x < center.x && point.y > center.y) {
      // bottom left
      if (dist > bottomLeftCornerDist) {
        bottomLeftCorner = point;
        bottomLeftCornerDist = dist;
      }
    } else if (point.x > center.x && point.y > center.y) {
      // bottom right
      if (dist > bottomRightCornerDist) {
        bottomRightCorner = point;
        bottomRightCornerDist = dist;
      }
    }
  }

  return {
    topLeftCorner,
    topRightCorner,
    bottomLeftCorner,
    bottomRightCorner,
  };
}
