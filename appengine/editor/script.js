/**
 * @license
 * Copyright 2016 Google LLC
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
 * @fileoverview JavaScript for Music game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

var Music = {};

Music.HEIGHT = 400;
Music.WIDTH = 400;

/**
 * PID of animation task currently executing.
 * @type number
 */
Music.pid = 0;

/**
 * Number of start blocks on the page (only used for blocks mode).
 */
Music.startCount = 0;

/**
 * Number of staves in the visualization.
 */
Music.staveCount = 0;

/**
 * Number of bars in the visualization.
 */
Music.barCount = 0;

/**
 * JavaScript interpreter for executing program.
 * @type Interpreter
 */
Music.interpreter = null;

/**
 * All executing threads.
 * @type !Array.<!Music.Thread>
 */
Music.threads = [];

/**
 * Time of start of execution.
 * @type {number}
 */
Music.startTime = 0;

/**
 * Number of 1/64ths notes since the start.
 * @type {number}
 */
Music.clock64ths = 0;

/**
 * Currently executing thread.
 * @type Music.Thread
 */
Music.activeThread = null;

/**
 * Constant denoting a rest.
 */
Music.REST = -1;

/**
 * Array of editor tabs (Blockly and ACE).
 * @type Array.<!Element>
 */
Music.editorTabs = null;

/**
 * Is the blocks editor the program source (true) or is the JS editor
 * the program source (false).
 * @private
 */
Music.blocksEnabled_ = true;

/**
 * ACE editor fires change events even on programmatically caused changes.
 * This property is used to signal times when a programmatic change is made.
 */
Music.ignoreEditorChanges_ = true;

/**
 * Array of staves.  Each stave is an array of [pitch, duration] tuples.
 * The first element is the tune's tempo.
 * @type {number|!Array.<!Array.<!Array.<number>>>}
 */
Music.transcript = [0];

/**
 * Number of created Threads.  Always incrementing during execution,
 * does not decrement when a thread finishes.
 */
Music.threadCount = 0;

/**
 * Look-up from machine-readable value (81-105) to human-readable text (A5-A7).
 */
Music.fromMidi = {
  81: 'A5',
  82: 'Bb5',
  83: 'B5',
  84: 'C6',
  85: 'Db6',
  86: 'D6',
  87: 'Eb6',
  88: 'E6',
  89: 'F6',
  90: 'Gb6',
  91: 'G6',
  92: 'Ab6',
  93: 'A6',
  94: 'Bb6',
  95: 'B6',
  96: 'C7',
  97: 'Db7',
  98: 'D7',
  99: 'Eb7',
  100: 'E7',
  101: 'F7',
  102: 'Gb7',
  103: 'G7',
  104: 'Ab7',
  105: 'A7'
};

/**
 * Initialize Blockly and the music.  Called on page load.
 */
