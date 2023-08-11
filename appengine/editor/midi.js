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
      .then(Midi.fileLoaded, (e) => alert('Upload failed.\n' + e));
};

/**
 * File contents has been loaded and is in an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer Raw file data.
 */
Midi.fileLoaded = function(arrayBuffer) {
  MusicDialogs.showLoading();
  // Wait for background to start fading.
  setTimeout(Midi.startParse.bind(Midi, arrayBuffer), 50);
};

/**
 * MIDI file has been uploaded, parse it.
 * @param {ArrayBuffer} arrayBuffer Raw file data.
 */
Midi.startParse = function(arrayBuffer) {
  Music.resetButtonClick();
  Music.workspace.clear();
  const dataArray = new Uint8Array(arrayBuffer);
  const midi = MidiParser.parse(dataArray);
  const pitchTable = Midi.createPitchTable(Midi.allPitches(midi));
  // <xml>
  const xmlElement = Blockly.utils.xml.createElement('xml');
  if (midi['formatType'] === 0) {
    const track = Midi.parseTrack(midi, 0);
    xmlElement.appendChild(Midi.trackToXml(track, 0, pitchTable));
  } else {
    for (let n = 1; n < midi['track'].length; n++) {
      const track = Midi.parseTrack(midi, n);
      xmlElement.appendChild(Midi.trackToXml(track, n, pitchTable));
    }
  }
  Music.setCode(xmlElement);
  MusicDialogs.hideDialog();
};

/**
 * Parse MIDI track and create an array of pitches and pauses for one voice.
 * E.g. [[81, 84], 0.5, [100], 0.25]
 * @param {!Object} midi MIDI data structure.
 * @param {number} n The track number to parse.
 * @returns {!Array<!Array<number>|number>} Pitch/pause array.
 */
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
};

/**
 * Convert one track into a Blockly stack of blocks.
 * @param {!Array<!Array<number>|number>} track Pitch/pause array.
 * @param {number} n The track number.
 * @param {!Map<number,!Array>} pitchTable Map of MIDI pitch values to
 *     glockenspiel pitches.
 * @returns {!Element} Blockly XML for the start block.
 */
