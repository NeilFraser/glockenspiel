/**
 * @license
 * Copyright 2012 Neil Fraser
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Blocks for Glockenspiel editor.
 */
'use strict';

Blockly.Blocks['music_pitch'] = {
  /**
   * Block for pitch.
   * @this {Blockly.Block}
   */
  init: function() {
    this.appendDummyInput()
        .appendField(new FieldPitch('C7'), 'PITCH');
    this.setOutput(true, 'Number');
    this.setColour(Blockly.Msg['MATH_HUE']);
    this.setTooltip('One note (C7 is 96).');
  }
};

Blockly.JavaScript['music_pitch'] = function(block) {
  return [block.getFieldValue('PITCH'),
      Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['music_note'] = {
  /**
   * Block for playing note.
   * @this {Blockly.Block}
   */
  init: function() {
    var options = [
      [{"src": "notes/1-low.png",
        "width": 9, "height": 19, "alt": "whole"}, "1"],
      [{"src": "notes/0.5-low.png",
        "width": 9, "height": 19, "alt": "half"}, "1/2"],
      [{"src": "notes/0.25-low.png",
        "width": 9, "height": 19, "alt": "quarter"}, "1/4"],
      [{"src": "notes/0.125-low.png",
        "width": 9, "height": 19, "alt": "eighth"}, "1/8"],
      [{"src": "notes/0.0625-low.png",
        "width": 9, "height": 19, "alt": "sixteenth"}, "1/16"],
      [{"src": "notes/0.03125-low.png",
        "width": 9, "height": 19, "alt": "thirtysecond"}, "1/32"],
    ];
    this.jsonInit({
      "message0": "play %1 note %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "DURATION",
          "options": options,
        },
        {
          "type": "input_value",
          "name": "PITCH",
          "check": ["Number", "Array"],
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 160,
      "tooltip": "Plays one musical note of the specified duration and pitch.",
    });
  }
};

Blockly.JavaScript['music_note'] = function(block) {
  var pitch = Blockly.JavaScript.valueToCode(block, 'PITCH',
      Blockly.JavaScript.ORDER_COMMA) || 'C7';

  // Look for computed flats/sharps, and replace with JS variables.
  // E.g. 'C7 + 1' -> 'Db7'
  var cache = Blockly.JavaScript['music_note'].cache_;
  var notes = Object.values(Music.fromMidi);
  for (var i = 0; i < notes.length; i++) {
    var down = notes[i - 1];  // May be undefined.
    var origin = notes[i];
    var up = notes[i + 1];  // May be undefined.
    if (down && pitch === origin + ' - 1') {
      pitch = down;
    }
    if (up && (pitch === origin + ' + 1' || pitch === '1 + ' + origin)) {
      pitch = up;
    }
  }

  return 'play(' + block.getFieldValue('DURATION') + ', ' + pitch +
      ', \'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['music_rest'] = {
  /**
   * Block for waiting.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "rest %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "DURATION",
          "options": [
            [{"src": "rests/1.png",
              "width": 10, "height": 20, "alt": "whole"}, "1"],
            [{"src": "rests/0.5.png",
              "width": 10, "height": 20, "alt": "half"}, "1/2"],
            [{"src": "rests/0.25.png",
              "width": 10, "height": 20, "alt": "quarter"}, "1/4"],
            [{"src": "rests/0.125.png",
              "width": 10, "height": 20, "alt": "eighth"}, "1/8"],
            [{"src": "rests/0.0625.png",
              "width": 10, "height": 20, "alt": "sixteenth"}, "1/16"],
            [{"src": "rests/0.03125.png",
              "width": 10, "height": 20, "alt": "thirtysecond"}, "1/32"],
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 160,
      "tooltip": "Waits for the specified duration.",
   });
  }
};

Blockly.JavaScript['music_rest'] = function(block) {
  return 'rest(' + block.getFieldValue('DURATION') +
      ', \'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['music_start'] = {
  /**
   * Block for starting an execution thread.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": "when %1 clicked",
      "args0": [
        {
          "type": "field_image",
          "src": "play.png",
          "width": 17,
          "height": 17,
          "alt": "▶",
        }
      ],
      "message1": "%1",
      "args1": [
        {
          "type": "input_statement",
          "name": "STACK",
        }
      ],
      "colour": 0,
      "tooltip": "Executes the blocks inside when the 'Run Program' button is clicked.",
    });
  }
};

Blockly.JavaScript['music_start'] = function(block) {
  Music.startCount++;
  var statements_stack = Blockly.JavaScript.statementToCode(block, 'STACK');
  var code = 'function start' + Music.startCount + '() {\n' +
      statements_stack + '}\n';
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.JavaScript.definitions_['%start' + Music.startCount] = code;
  return null;
};