Music.init = function() {
  // Switch to zero-based indexing so that later JS levels match the blocks.
  Blockly.Blocks.ONE_BASED_INDEXING = false;
  Blockly.JavaScript.ONE_BASED_INDEXING = false;

  // Setup the tabs.
  function tabHandler(selectedIndex) {
    return function() {
      if (Blockly.utils.dom.hasClass(Music.editorTabs[selectedIndex],'tab-disabled')) {
        return;
      }
      for (var i = 0; i < Music.editorTabs.length; i++) {
        if (selectedIndex == i) {
          Blockly.utils.dom.addClass(Music.editorTabs[i], 'tab-selected');
        } else {
          Blockly.utils.dom.removeClass(Music.editorTabs[i], 'tab-selected');
        }
      }
      Music.changeTab(selectedIndex);
    };
  }
  Music.editorTabs = Array.prototype.slice.call(
      document.querySelectorAll('#editorBar>.tab'));
  for (var i = 0; i < Music.editorTabs.length; i++) {
    Music.bindClick(Music.editorTabs[i], tabHandler(i));
  }

  var paddingBox = document.getElementById('paddingBox');
  var staveBox = document.getElementById('staveBox');
  var musicBox = document.getElementById('musicBox');
  var tabDiv = document.getElementById('tabarea');
  var blocklyDiv = document.getElementById('blockly');
  var editorDiv = document.getElementById('editor');
  var divs = [blocklyDiv, editorDiv];
  var onresize = function(e) {
    var top = paddingBox.offsetTop;
    staveBox.style.top = top + 'px';
    musicBox.style.top = top + 'px';
    tabDiv.style.top = (top - window.pageYOffset) + 'px';
    tabDiv.style.left = '420px';
    tabDiv.style.width = (window.innerWidth - 440) + 'px';
    var divTop =
        Math.max(0, top + tabDiv.offsetHeight - window.pageYOffset) + 'px';
    var divLeft = '420px';
    var divWidth = (window.innerWidth - 440) + 'px';
    for (var i = 0, div; div = divs[i]; i++) {
      div.style.top = divTop;
      div.style.left = divLeft;
      div.style.width = divWidth;
    }
  };
  window.addEventListener('scroll', function() {
      onresize(null);
      Blockly.svgResize(Music.workspace);
    });
  window.addEventListener('resize', onresize);
  onresize(null);

  // Inject JS editor.
  var defaultCode = 'play(7);';
  Music.editor = window['ace']['edit']('editor');
  Music.editor['setTheme']('ace/theme/chrome');
  Music.editor['setShowPrintMargin'](false);
  var session = Music.editor['getSession']();
  session['setMode']('ace/mode/javascript');
  session['setTabSize'](2);
  session['setUseSoftTabs'](true);
  session['setUseWrapMode'](true);
  session['on']('change', Music.editorChanged);
  Music.editor['setValue'](defaultCode, -1);

  // Inject Blockly
  var toolbox = document.getElementById('toolbox');
  Music.workspace = Blockly.inject('blockly',
      {'disable': false,
       'media': 'third-party/blockly/media/',
       'rtl': false,
       'toolbox': toolbox,
       'zoom': {
          'maxScale': 2,
          'controls': true,
          'wheel': true,
          'startScale': 1.0}});
  Music.workspace.addChangeListener(Blockly.Events.disableOrphans);
  Music.workspace.addChangeListener(Music.disableExtraStarts);
  // Prevent collisions with user-defined functions or variables.
  Blockly.JavaScript.addReservedWords('play,rest,' +
      'start0,start1,start2,start3,start4,start5,start6,start7,start8,start9');
  // Only start1-4 are used, but no harm in being safe.

  if (document.getElementById('submitButton')) {
    Music.bindClick('submitButton', Music.submitToGallery);
  }

  // Initialize the slider.
  var sliderSvg = document.getElementById('slider');
  Music.speedSlider = new Slider(10, 35, 130, sliderSvg, Music.sliderChange);

  var xml = document.getElementById('defaultXml');
  // Clear the workspace to avoid merge.
  Music.workspace.clear();
  Blockly.Xml.domToWorkspace(xml, Music.workspace);
  Music.workspace.clearUndo();

  Music.reset();
  Music.changeTab(0);
  Music.ignoreEditorChanges_ = false;

  Music.bindClick('runButton', Music.runButtonClick);
  Music.bindClick('resetButton', Music.resetButtonClick);
  Music.bindClick('submitButton', Music.submitButtonClick);

  // Lazy-load the JavaScript interpreter.
  setTimeout(Music.importInterpreter, 1);
  // Lazy-load the sounds.
  setTimeout(Music.importSounds, 1);

  Music.bindClick('helpButton', Music.showHelp);
  setTimeout(Music.showHelp, 1000);
};

window.addEventListener('load', Music.init);

/**
 * Called by the tab bar when a tab is selected.
 * @param {number} index Which tab is now active (0-1).
 */
Music.changeTab = function(index) {
  var BLOCKS = 0;
  var JAVASCRIPT = 1;
  // Show the correct tab contents.
  var names = ['blockly', 'editor'];
  for (var i = 0, name; name = names[i]; i++) {
    var div = document.getElementById(name);
    div.style.visibility = (i == index) ? 'visible' : 'hidden';
  }
  // Show/hide Blockly divs.
  var names = ['.blocklyTooltipDiv', '.blocklyToolboxDiv'];
  for (var i = 0, name; name = names[i]; i++) {
    var div = document.querySelector(name);
    div.style.visibility = (index == BLOCKS) ? 'visible' : 'hidden';
  }
  // Synchronize the JS editor.
  if (index == JAVASCRIPT && Music.blocksEnabled_) {
    var code = Music.blocksToCode();
    code = code.replace(/, 'block_id_([^']+)'/g, '')
    Music.ignoreEditorChanges_ = true;
    Music.editor['setValue'](code, -1);
    Music.ignoreEditorChanges_ = false;
  }
};

/**
 * Generate JavaScript code from Blockly.
 * @return {string} User-created JavaScript code.
 */
Music.blocksToCode = function() {
  // For safety, recompute startCount in the generator.
  Music.startCount = 0;
  var code = Blockly.JavaScript.workspaceToCode(Music.workspace);
  var header = '';
  var constants = [];
  for (var midi in Music.fromMidi) {
    constants.push(Music.fromMidi[midi] + '=' + midi);
  }
  // Add 'runThread' functions to the start.
  header += 'var ' + constants.join(', ') + ';\n';
  for (var i = 1; i <= Music.startCount; i++) {
    header += 'runThread(start' + i + ');\n';
  }
  return header + '\n' + code;
};