Midi.trackToXml = function(track, n, pitchTable) {
  // <block type="music_start" x="10" y="10">
  const startBlockElement = Blockly.utils.xml.createElement('block');
  startBlockElement.setAttribute('type', 'music_start');
  startBlockElement.setAttribute('x', n * 300 + 10);
  startBlockElement.setAttribute('y', 10);
  // <statement name="STACK">
  const statementStackElement = Blockly.utils.xml.createElement('statement');
  statementStackElement.setAttribute('name', 'STACK');
  startBlockElement.appendChild(statementStackElement);
  let parentStackElement = statementStackElement;
  let lastDurationElement = null;

  for (const trackItem of track) {
    if (Array.isArray(trackItem)) {
      // Create note block with pitch block(s).
      // <block type="music_note">
      const noteBlockElement = Blockly.utils.xml.createElement('block');
      noteBlockElement.setAttribute('type', 'music_note');
      parentStackElement.appendChild(noteBlockElement);
      // <field name="DURATION">1/2</field>
      const durationFieldElement = Blockly.utils.xml.createElement('field');
      durationFieldElement.setAttribute('name', 'DURATION');
      noteBlockElement.appendChild(durationFieldElement);
      lastDurationElement = durationFieldElement;
      // <value name="PITCH">
      const pitchValueElement = Blockly.utils.xml.createElement('value');
      pitchValueElement.setAttribute('name', 'PITCH');
      noteBlockElement.appendChild(pitchValueElement);
      // <next>
      const nextElement = Blockly.utils.xml.createElement('next');
      noteBlockElement.appendChild(nextElement);
      parentStackElement = nextElement;
      const parentValueElements = [];

      if (trackItem.length > 1) {
        // <block type="lists_create_with">
        const listBlockElement = Blockly.utils.xml.createElement('block');
        listBlockElement.setAttribute('type', 'lists_create_with');
        pitchValueElement.appendChild(listBlockElement);
        // <mutation items="2"/>
        const mutationElement = Blockly.utils.xml.createElement('mutation');
        mutationElement.setAttribute('items', trackItem.length);
        listBlockElement.appendChild(mutationElement);
        for (let i = 0; i < trackItem.length; i++) {
          // <value name="ADD0">
          const addValueElement = Blockly.utils.xml.createElement('value');
          addValueElement.setAttribute('name', 'ADD' + i);
          listBlockElement.appendChild(addValueElement);
          parentValueElements.push(addValueElement);
        }
      } else {
        parentValueElements.push(pitchValueElement);
      }

      for (const pitch of trackItem) {
        // <block type="music_pitch">
        const pitchBlockElement = Blockly.utils.xml.createElement('block');
        pitchBlockElement.setAttribute('type', 'music_pitch');
        // <field name="PITCH">E6</field>
        const pitchFieldElement = Blockly.utils.xml.createElement('field');
        pitchFieldElement.setAttribute('name', 'PITCH');
        pitchBlockElement.appendChild(pitchFieldElement);
        const [abcPitch, accidental] = pitchTable.get(pitch);
        const pitchText = Blockly.utils.xml.createTextNode(abcPitch);
        pitchFieldElement.appendChild(pitchText);

        let childBlock;
        if (accidental === 0) {
          // Natural note.
          childBlock = pitchBlockElement;
        } else {
          // Accidental note (sharp/flat).
          // <block type="math_arithmetic">
          const arithmeticBlockElement = Blockly.utils.xml.createElement('block');
          arithmeticBlockElement.setAttribute('type', 'math_arithmetic');
          // <field name="OP">MINUS</field>
          const opFieldElement = Blockly.utils.xml.createElement('field');
          opFieldElement.setAttribute('name', 'OP');
          const minusText = Blockly.utils.xml.createTextNode(
              accidental > 0 ? 'ADD' : 'MINUS');
          opFieldElement.appendChild(minusText);
          arithmeticBlockElement.appendChild(opFieldElement);
          // <value name="A">
          const aValueElement = Blockly.utils.xml.createElement('value');
          aValueElement.setAttribute('name', 'A');
          arithmeticBlockElement.appendChild(aValueElement);
          aValueElement.appendChild(pitchBlockElement);
          // <value name="B">
          const bValueElement = Blockly.utils.xml.createElement('value');
          bValueElement.setAttribute('name', 'B');
          arithmeticBlockElement.appendChild(bValueElement);
          // <block type="math_number">
          const numberBlockElement = Blockly.utils.xml.createElement('block');
          numberBlockElement.setAttribute('type', 'math_number');
          // <field name="NUM">1</field>
          const numFieldElement = Blockly.utils.xml.createElement('field');
          numFieldElement.setAttribute('name', 'NUM');
          const oneText = Blockly.utils.xml.createTextNode('1');
          numFieldElement.appendChild(oneText);
          numberBlockElement.appendChild(numFieldElement);
          bValueElement.appendChild(numberBlockElement);

          childBlock = arithmeticBlockElement;
        }
        parentValueElements.shift().appendChild(childBlock);
      }
    } else {
      // Duration.
      // Set duration of last block.
      let deltaTime = trackItem;
      if (lastDurationElement) {
        const timeSlice = Midi.timeSlice(deltaTime);
        const fraction = timeSlice[0];
        deltaTime = timeSlice[1];
        if (fraction) {
          const durationText = Blockly.utils.xml.createTextNode(fraction);
          lastDurationElement.appendChild(durationText);
        }
      }
      while (deltaTime >= 1/16) {
        // Create rest block.
        const timeSlice = Midi.timeSlice(deltaTime);
        const fraction = timeSlice[0];
        deltaTime = timeSlice[1];
        // <block type="music_rest">
        const restBlockElement = Blockly.utils.xml.createElement('block');
        restBlockElement.setAttribute('type', 'music_rest');
        parentStackElement.appendChild(restBlockElement);
        // <field name="DURATION">1/2</field>
        const durationFieldElement = Blockly.utils.xml.createElement('field');
        durationFieldElement.setAttribute('name', 'DURATION');
        restBlockElement.appendChild(durationFieldElement);
        const durationText = Blockly.utils.xml.createTextNode(fraction);
        durationFieldElement.appendChild(durationText);
        // <next>
        const nextElement = Blockly.utils.xml.createElement('next');
        restBlockElement.appendChild(nextElement);
        parentStackElement = nextElement;
        lastDurationElement = null;
      }
    }
  }
  return startBlockElement;
};

/**
 *
 * @param {number} deltaTime
 * @returns {!Array}
 */
Midi.timeSlice = function(deltaTime) {
  let fraction = '';
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
