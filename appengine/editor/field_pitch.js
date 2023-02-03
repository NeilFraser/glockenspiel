/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Music pitch input field.  Borrowed from Blockly Games.
 * @author fraser@google.com (Neil Fraser)
 * @author samelh@google.com (Sam El-Husseini)
 */
'use strict';

/**
 * Class for an editable pitch field.
 * @param {string} text The initial content of the field.
 * @extends {Blockly.FieldTextInput}
 * @constructor
 */
var FieldPitch = function(text) {
  FieldPitch.superClass_.constructor.call(this, text);
};
Blockly.utils.object.inherits(FieldPitch, Blockly.FieldTextInput);

/**
 * Table between human-readable text (A5-A7) and machine-readable midi (81-105).
 */
FieldPitch.NOTES = [
  'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6',
  'A6', 'B6', 'C7', 'D7', 'E7', 'F7', 'G7',
  'A7'
];

/**
 * Show the inline free-text editor on top of the text and the note picker.
 * @private
 */
FieldPitch.prototype.showEditor_ = function() {
  FieldPitch.superClass_.showEditor_.call(this);

  var div = Blockly.WidgetDiv.DIV;
  if (!div.firstChild) {
    // Mobile interface uses Blockly.prompt.
    return;
  }
  // Build the DOM.
  var editor = this.dropdownCreate_();
  Blockly.DropDownDiv.getContentDiv().appendChild(editor);

  var border = this.sourceBlock_.getColourBorder();
  border = border.colourBorder || border.colourLight;
  Blockly.DropDownDiv.setColour(this.sourceBlock_.getColour(), border);

  Blockly.DropDownDiv.showPositionedByField(
      this, this.dropdownDispose_.bind(this));

  // The note picker is different from other fields in that it updates on
  // mousemove even if it's not in the middle of a drag.  In future we may
  // change this behaviour.  For now, using bindEvent_ instead of
  // bindEventWithChecks_ allows it to work without a mousedown/touchstart.
  this.clickWrapper_ = Blockly.bindEvent_(this.imageElement_, 'click', this,
      this.hide_);
  this.moveWrapper_ = Blockly.bindEvent_(this.imageElement_, 'mousemove', this,
      this.onMouseMove);

  this.updateGraph_();
};

/**
 * Create the pitch editor.
 * @return {!Element} The newly created pitch picker.
 * @private
 */
FieldPitch.prototype.dropdownCreate_ = function() {
  this.imageElement_ = document.createElement('div');
  this.imageElement_.id = 'notePicker';

  return this.imageElement_;
};

/**
 * Dispose of events belonging to the pitch editor.
 * @private
 */
FieldPitch.prototype.dropdownDispose_ = function() {
  Blockly.unbindEvent_(this.clickWrapper_);
  Blockly.unbindEvent_(this.moveWrapper_);
};

/**
 * Hide the editor.
 * @private
 */
FieldPitch.prototype.hide_ = function() {
  Blockly.WidgetDiv.hide();
  Blockly.DropDownDiv.hideWithoutAnimation();
};

/**
 * Set the note to match the mouse's position.
 * @param {!Event} e Mouse move event.
 */
FieldPitch.prototype.onMouseMove = function(e) {
  var bBox = this.imageElement_.getBoundingClientRect();
  var dy = e.clientY - bBox.top - 13.5;
  var note = Blockly.utils.math.clamp(Math.round(13.5 - dy / 7.5), 0, 14);
  this.imageElement_.style.backgroundPosition = (-note * 37) + 'px 0';
  this.setEditorValue_(FieldPitch.NOTES[note]);
};

/**
 * Updates the graph when the field rerenders.
 * @private
 * @override
 */
FieldPitch.prototype.render_ = function() {
  FieldPitch.superClass_.render_.call(this);
  this.updateGraph_();
};

/**
 * Redraw the note picker with the current note.
 * @private
 */
FieldPitch.prototype.updateGraph_ = function() {
  if (!this.imageElement_) {
    return;
  }
  var value = this.getValue();
  var i = FieldPitch.NOTES.indexOf(value);
  this.imageElement_.style.backgroundPosition = (-i * 37) + 'px 0';
};

/**
 * Ensure that only a valid value may be entered.
 * @param {*} opt_newValue The input value.
 * @return {*} A valid value, or null if invalid.
 */
FieldPitch.prototype.doClassValidation_ = function(opt_newValue) {
  if (opt_newValue === null || opt_newValue === undefined) {
    return null;
  }
  var i = FieldPitch.NOTES.indexOf(opt_newValue);
  return i == -1 ? null : opt_newValue;
};