/**
 * Change event for JS editor.  Warn the user, then disconnect the link from
 * blocks to JavaScript.
 */
Music.editorChanged = function() {
  if (Music.ignoreEditorChanges_) {
    return;
  }
  if (Music.blocksEnabled_) {
    if (!Music.workspace.getTopBlocks(false).length ||
        confirm('Once you start editing JavaScript, you can\'t go back to editing blocks. Is this OK?')) {
      // Break link between blocks and JS.
      Blockly.utils.dom.addClass(Music.editorTabs[0], 'tab-disabled');
      Music.blocksEnabled_ = false;
      Music.startCount = 0;
    } else {
      // Abort change, preserve link.
      var code = Music.blocksToCode();
      Music.ignoreEditorChanges_ = true;
      Music.editor['setValue'](code, -1);
      Music.ignoreEditorChanges_ = false;
    }
  } else {
    var code = Music.editor['getValue']();
    if (!code.trim()) {
      // Reestablish link between blocks and JS.
      Music.workspace.clear();
      Blockly.utils.dom.removeClass(Music.editorTabs[0], 'tab-disabled');
      Music.blocksEnabled_ = true;
    }
  }
};

/**
 * Bind a function to a button's click event.
 * On touch-enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Music.bindClick = function(el, func) {
  if (!el) {
    throw TypeError('Element not found: ' + el);
  }
  if (typeof el == 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Load JS-Interpreter.
 */
Music.importInterpreter = function() {
  //<script type="text/javascript"
  //  src="third-party/JS-Interpreter/compressed.js"></script>
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'third-party/JS-Interpreter/compressed.js';
  document.head.appendChild(script);
};

/**
 * Load the sounds.
 */
Music.importSounds = function() {
  //<script type="text/javascript" src="third-party/soundjs.min.js"></script>
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'third-party/soundjs.min.js';
  script.onload = Music.registerSounds;
  document.head.appendChild(script);
};

/**
 * Register the sounds.
 */
Music.registerSounds = function() {
  var assetsPath = 'third-party/soundfont/';
  var sounds = [];
  for (var midi in Music.fromMidi) {
    sounds.push({'src': Music.fromMidi[midi] + '.mp3', id: midi});
  }
  createjs.Sound.registerSounds(sounds, assetsPath);
};

/**
 * The speed slider has changed.  Erase the start time to force re-computation.
 */
Music.sliderChange = function() {
  Music.startTime = 0;
};

/**
 * On startup initialize the canvas.
 */
Music.drawStaveBox = function() {
  // Clear all content.
  document.getElementById('staveBox').innerHTML = '';
  var musicContainer = document.getElementById('musicContainer');
  musicContainer.innerHTML = '';
  Music.barCount = 0;
  // Add spacer to allow scrollbar to scroll past last note/rest.
  // <img src="1x1.gif">
  var img = document.createElement('img');
  img.id = 'musicContainerWidth';
  img.src = '1x1.gif';
  musicContainer.appendChild(img);

  // Draw empty staves.
  var count = Music.transcript.length > 1 ? Music.transcript.length - 1 :
      Music.startCount;
  Music.drawStave(Blockly.utils.math.clamp(count, 1, 4));

  // Repopulate the music from the transcripts.
  for (var i = 1; i < Math.min(5, Music.transcript.length); i++) {
    var clock64 = 0;
    for (var j = 0, tuple; (tuple = Music.transcript[i][j]); j++) {
      Music.drawNote(i, clock64, tuple[0], tuple[1]);
      clock64 += tuple[1] * 64;
    }
  }
};

/**
 * Draw and position the specified number of stave bars.
 * @param {number} n Number of stave bars.
 */
Music.drawStave = function(n) {
  Music.staveCount = n;
  var staveBox = document.getElementById('staveBox');
  // <img src="stave.png" class="stave" style="top: 100px">
  for (var i = 1; i <= n; i++) {
    var top = Math.round(Music.staveTop_(i, n));
    var img = document.createElement('img');
    img.src = 'stave.png';
    img.className = 'stave';
    img.style.top = top + 'px';
    staveBox.appendChild(img);
    var img = document.createElement('img');
    img.className = 'stave-15';
    img.src = '15.png';
    img.style.top = (top - 12) + 'px';
    img.style.left = '10px';
    staveBox.appendChild(img);
  }
};

