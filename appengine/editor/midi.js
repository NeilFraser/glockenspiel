/**
 * @license
 * Copyright 2023 Neil Fraser
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Converts MIDI into Blockly blocks.
 */
'use strict';

const Midi = {};

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
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files.length) return;
  const file = fileInput.files[0];
  file.arrayBuffer()
      .then(Midi.startParse, (e) => alert('Upload failed.\n' + e));
  Music.resetButtonClick();
};

/**
 * MIDI file has been uploaded, parse it.
 * @param {ArrayBuffer} arrayBuffer Raw file data.
 */
Midi.startParse = function(arrayBuffer) {
  const dataArray = new Uint8Array(arrayBuffer);
  const midi = MidiParser.parse(dataArray);
  const pitchTable = Midi.createPitchTable(Midi.allPitches(midi));
  Music.workspace.clear();
  for (let n = 1; n < midi['track'].length; n++) {
    const track = Midi.parseTrack(midi, n);
    setTimeout(Midi.populate.bind(Midi, track, n, pitchTable), 1);
  }
};

Midi.parseTrack = function(midi, n) {
  const timeDivision = midi['timeDivision'] * 2;
  const events = midi['track'][n]['event'];
  const track = [];
  for (const event of events) {
    const deltaTime = event['deltaTime'] / timeDivision;
    let lastTrackItem = track[track.length - 1];
    if (deltaTime > 0) {
      if (typeof lastTrackItem === 'number') {
        track[track.length - 1] += deltaTime;
      } else {
        track.push(deltaTime);
        lastTrackItem = deltaTime;
      }
    }
    if (event['type'] === 9) {
      // Note on.
      const pitch = event['data'][0];
      if (Array.isArray(lastTrackItem)) {
        lastTrackItem.push(pitch);
      } else {
        track.push([pitch]);
      }
    }
  }
  for (const trackItem of track) {
    if (Array.isArray(trackItem)) {
      trackItem.sort();
    }
  }
  return track;
}

Midi.populate = function(track, n, pitchTable) {
  const stack = Midi.makeStack(n);
  const blocks = [];

  let time = 0;
  for (const trackItem of track) {
    if (Array.isArray(trackItem)) {
      // Create note block.
      const noteBlock = Music.workspace.newBlock('music_note');
      blocks.push(noteBlock);
      const parentConnectors = [noteBlock.getInput('PITCH').connection];
      if (trackItem.length > 1) {
        const listBlock = Music.workspace.newBlock('lists_create_with');
        blocks.push(listBlock);
        var node = Blockly.utils.xml.createElement('mutation');
        node.setAttribute('items', trackItem.length);
        listBlock.domToMutation(node);
        parentConnectors.shift().connect(listBlock.outputConnection);
        for (let i = 0; i < trackItem.length; i++) {
          parentConnectors.push(listBlock.getInput('ADD' + i).connection);
        }
      }
      for (const pitch of trackItem) {
        // Create pitch block.
        const pitchBlock = Music.workspace.newBlock('music_pitch');
        blocks.push(pitchBlock);

        // Set the pitch field.
        const pitchTuple = pitchTable.get(pitch);
        pitchBlock.setFieldValue(pitchTuple[0], 'PITCH');
        let childBlock;
        if (pitchTuple[1] === 0) {
          // Natural note.
          childBlock = pitchBlock;
        } else {
          // Accidental note (sharp/flat).
          const arithmeticBlock = Music.workspace.newBlock('math_arithmetic');
          const numberBlock = Music.workspace.newBlock('math_number');
          blocks.push(arithmeticBlock, numberBlock);
          arithmeticBlock.setFieldValue(pitchTuple[1] > 0 ? 'ADD' : 'MINUS', 'OP');
          numberBlock.setFieldValue(Math.abs(pitchTuple[1]), 'NUM');
          arithmeticBlock.getInput('A').connection.connect(pitchBlock.outputConnection);
          arithmeticBlock.getInput('B').connection.connect(numberBlock.outputConnection);

          childBlock = arithmeticBlock;
        }
        parentConnectors.shift().connect(childBlock.outputConnection);
      }

      // Record the duration field.
      stack.lastNoteBlock = noteBlock;

      // Connect note/pitch block to stack.
      stack.connection.connect(noteBlock.previousConnection);
      stack.connection = noteBlock.nextConnection;
    } else {
      // Duration.
      // Set duration of last block.
      let deltaTime = trackItem;
      if (stack.lastNoteBlock) {
        const timeSlice = Midi.timeSlice(deltaTime);
        const fraction = timeSlice[0];
        deltaTime = timeSlice[1];
        if (fraction) {
          stack.lastNoteBlock.setFieldValue(fraction, 'DURATION');
        }
      }
      while (deltaTime >= 1/16) {
        // Create rest block.
        const timeSlice = Midi.timeSlice(deltaTime);
        const fraction = timeSlice[0];
        deltaTime = timeSlice[1];
        const restBlock = Music.workspace.newBlock('music_rest');
        restBlock.setFieldValue(fraction, 'DURATION');
        blocks.push(restBlock);
        stack.connection.connect(restBlock.previousConnection);
        stack.connection = restBlock.nextConnection;
      }
    }
  }

  for (let i = blocks.length - 1; i >= 0; i--) {
    blocks[i].initSvg();
  }
  console.time('Rendering blocks');
  for (let i = blocks.length - 1; i >= 0; i--) {
    blocks[i].render();
  }
  console.timeEnd('Rendering blocks');
};

