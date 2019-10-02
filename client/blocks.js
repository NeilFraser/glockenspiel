/**
 * @license
 * Copyright 2012 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Blocks for Music game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Blocks['music_pitch'] = {
  /**
   * Block for pitch.
   * @this {Blockly.Block}
   */
  init: function() {
    this.appendDummyInput()
        .appendField(new FieldPitch('7'), 'PITCH');
    this.setOutput(true, 'Number');
    this.setColour(Blockly.Msg['MATH_HUE']);
    this.setTooltip('One note (C4 is 7).');
  }
};

Blockly.JavaScript['music_pitch'] = function(block) {
  return [Number(block.getFieldValue('PITCH')),
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
        "width": 9, "height": 19, "alt": "half"}, "0.5"],
      [{"src": "notes/0.25-low.png",
        "width": 9, "height": 19, "alt": "quarter"}, "0.25"],
      [{"src": "notes/0.125-low.png",
        "width": 9, "height": 19, "alt": "eighth"}, "0.125"],
      [{"src": "notes/0.0625-low.png",
        "width": 9, "height": 19, "alt": "sixteenth"}, "0.0625"]
    ];
    this.jsonInit({
      "message0": "play %1 note %2",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "DURATION",
          "options": options
        },
        {
          "type": "input_value",
          "name": "PITCH",
          "check": "Number"
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 160,
      "tooltip": "Plays one musical note of the specified duration and pitch."
    });
  }
};

Blockly.JavaScript['music_note'] = function(block) {
  var pitch = Blockly.JavaScript.valueToCode(block, 'PITCH',
      Blockly.JavaScript.ORDER_COMMA) || '7';
  return 'play(' + Number(block.getFieldValue('DURATION')) + ', ' + pitch +
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
              "width": 10, "height": 20, "alt": "half"}, "0.5"],
            [{"src": "rests/0.25.png",
              "width": 10, "height": 20, "alt": "quarter"}, "0.25"],
            [{"src": "rests/0.125.png",
              "width": 10, "height": 20, "alt": "eighth"}, "0.125"],
            [{"src": "rests/0.0625.png",
              "width": 10, "height": 20, "alt": "sixteenth"}, "0.0625"]
          ]
        }
      ],
      "inputsInline": true,
      "previousStatement": null,
      "nextStatement": null,
      "colour": 160,
      "tooltip": "Waits for the specified duration."
   });
  }
};

Blockly.JavaScript['music_rest'] = function(block) {
  return 'rest(' + Number(block.getFieldValue('DURATION')) +
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
          "alt": "▶"
        }
      ],
      "message1": "%1",
      "args1": [
        {
          "type": "input_statement",
          "name": "STACK"
        }
      ],
      "colour": 0,
      "tooltip": "Executes the blocks inside when the 'Run Program' button is clicked."
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
