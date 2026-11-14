/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
// The three.js shorts need the GPU: without this, CLI renders fall back to software WebGL and time out.
Config.setChromiumOpenGlRenderer("angle");
// Each new 3D canvas (start of a render, every crossfade) builds the whole world first, which can take
// longer than the default 30 s. Same value as scripts/bridge-stills.mjs.
Config.setDelayRenderTimeoutInMilliseconds(180000);