Midi.makeStack = function(n) {
  const startBlock = Music.workspace.newBlock('music_start');
  startBlock.moveBy(n * 300 + 10, 10);
  startBlock.initSvg();
  startBlock.render();
  return {
    connection: startBlock.getInput('STACK').connection,
    lastNoteBlock: null,
  };
};

/**
 *
 * @param {number} deltaTime
 * @returns {!Array}
 */
Midi.timeSlice = function(deltaTime) {
  let fraction = ''
  if (deltaTime >= 1) {
    fraction = '1';
    deltaTime -= 1;
  } else if (deltaTime >= 1/2) {
    fraction = '1/2';
    deltaTime -= 1/2;
  } else if (deltaTime >= 1/4) {
    fraction = '1/4';
    deltaTime -= 1/4;
  } else if (deltaTime >= 1/8) {
    fraction = '1/8';
    deltaTime -= 1/8;
  } else if (deltaTime >= 1/16) {
    fraction = '1/16';
    deltaTime -= 1/16;
  }
  return [fraction, deltaTime];
};

/**
 * Find every pitch used in the MIDI data structure.
 * @param {!Object} midi MIDI data structure.
 * @returns {!Map<number,number>} Histogram of MIDI pitch values.
 */
Midi.allPitches = function(midi) {
  const counts = Array(256).fill(0);
  for (const track of midi['track']) {
    for (const event of track['event']) {
      if (event['type'] === 9) {
        counts[event['data'][0]]++;
      }
    }
  }
  return new Map(counts.map((count, pitch) => [pitch, count])
      .filter(([pitch, count]) => count > 0));
};


Midi.createPitchTable = function(histogram) {
  const minBell = Math.min(...Object.keys(Music.fromMidi));
  const maxBell = Math.max (...Object.keys(Music.fromMidi));
  const minPitch = Math.min(...histogram.keys());
  const maxPitch = Math.max(...histogram.keys());
  const lower = Math.min(minBell - minPitch, maxBell - maxPitch);
  const upper = Math.max(minBell - minPitch, maxBell - maxPitch);

  // For every offset between lower and upper bound (incusive), compute
  // badness score.
  let bestOffset = 0, bestScore = -Infinity;
  for (let offset = lower; offset <= upper; offset++) {
    let score = offset % 12 ? 0 : 10;  // Bonus +10 for octave transposition.
    score -= Math.abs(offset) / 12;  // Penalty -1 per octave.
    for (const [rawPitch, count] of histogram) {
      const pitch = rawPitch + offset;
      if (pitch < minBell || pitch > maxBell) {
        score -= 10 * count;  // Penalty -10 for each note out of range.
      } else if (Music.fromMidi[pitch].includes('b')) {
        score -= count;  // Penalty -1 for each accidental.
      }
    }
    if (score > bestScore) {
      bestOffset = offset;
      bestScore = score;
    }
  }

  const pitchTable = new Map();
  for (const rawPitch of histogram.keys()) {
    let midiPitch = rawPitch + bestOffset;
    while (midiPitch < minBell) midiPitch += 12;
    while (midiPitch > maxBell) midiPitch -= 12;
    let abcPitch = Music.fromMidi[midiPitch];
    let accidental = 0;
    if (abcPitch.includes('b')) {
      // Flat note.
      abcPitch = abcPitch.replace('b', '');
      accidental = -1;
    }
    pitchTable.set(rawPitch, [abcPitch, accidental]);
  }
  return pitchTable;
};
