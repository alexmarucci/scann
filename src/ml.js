import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl

export async function loadModel() {
  await tf.ready();
  const model = await tf.loadGraphModel('/yolov8n-seg_web_model/model.json');

  // Warm up
  const dummyInput = tf.randomUniform(model.inputs[0].shape, 0, 1, "float32"); // random input
  const warmUpResults = model.execute(dummyInput);

  /* requestAnimationFrame(() => tf.dispose([ dummyInput, warmUpResults ])); */

  return {net: model, inputShape: model.inputs[0].shape, 
            outputShape: warmUpResults.map((e) => e.shape),
};
}