/**
 * Return the height of a stave bar.
 * @param {number} i Which stave bar to compute (base 1).
 * @param {number} n Number of stave bars.
 * @return {number} Top edge of stave bar.
 * @private
 */
Music.staveTop_ = function(i, n) {
  var staveHeight = 69;
  var boxHeight = 400 - 15;  // Subtract the scrollbar.
  var top = (2 * i - 1) / (2 * n) * boxHeight;
  top -= staveHeight / 2;  // Center the stave on the desired spot.
  top += 5;  // Notes stick up a bit.
  return top;
};

/**
 * Draw and position the specified note or rest.
 * @param {number} stave Which stave bar to draw on (base 1).
 * @param {number} clock64 Distance down the stave (on the scale of 1/64 notes).
 * @param {number} pitch MIDI value of note (81-105), or rest (Music.REST).
 * @param {number} duration Duration of note or rest (1, 0.5, 0.25...).
 */
Music.drawNote = function(stave, clock64, pitch, duration) {
  // Split notes/rests with odd durations into legal quanta.
  var legalDurations = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125];
  for (var i = 0; i < legalDurations.length; i++) {
    var legalDuration = legalDurations[i];
    if (duration == legalDuration) {
      break;  // Valid note.
    }
    while (duration > legalDuration) {
      Music.drawNote(stave, clock64, pitch, legalDuration);
      pitch = Music.REST;  // Subsequent duration is a pause.
      clock64 += legalDuration * 64;
      duration -= legalDuration;
    }
  }
  if (duration < legalDurations[legalDurations.length - 1]) {
    return;  // Too small to display.
  }

  var time = clock64 / 64;
  var top = Music.staveTop_(stave, Music.staveCount);
  var ledgerTop = top;
  if (pitch == Music.REST) {
    top += 21;
    top = Math.round(top);
  } else {
    top += Music.drawNote.heights_[pitch];
    top = Math.floor(top);  // I have no idea why floor is better than round.
  }

  var LEFT_PADDING = 10;
  var WHOLE_WIDTH = 256;
  var left = Math.round(time * WHOLE_WIDTH + LEFT_PADDING);
  var ledgerLeft = left - 5;
  var musicContainer = document.getElementById('musicContainer');
  var img = document.createElement('img');
  var flip = '';
  if (pitch != Music.REST) {
    flip = (duration == 1 || pitch < 94) ? '-low' : '-high';
  }
  img.src = (pitch == Music.REST ? 'rests/' : 'notes/') + duration + flip + '.png';
  if (pitch == Music.REST) {
    img.className = 'rest';
  } else {
    img.className = 'note' + flip;
    img.title = Music.fromMidi[pitch];
    if (flip == '-high') {
      top += 28;
      left -= 6;
    }
  }
  img.style.top = top + 'px';
  img.style.left = left + 'px';
  musicContainer.appendChild(img);
  var flat;
  if (pitch != Music.REST && Music.fromMidi[pitch].indexOf('b') != -1) {
    var flat = document.createElement('img');
    flat.src = 'notes/flat.png';
    flat.className = 'flat';
    flat.title = img.title;
    if (flip == '-low') {
      top += 18;
      left -= 10;
    } else {
      top -= 10;
      left -= 4;
    }
    flat.style.top = top + 'px';
    flat.style.left = left + 'px';
    musicContainer.appendChild(flat);
  }

  if (Music.clock64ths == clock64) {
    // Add a splash effect when playing a note or rest.
    var splash = img.cloneNode();
    musicContainer.appendChild(splash);
    // Wait 0 ms to trigger the CSS Transition.
    setTimeout(function() {splash.className = 'splash ' + img.className;}, 0);
    // Garbage collect the now-invisible note.
    setTimeout(function() {Blockly.utils.dom.removeNode(splash);}, 1000);
  }

  if (pitch != Music.REST) {
    if (pitch >= 104) {
      // First ledger line above stave.
      Music.makeLedgerLine_(ledgerTop + 9, ledgerLeft, duration, musicContainer);
    }
    if (pitch <= 84) {
      // First ledger line below stave.
      Music.makeLedgerLine_(ledgerTop + 63, ledgerLeft, duration, musicContainer);
    }
    if (pitch <= 81) {
      // Second ledger line below stave.
      Music.makeLedgerLine_(ledgerTop + 63 + 9, ledgerLeft, duration, musicContainer);
    }
  }
};

/**
 * Create a ledger line above or below the stave.
 * @param {number} top Top coordinate of line.
 * @param {number} left Left coordinate of line.
 * @param {number} duration Length of note (whole notes need longer lines).
 * @param {!Element} container Parent element to append line to.
 * @private
 */
