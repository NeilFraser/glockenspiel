/**
 * Blockly Games: Common code for dialogs.
 *
 * Copyright 2013 Google Inc.
 * https://github.com/google/blockly-games
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
 * @fileoverview Common support code for dialogs.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

var MusicDialogs = {};

/**
 * Is the dialog currently onscreen?
 * @private
 */
MusicDialogs.isDialogVisible_ = false;

/**
 * A closing dialog should animate towards this element.
 * @type Element
 * @private
 */
MusicDialogs.dialogOrigin_ = null;

/**
 * A function to call when a dialog closes.
 * @type Function
 * @private
 */
MusicDialogs.dialogDispose_ = null;

/**
 * Show the dialog pop-up.
 * @param {Element} content DOM element to display in the dialog.
 * @param {Element} origin Animate the dialog opening/closing from/to this
 *     DOM element.  If null, don't show any animations for opening or closing.
 * @param {boolean} animate Animate the dialog opening (if origin not null).
 * @param {boolean} modal If true, grey out background and prevent interaction.
 * @param {!Object} style A dictionary of style rules for the dialog.
 * @param {Function} disposeFunc An optional function to call when the dialog
 *     closes.  Normally used for unhooking events.
 */
MusicDialogs.showDialog = function(content, origin, animate, modal, style,
                                     disposeFunc) {
  if (!content) {
    throw TypeError('Content not found: ' + content);
  }
  if (MusicDialogs.isDialogVisible_) {
    MusicDialogs.hideDialog(false);
  }
  if (Blockly.getMainWorkspace()) {
    // Some levels have an editor instead of Blockly.
    Blockly.hideChaff(true);
  }
  MusicDialogs.isDialogVisible_ = true;
  MusicDialogs.dialogOrigin_ = origin;
  MusicDialogs.dialogDispose_ = disposeFunc;
  var dialog = document.getElementById('dialog');
  var shadow = document.getElementById('dialogShadow');
  var border = document.getElementById('dialogBorder');

  // Copy all the specified styles to the dialog.
  for (var name in style) {
    dialog.style[name] = style[name];
  }
  if (modal) {
    shadow.style.visibility = 'visible';
    shadow.style.opacity = 0.3;
    shadow.style.zIndex = 9;
    var header = document.createElement('div');
    header.id = 'dialogHeader';
    dialog.appendChild(header);
    MusicDialogs.dialogMouseDownWrapper_ =
        Blockly.bindEvent_(header, 'mousedown', null,
                           MusicDialogs.dialogMouseDown_);
  }
  dialog.appendChild(content);
  content.className = content.className.replace('dialogHiddenContent', '');

  function endResult() {
    // Check that the dialog wasn't closed during opening.
    if (MusicDialogs.isDialogVisible_) {
      dialog.style.visibility = 'visible';
      dialog.style.zIndex = 10;
      border.style.visibility = 'hidden';
    }
  }
  if (animate && origin) {
    MusicDialogs.matchBorder_(origin, false, 0.2);
    MusicDialogs.matchBorder_(dialog, true, 0.8);
    // In 175ms show the dialog and hide the animated border.
    setTimeout(endResult, 175);
  } else {
    // No animation.  Just set the final state.
    endResult();
  }
};

/**
 * Horizontal start coordinate of dialog drag.
 */
MusicDialogs.dialogStartX_ = 0;

/**
 * Vertical start coordinate of dialog drag.
 */
MusicDialogs.dialogStartY_ = 0;

/**
 * Handle start of drag of dialog.
 * @param {!Event} e Mouse down event.
 * @private
 */
MusicDialogs.dialogMouseDown_ = function(e) {
  MusicDialogs.dialogUnbindDragEvents_();
  if (Blockly.utils.isRightButton(e)) {
    // Right-click.
    return;
  }
  // Left click (or middle click).
  // Record the starting offset between the current location and the mouse.
  var dialog = document.getElementById('dialog');
  MusicDialogs.dialogStartX_ = dialog.offsetLeft - e.clientX;
  MusicDialogs.dialogStartY_ = dialog.offsetTop - e.clientY;

  MusicDialogs.dialogMouseUpWrapper_ = Blockly.bindEvent_(document,
      'mouseup', null, MusicDialogs.dialogUnbindDragEvents_);
  MusicDialogs.dialogMouseMoveWrapper_ = Blockly.bindEvent_(document,
      'mousemove', null, MusicDialogs.dialogMouseMove_);
  // This event has been handled.  No need to bubble up to the document.
  e.stopPropagation();
};

/**
 * Drag the dialog to follow the mouse.
 * @param {!Event} e Mouse move event.
 * @private
 */
MusicDialogs.dialogMouseMove_ = function(e) {
  var dialog = document.getElementById('dialog');
  var dialogLeft = MusicDialogs.dialogStartX_ + e.clientX;
  var dialogTop = MusicDialogs.dialogStartY_ + e.clientY;
  dialogTop = Math.max(dialogTop, 0);
  dialogTop = Math.min(dialogTop, window.innerHeight - dialog.offsetHeight);
  dialogLeft = Math.max(dialogLeft, 0);
  dialogLeft = Math.min(dialogLeft, window.innerWidth - dialog.offsetWidth);
  dialog.style.left = dialogLeft + 'px';
  dialog.style.top = dialogTop + 'px';
};

