// moods.js: each walking place's own atmosphere, read from the 3D world's places (moon-faire-witches/world3d/places/, at e99820b) by
// tools/make-moods.mjs. Not written by hand: run the tool again when the places change.
// grow: what its leaves, firs and bushes are tinted, against the 3D world's default green (1, 1, 1 = that default);
// fog and moon: its fog's colour and its moonlight. The 3D map colours each region of the land from the places in it.
window.MAP_MOODS = {
 "wickhollow": {
  "grow": [1, 1, 1],
  "fog": [0.075, 0.08, 0.16],
  "moon": [0.42, 0.43, 0.56],
  "own": false
 },
 "cottage": {
  "grow": [1, 1, 1],
  "fog": [0.075, 0.08, 0.16],
  "moon": [0.42, 0.43, 0.56],
  "own": false
 },
 "jetty": {
  "grow": [1, 1, 1],
  "fog": [0.075, 0.08, 0.16],
  "moon": [0.42, 0.43, 0.56],
  "own": false
 },
 "thornwood": {
  "grow": [1.165, 0.95, 1.076],
  "fog": [0.18, 0.185, 0.338],
  "moon": [0.4, 0.44, 0.6],
  "own": true
 },
 "bogmire": {
  "grow": [0.651, 0.668, 0.754],
  "fog": [0.075, 0.08, 0.16],
  "moon": [0.42, 0.43, 0.56],
  "own": true
 },
 "bogmire-heart": {
  "grow": [0.658, 0.675, 0.673],
  "fog": [0.026, 0.048, 0.054],
  "moon": [0.2, 0.23, 0.32],
  "own": true
 },
 "warm-roads-camp": {
  "grow": [1.022, 0.933, 0.904],
  "fog": [0.19, 0.16, 0.3],
  "moon": [0.42, 0.42, 0.56],
  "own": true
 },
 "ember-line-road": {
  "grow": [1.006, 0.92, 0.89],
  "fog": [0.19, 0.16, 0.3],
  "moon": [0.42, 0.42, 0.56],
  "own": true
 },
 "dawnroost-road": {
  "grow": [1.031, 0.99, 1.024],
  "fog": [0.16, 0.175, 0.31],
  "moon": [0.4, 0.44, 0.6],
  "own": true
 },
 "dawnroost": {
  "grow": [1.019, 0.996, 1.021],
  "fog": [0.075, 0.08, 0.16],
  "moon": [0.42, 0.43, 0.56],
  "own": true
 },
 "dawnroost-node": {
  "grow": [0.788, 0.809, 0.812],
  "fog": [0.075, 0.08, 0.16],
  "moon": [0.42, 0.43, 0.56],
  "own": true
 },
 "northern-camp": {
  "grow": [1.134, 0.978, 1.126],
  "fog": [0.18, 0.185, 0.338],
  "moon": [0.4, 0.44, 0.6],
  "own": true
 },
 "eldergrove-edge": {
  "grow": [1.002, 0.914, 1.037],
  "fog": [0.17, 0.18, 0.33],
  "moon": [0.42, 0.46, 0.64],
  "own": true
 },
 "cold-moor": {
  "grow": [1.026, 0.85, 1.015],
  "fog": [0.18, 0.185, 0.338],
  "moon": [0.4, 0.44, 0.6],
  "own": true
 },
 "crossroads": {
  "grow": [0.994, 0.835, 0.875],
  "fog": [0.165, 0.172, 0.31],
  "moon": [0.42, 0.45, 0.6],
  "own": true
 },
 "shipyard": {
  "grow": [1.132, 1, 1.147],
  "fog": [0.05, 0.06, 0.12],
  "moon": [0.42, 0.43, 0.56],
  "own": true
 },
 "frozen-camp": {
  "grow": [1.172, 1.011, 1.148],
  "fog": [0.18, 0.186, 0.34],
  "moon": [0.42, 0.46, 0.62],
  "own": true
 },
 "frostmere-shore": {
  "grow": [1.172, 1.011, 1.148],
  "fog": [0.18, 0.186, 0.34],
  "moon": [0.42, 0.46, 0.62],
  "own": true
 },
 "frozen-pass": {
  "grow": [1.134, 0.983, 1.126],
  "fog": [0.2, 0.215, 0.36],
  "moon": [0.44, 0.47, 0.62],
  "own": true
 },
 "misthollow": {
  "grow": [1.081, 0.94, 1.107],
  "fog": [0.24, 0.26, 0.37],
  "moon": [0.5, 0.52, 0.68],
  "own": true
 },
 "moonwell": {
  "grow": [0.944, 0.863, 1.046],
  "fog": [0.085, 0.095, 0.17],
  "moon": [0.44, 0.48, 0.66],
  "own": true
 }
};