Music.makeLedgerLine_ = function(top, left, duration, container) {
  var line = document.createElement('img');
  line.src = 'black1x1.gif';
  line.className = duration == 1 ? 'ledgerLineWide' : 'ledgerLine';
  line.style.top = top + 'px';
  line.style.left = left + 'px';
  container.appendChild(line);
};

/**
 * Lookup table for height of each note.
 * @private
 */
Music.drawNote.heights_ = {};
(function() {
  var height = 40.5;
  for (var midi in Music.fromMidi) {
    var note = Music.fromMidi[midi];
    Music.drawNote.heights_[midi] = height;
    if (note.indexOf('b') == -1) {
      height -= 4.5;
    }
  }
})();

/**
 * Show the help pop-up.
 */
Music.showHelp = function() {
  var help = document.getElementById('help');
  var button = document.getElementById('helpButton');
  var style = {
    width: '50%',
    left: '25%',
    top: '5em'
  };

  MusicDialogs.showDialog(help, button, true, true, style, Music.hideHelp);
  MusicDialogs.startDialogKeyDown();
};

/**
 * Hide the help pop-up.
 */
Music.hideHelp = function() {
  MusicDialogs.stopDialogKeyDown();
};

/**
 * Ensure that there aren't more than the maximum allowed start blocks.
 * @param {!Blockly.Events.Abstract} e Change event.
 */
Music.disableExtraStarts = function(e) {
  var toolbox = document.getElementById('toolbox');
  var toolboxStart = document.getElementById('music_start');
  if (!toolboxStart) {
    return;
  }
  var maxStarts = Music.expectedAnswer ? Music.expectedAnswer.length : 4;
  var oldStartCount = Music.startCount;

  if (e instanceof Blockly.Events.Create) {
    var startBlocks = [];
    var blocks = Music.workspace.getTopBlocks(false);
    for (var i = 0, block; (block = blocks[i]); i++) {
      if (block.type == 'music_start' && !block.isInsertionMarker()) {
        startBlocks.push(block);
      }
    }
    if (maxStarts < startBlocks.length) {
      // Too many start blocks.  Disable any new ones.
      for (var i = 0, id; (id = e.ids[i]); i++) {
        for (var j = 0, startBlock; (startBlock = startBlocks[j]); j++) {
          if (startBlock.id == id) {
            startBlock.setDisabled(true);
          }
        }
      }
    }
    if (maxStarts <= startBlocks.length) {
      // Disable start block in toolbox.
      toolboxStart.setAttribute('disabled', 'true');
      Music.workspace.updateToolbox(toolbox);
      Music.startCount = maxStarts;
    } else {
      Music.startCount = startBlocks.length;
    }
  } else if (e instanceof Blockly.Events.Delete) {
    var startBlocksEnabled = [];
    var startBlocksDisabled = [];
    var blocks = Music.workspace.getTopBlocks(true);
    for (var i = 0, block; (block = blocks[i]); i++) {
      if (block.type == 'music_start') {
        (block.isEnabled() ? startBlocksEnabled : startBlocksDisabled)
            .push(block);
      }
    }
    while (maxStarts > startBlocksEnabled.length &&
           startBlocksDisabled.length) {
      // Enable a disabled start block.
      var block = startBlocksDisabled.shift();
      block.setDisabled(false);
      startBlocksEnabled.push(block);
    }
    if (maxStarts > startBlocksEnabled.length) {
      // Enable start block in toolbox.
      toolboxStart.setAttribute('disabled', 'false');
      Music.workspace.updateToolbox(toolbox);
    }
    Music.startCount = startBlocksEnabled.length;
  }
  if (Music.startCount != oldStartCount) {
    Music.resetButtonClick();
  }
};

/**
 * Reset the music to the start position, clear the display, and kill any
 * pending tasks.
 */
