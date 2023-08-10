/**
 * @fileoverview Externs for Glockenspiel's dependencies.
 * @externs
 */

/**
 * Blockly namespace.
 */
var Blockly = {};

/**
 * MidiParser namespace.
 */
var MidiParser = {};

/**
 * Parse A MIDI binary into a JSON data structure.
 * @param {!Uint8Array} dataArray MIDI binary.
 * @returns {!Object} JSON data structure.
 */
MidiParser.parse = function(dataArray) {};