/**
 * Stop binding to the global mouseup and mousemove events.
 * @private
 */
MusicDialogs.dialogUnbindDragEvents_ = function() {
  if (MusicDialogs.dialogMouseUpWrapper_) {
    Blockly.unbindEvent_(MusicDialogs.dialogMouseUpWrapper_);
    MusicDialogs.dialogMouseUpWrapper_ = null;
  }
  if (MusicDialogs.dialogMouseMoveWrapper_) {
    Blockly.unbindEvent_(MusicDialogs.dialogMouseMoveWrapper_);
    MusicDialogs.dialogMouseMoveWrapper_ = null;
  }
};

/**
 * Hide the dialog pop-up.
 * @param {boolean} opt_animate Animate the dialog closing.  Defaults to true.
 *     Requires that origin was not null when dialog was opened.
 */
MusicDialogs.hideDialog = function(opt_animate) {
  if (!MusicDialogs.isDialogVisible_) {
    return;
  }
  MusicDialogs.dialogUnbindDragEvents_();
  if (MusicDialogs.dialogMouseDownWrapper_) {
    Blockly.unbindEvent_(MusicDialogs.dialogMouseDownWrapper_);
    MusicDialogs.dialogMouseDownWrapper_ = null;
  }

  MusicDialogs.isDialogVisible_ = false;
  MusicDialogs.dialogDispose_ && MusicDialogs.dialogDispose_();
  MusicDialogs.dialogDispose_ = null;
  var origin = (opt_animate === false) ? null : MusicDialogs.dialogOrigin_;
  var dialog = document.getElementById('dialog');
  var shadow = document.getElementById('dialogShadow');

  shadow.style.opacity = 0;

  function endResult() {
    shadow.style.zIndex = -1;
    shadow.style.visibility = 'hidden';
    var border = document.getElementById('dialogBorder');
    border.style.visibility = 'hidden';
  }
  if (origin && dialog) {
    MusicDialogs.matchBorder_(dialog, false, 0.8);
    MusicDialogs.matchBorder_(origin, true, 0.2);
    // In 175ms hide both the shadow and the animated border.
    setTimeout(endResult, 175);
  } else {
    // No animation.  Just set the final state.
    endResult();
  }
  dialog.style.visibility = 'hidden';
  dialog.style.zIndex = -1;
  var header = document.getElementById('dialogHeader');
  if (header) {
    header.parentNode.removeChild(header);
  }
  while (dialog.firstChild) {
    var content = dialog.firstChild;
    content.className += ' dialogHiddenContent';
    document.body.appendChild(content);
  }
};

/**
 * Match the animated border to the a element's size and location.
 * @param {!Element} element Element to match.
 * @param {boolean} animate Animate to the new location.
 * @param {number} opacity Opacity of border.
 * @private
 */
MusicDialogs.matchBorder_ = function(element, animate, opacity) {
  if (!element) {
    return;
  }
  var border = document.getElementById('dialogBorder');
  var bBox = MusicDialogs.getBBox_(element);
  function change() {
    border.style.width = bBox.width + 'px';
    border.style.height = bBox.height + 'px';
    border.style.left = bBox.x + 'px';
    border.style.top = bBox.y + 'px';
    border.style.opacity = opacity;
  }
  if (animate) {
    border.className = 'dialogAnimate';
    setTimeout(change, 1);
  } else {
    border.className = '';
    change();
  }
  border.style.visibility = 'visible';
};

/**
 * Compute the absolute coordinates and dimensions of an HTML or SVG element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
MusicDialogs.getBBox_ = function(element) {
  var xy = Blockly.utils.style.getPageOffset(element);
  var box = {
    x: xy.x,
    y: xy.y
  };
  if (element.getBBox) {
    // SVG element.
    var bBox = element.getBBox();
    box.height = bBox.height;
    box.width = bBox.width;
  } else {
    // HTML element.
    box.height = element.offsetHeight;
    box.width = element.offsetWidth;
  }
  return box;
};

/**
 * If the user preses enter, escape, or space, hide the dialog.
 * @param {!Event} e Keyboard event.
 * @private
 */
MusicDialogs.dialogKeyDown_ = function(e) {
  if (MusicDialogs.isDialogVisible_) {
    if (e.keyCode == 13 ||
        e.keyCode == 27 ||
        e.keyCode == 32) {
      MusicDialogs.hideDialog(true);
      e.stopPropagation();
      e.preventDefault();
    }
  }
};

/**
 * Start listening for MusicDialogs.dialogKeyDown_.
 */
MusicDialogs.startDialogKeyDown = function() {
  document.body.addEventListener('keydown',
      MusicDialogs.dialogKeyDown_, true);
};

/**
 * Stop listening for MusicDialogs.dialogKeyDown_.
 */
MusicDialogs.stopDialogKeyDown = function() {
  document.body.removeEventListener('keydown',
      MusicDialogs.dialogKeyDown_, true);
};
