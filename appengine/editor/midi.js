/**
 * @license
 * Copyright 2023 Neil Fraser
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Converts MIDI into Blockly blocks.
 */
'use strict';

var Midi = {};

/**
 * Initialize MIDI parse.  Called on page load.
 */
Midi.init = function() {
  document.getElementById('uploadButton').style.display = '';
  document.getElementById('fileInput')
      .addEventListener('change', Midi.doneUpload);
  Music.bindClick('uploadButton', Midi.startUpload);
};

/**
 * When the visible upload button is clicked,
 * the hidden file upload input is triggered.
 */
Midi.startUpload = function() {
  document.getElementById('fileInput').click();
};

/**
 * Once the MIDI file has been selected by the user, start to parse it.
 */
Midi.doneUpload = function() {
  var fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return;
  var file = fileInput.files[0];
  file.arrayBuffer()
      .then(Midi.startParse, (e) => alert('Upload failed.\n' + e));
};

/**
 * MIDI file has been uploaded, parse it.
 * @param {ArrayBuffer} arrayBuffer Raw file data.
 */
Midi.startParse = function(arrayBuffer) {
  var dataArray = new Uint8Array(arrayBuffer);
  var midi = MidiParser.parse(dataArray);
  console.log(midi);
};