Music.reset = function() {
  // Kill any task.
  clearTimeout(Music.pid);
  for (var i = 0, thread; (thread = Music.threads[i]); i++) {
    Music.stopSound(thread);
  }
  Music.interpreter = null;
  Music.activeThread = null;
  Music.threads.length = 0;
  Music.threadCount = 0;
  Music.clock64ths = 0;
  Music.startTime = 0;
  Music.transcript.length = 0;

  Music.drawStaveBox();
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Music.runButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (Music.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  document.getElementById('spinner').style.visibility = 'visible';
  Music.execute();
};

/**
 * Click the reset button.  Reset the Music.
 * @param {!Event=} opt_e Mouse or touch event.
 */
Music.resetButtonClick = function(opt_e) {
  // Prevent double-clicks or double-taps.
  if (opt_e && Music.eventSpam(opt_e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  document.getElementById('spinner').style.visibility = 'hidden';
  document.getElementById('submitButton').setAttribute('disabled', '');

  Music.workspace.highlightBlock(null);
  Music.reset();
};

/**
 * Inject the Music API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS Interpreter.
 * @param {!Interpreter.Object} scope Global scope.
 */
Music.initInterpreter = function(interpreter, scope) {
  // API
  var wrapper;
  wrapper = function(duration, pitch, id) {
    Music.play(duration, pitch, id);
  };
  interpreter.setProperty(scope, 'play',
      interpreter.createNativeFunction(wrapper));

  wrapper = function(duration, id) {
    Music.rest(duration, id);
  };
  interpreter.setProperty(scope, 'rest',
      interpreter.createNativeFunction(wrapper));

  wrapper = function(func) {
    if (Music.threads.length > 16) throw 'Too many threads.';
    // Create a new state stack that will run the provided function.
    // Program state (empty).
    var stateStack = [];
    var node = new interpreter.nodeConstructor({options:{}});
    node['type'] = 'Program';
    node['body'] = [];
    var state = new Interpreter.State(node, interpreter.global);
    state.done = false;
    stateStack.push(state);
    // ExpressionStatement node.
    var node = new interpreter.nodeConstructor({options:{}});
    node['type'] = 'ExpressionStatement';
    var state = new Interpreter.State(node, interpreter.global);
    state.done_ = true;
    stateStack.push(state);
    // CallExpression node (fully populated, ready to call).
    var node = new interpreter.nodeConstructor({options:{}});
    node['type'] = 'CallExpression';
    var state = new Interpreter.State(node, interpreter.global);
    state.doneCallee_ = true;
    state.funcThis_ = interpreter.global;
    state.func_ = func;
    state.doneArgs_ = true;
    state.arguments_ = [];
    stateStack.push(state);
    // Add this state stack as a new thread.
    var thread = new Music.Thread(stateStack);
    Music.threads.push(thread);
  };
  interpreter.setProperty(scope, 'runThread',
      interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Music.execute = function() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    console.log('Waiting for JS-Interpreter to load.')
    setTimeout(Music.execute, 250);
    return;
  }
  if (!('createjs' in window) || !createjs.Sound.isReady()) {
    // Sound JS lazy loads and hasn't arrived yet.  Try again later.
    console.log('Waiting for SoundJS to load.')
    setTimeout(Music.execute, 250);
    return;
  }

  Music.reset();
  Blockly.selected && Blockly.selected.unselect();

  // Create an interpreter whose global scope will be the cross-thread global.
  var code;
  if (Music.blocksEnabled_) {
    code = Music.blocksToCode();
  } else {
    code = Music.editor['getValue']();
  }

  Music.interpreter = new Interpreter(code, Music.initInterpreter);
  Music.threads.push(new Music.Thread(Music.interpreter.stateStack));
  setTimeout(Music.tick, 100);
};

/**
 * Time in milliseconds for 1/64th of a whole note.
 * @return {number} Time in ms.
 */
Music.getTempo = function() {
  return 1000 * (2.5 - 2 * Music.speedSlider.getValue()) / 64;
};

/**
 * Execute a 1/64th tick of the program.
 */
Music.tick = function() {
  // Delay between start of each beat (1/64ths of a whole note).
  var scaleDuration = Music.getTempo();
  if (!Music.startTime) {
    // Either the first tick, or first tick after slider was adjusted.
    Music.startTime = Date.now() - Music.clock64ths * scaleDuration;
  }

  if (Music.threads.length) {
    var ticks = 32;
    do {
      if (ticks-- == 0) {
        console.warn('Thread creation out of control.');
        break;
      }
      var oldCount = Music.threadCount;
      // Take a copy of the threads since executing a thread could add more
      // threads or splice itself out of the list.
      var threadCopy = Music.threads.concat();
      for (var i = 0, thread; (thread = threadCopy[i]); i++) {
        if (thread.pauseUntil64ths <= Music.clock64ths) {
          Music.executeChunk_(thread);
        }
      }
    } while (oldCount != Music.threadCount);
    Music.autoScroll();
    Music.clock64ths++;
    var ms = (Music.startTime + Music.clock64ths * scaleDuration) - Date.now();
    Music.pid = setTimeout(Music.tick, ms);
  } else {
    // Program completed
    document.getElementById('spinner').style.visibility = 'hidden';
    Music.workspace.highlightBlock(null);
    // Playback complete; allow the user to submit this music to glockenspiel.
    document.getElementById('submitButton').removeAttribute('disabled');
    // Store the tempo in the first position of the transcript.
    Music.transcript[0] = Music.getTempo();
  }
};

/**
 * Execute a bite-sized chunk of the user's code.
 * @param {!Music.Thread} thread Thread to execute.
 * @private
 */
Music.executeChunk_ = function(thread) {
  Music.activeThread = thread;
  Music.interpreter.stateStack = thread.stateStack;
  // Switch the interpreter to run the provided thread.
  Music.interpreter.stateStack = thread.stateStack;
  var ticks = 10000;
  var go;
  do {
    try {
      go = Music.interpreter.step();
    } catch (e) {
      // User error, terminate in shame.
      alert(e);
      go = false;
    }
    if (ticks-- == 0) {
      console.warn('Thread ' + thread.stave + ' is running slowly.');
      return;
    }
    if (thread.pauseUntil64ths > Music.clock64ths) {
      // Previously executed command (play or rest) requested a pause.
      return;
    }
  } while (go);
  thread.dispose();
};

/**
 * Stop the specified thread from playing the current sound.
 * @param {!Music.Thread} thread Thread object.
 */
Music.stopSound = function(thread) {
  var sound = thread.sound;
  if (sound) {
    // Firefox requires 100ms to start a note playing, so delaying the end
    // eliminates the staccato.  Adds a nice smoothness to Chrome.
    setTimeout(sound['stop'].bind(sound), 100);
    thread.sound = null;
  }
};

/**
 * Scroll the music display horizontally to the current time.
 */
Music.autoScroll = function() {
  var musicBox = document.getElementById('musicBox');
  var musicContainer = document.getElementById('musicContainer');
  var musicContainerWidth = document.getElementById('musicContainerWidth');

  // Ensure a half-screenfull of blank music to the right of last note.
  var LEFT_PADDING = 10;
  var WHOLE_WIDTH = 256;
  var RIGHT_PADDING = 100;
  if (Music.clock64ths) {
    var newWidth = Math.round(Music.clock64ths / 64 * WHOLE_WIDTH +
                              LEFT_PADDING + RIGHT_PADDING);
  } else {
    var newWidth = musicBox.scrollWidth + RIGHT_PADDING;
  }
  musicContainerWidth.width = newWidth;
  // Draw a bar at one whole note intervals on all staves.
  while (Music.barCount < Math.floor(newWidth / WHOLE_WIDTH)) {
    Music.barCount++;
    for (var j = 1; j <= Music.staveCount; j++) {
      var top = Music.staveTop_(j, Music.staveCount);
      var img = document.createElement('img');
      img.src = 'black1x1.gif';
      img.className = 'barLine';
      img.style.top = (top + 18) + 'px';
      img.style.left = (Music.barCount * WHOLE_WIDTH + LEFT_PADDING - 5) + 'px';
      musicContainer.appendChild(img);
    }
  }

  var musicBoxMid = (400 - 36) / 2;  // There's a 36px margin for the clef.
  musicBox.scrollLeft = Music.clock64ths * (WHOLE_WIDTH / 64) - musicBoxMid;
};

/**
 * Highlight a block and pause.
 * @param {string|undefined} id ID of block.
 */
Music.animate = function(id) {
  if (id) {
    if (Music.activeThread.highlighedBlock) {
      Music.highlight(Music.activeThread.highlighedBlock, false);
    }
    Music.highlight(id, true);
    Music.activeThread.highlighedBlock = id;
  }
};

/**
 * Play one note.
 * @param {number} duration Fraction of a whole note length to play.
 * @param {number} pitch MIDI note number to play (81-105).
 * @param {string} opt_id ID of block.
 */
Music.play = function(duration, pitch, opt_id) {
  pitch = Math.round(pitch);
  if (!Music.fromMidi[pitch]) {
    console.warn('MIDI note out of range (81-105): ' + pitch);
    Music.rest(duration, id);
    return;
  }
  Music.stopSound(Music.activeThread);
  Music.activeThread.sound = createjs.Sound.play(pitch);
  Music.activeThread.pauseUntil64ths = duration * 64 + Music.clock64ths;
  // Make a record of this note.
  Music.activeThread.appendTranscript(pitch, duration);
  Music.drawNote(Music.activeThread.stave, Music.clock64ths,
                 pitch, duration);
  Music.animate(opt_id);
};

/**
 * Wait one rest.
 * @param {number} duration Fraction of a whole note length to rest.
 * @param {string=} opt_id ID of block.
 */
Music.rest = function(duration, opt_id) {
  Music.stopSound(Music.activeThread);
  Music.activeThread.pauseUntil64ths = duration * 64 + Music.clock64ths;
  // Make a record of this rest.
  Music.activeThread.appendTranscript(Music.REST, duration);
  Music.drawNote(Music.activeThread.stave, Music.clock64ths,
                 Music.REST, duration);
  Music.animate(opt_id);
};

/**
 * Determine if this event is unwanted.
 * @param {!Event} e Mouse or touch event.
 * @return {boolean} True if spam.
 */
Music.eventSpam = function(e) {
  // Touch screens can generate 'touchend' followed shortly thereafter by
  // 'click'.  For now, just look for this very specific combination.
  // Some devices have both mice and touch, but assume the two won't occur
  // within two seconds of each other.
  var touchMouseTime = 2000;
  if (e.type == 'click' &&
      Music.eventSpam.previousType_ == 'touchend' &&
      Music.eventSpam.previousDate_ + touchMouseTime > Date.now()) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  // Users double-click or double-tap accidentally.
  var doubleClickTime = 400;
  if (Music.eventSpam.previousType_ == e.type &&
      Music.eventSpam.previousDate_ + doubleClickTime > Date.now()) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  Music.eventSpam.previousType_ = e.type;
  Music.eventSpam.previousDate_ = Date.now();
  return false;
};

Music.eventSpam.previousType_ = null;
Music.eventSpam.previousDate_ = 0;

/**
 * Highlight the block (or clear highlighting).
 * @param {?string} id ID of block that triggered this action.
 * @param {boolean=} opt_state If undefined, highlight specified block and
 * automatically unhighlight all others.  If true or false, manually
 * highlight/unhighlight the specified block.
 */
Music.highlight = function(id, opt_state) {
  if (id && typeof id == 'string') {
    var m = id.match(/^block_id_([^']+)$/);
    if (m) {
      id = m[1];
    }
  }
  Music.workspace.highlightBlock(id, opt_state);
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Music.submitButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (Music.eventSpam(e)) {
    return;
  }
  if (location.protocol == 'file:') {
    alert('Cannot submit XHR from "file:" URL.');
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/submit');
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
    if (xhr.readyState == 4) {
      var text = (xhr.status == 200) ? xhr.responseText :
          'XHR error.\nStatus: ' + xhr.status;
      alert(text);
    }
  };
  xhr.send('data=' + JSON.stringify(Music.transcript));
};

/**
 * One execution thread.
 * @param {!Array.<!Interpreter.State>} stateStack JS Interpreter state stack.
 * @constructor
 */
Music.Thread = function(stateStack) {
  this.id = Music.threadCount++;
  console.info('Thread ' + this.id + ' created.');
  // Stave set to undefined means this thread has not played anything yet.
  // Stave set to 1-4 means this thread is visualized.
  // Stave set above 4 will play but not be visualized.
  this.stave = undefined;
  this.stateStack = stateStack;
  this.pauseUntil64ths = 0;
  this.highlighedBlock = null;
  // Currently playing sound object.
  this.sound = null;
};

Music.Thread.prototype.appendTranscript = function(pitch, duration) {
  if (this.stave === undefined) {
    // Find all stave numbers currently in use.
    var staves = [];
    for (var i = 0, thread; (thread = Music.threads[i]); i++) {
      if (thread.stave !== undefined) {
        staves[thread.stave] = true;
      }
    }
    // Search for the next available stave.
    var i = 1;
    while (staves[i]) {
      i++;
    }
    this.stave = i;
    // Create a new transcript stave if this stave is not recycled.
    if (!Music.transcript[i]) {
      Music.transcript[i] = [];
    }
    // Compute length of existing content in this transcript stave.
    var existingDuration = 0;
    var transcript = Music.transcript[i];
    for (var i = 0; i < transcript.length; i++) {
      existingDuration += transcript[i][1];
    }
    // Add pause to line up this transcript stave with the clock.
    var deltaDuration = Music.clock64ths / 64 - existingDuration;
    deltaDuration = Math.round(deltaDuration * 1000000) / 1000000;
    if (deltaDuration > 0) {
      transcript.push([Music.REST, deltaDuration]);
    }
    // Redraw the visualization with the new number of staves.
    Music.drawStaveBox();
  }
  Music.transcript[this.stave].push([pitch, duration]);
};


/**
 * Thread complete.  Wrap up.
 */
Music.Thread.prototype.dispose = function() {
  Music.stopSound(this);
  if (this.highlighedBlock) {
    Music.highlight(this.highlighedBlock, false);
    this.highlighedBlock = null;
  }
  console.info('Thread ' + this.id + ' completed.');
  Blockly.utils.arrayRemove(Music.threads, this);
};
