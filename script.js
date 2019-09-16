/**
 * Blockly Games: Music
 *
 * Copyright 2016 Google Inc.
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
 * Number of start blocks on the page (and thus the number of threads).
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
 * Is the composition ready to be submitted to gallery?
 * @type boolean
 */
Music.canSubmit = false;

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
  session['on']('change', Music.editorChanged);
  Music.editor['setValue'](defaultCode, -1);

  // Inject Blockly
  var toolbox = document.getElementById('toolbox');
  Music.workspace = Blockly.inject('blockly',
      {'disable': false,
       'media': 'blockly/media/',
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

  var defaultXml =
      '<xml>' +
        '<block type="music_start" x="180" y="50"></block>' +
      '</xml>';

  var xml = Blockly.Xml.textToDom(defaultXml);
  // Clear the workspace to avoid merge.
  Music.workspace.clear();
  Blockly.Xml.domToWorkspace(xml, Music.workspace);
  Music.workspace.clearUndo();

  Music.reset();
  Music.changeTab(0);
  Music.ignoreEditorChanges_ = false;

  Music.bindClick('runButton', Music.runButtonClick);
  Music.bindClick('resetButton', Music.resetButtonClick);

  // Lazy-load the JavaScript interpreter.
  setTimeout(Music.importInterpreter, 1);

  Music.bindClick('helpButton', Music.showHelp);
  setTimeout(Music.showHelp, 1000);

  var assetsPath = 'soundfont/';
  var sounds = [];
  for (var j = 0; j < CustomFields.FieldPitch.NOTES.length; j++) {
    sounds.push({'src': CustomFields.FieldPitch.NOTES[j] + '.mp3', id: j});
  }
  createjs.Sound.registerSounds(sounds, assetsPath);
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
    Music.ignoreEditorChanges_ = true;
    Music.editor['setValue'](code, -1);
    Music.ignoreEditorChanges_ = false;
  }
};

Music.blocksToCode = function() {
  // For safety, recompute startCount in the generator.
  Music.startCount = 0;
  var code = Blockly.JavaScript.workspaceToCode(Music.workspace);
  var header = '';
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
      // Break link betweeen blocks and JS.
      Blockly.utils.dom.addClass(Music.editorTabs[0], 'tab-disabled');
      Music.blocksEnabled_ = false;
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
 * Load the JavaScript interpreter.
 */
Music.importInterpreter = function() {
  //<script type="text/javascript"
  //  src="third-party/JS-Interpreter/compressed.js"></script>
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', 'JSInterpreter.js');
  document.head.appendChild(script);
};

/**
 * The speed slider has changed.  Erase the start time to force re-computation.
 */
Music.sliderChange = function() {
  Music.startTime = 0;
};

/**
 * On startup draw the expected answer and save it to the answer canvas.
 */
Music.drawAnswer = function() {
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

  Music.drawStave(Music.startCount || 1);
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
    var top = Music.staveTop_(i, n);
    var img = document.createElement('img');
    img.src = 'stave.png';
    img.className = 'stave';
    img.style.top = Math.round(top) + 'px';
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
 * @param {number} i Which stave bar to draw on (base 1).
 * @param {number} time Distance down the stave (on the scale of whole notes).
 * @param {string} pitch MIDI value of note (0 - 12), or rest (Music.REST).
 * @param {number} duration Duration of note or rest (1, 0.5, 0.25...).
 */
Music.drawNote = function(i, time, pitch, duration) {
  while (duration > 1) {
    Music.drawNote(i, time, pitch, 1);
    time += 1;
    duration -= 1;
  }
  var top = Music.staveTop_(i, Music.staveCount);
  if (pitch == Music.REST) {
    top += 21;
    top = Math.round(top);
  } else {
    top += pitch * -4.5 + 32;
    top = Math.floor(top);  // I have no idea why floor is better than round.
  }

  var LEFT_PADDING = 10;
  var WHOLE_WIDTH = 256;
  var left = Math.round(time * WHOLE_WIDTH + LEFT_PADDING);
  var musicContainer = document.getElementById('musicContainer');
  var img = document.createElement('img');
  var name = (pitch == Music.REST ? 'rest' : 'note');
  img.src = name + 's/' + duration + '.png';
  img.className = name;
  img.style.top = top + 'px';
  img.style.left = left + 'px';
  if (pitch != Music.REST) {
    img.title = CustomFields.FieldPitch.NOTES[pitch];
  }
  musicContainer.appendChild(img);
  // Add a splash effect when playing a note.
  var splash = document.createElement('img');
  splash.src = name + 's/' + duration + '.png';
  splash.className = name;
  splash.style.top = top + 'px';
  splash.style.left = left + 'px';
  musicContainer.appendChild(splash);
  // Wait 0 ms to trigger the CSS Transition.
  setTimeout(function() {splash.className = 'splash ' + name;}, 0);
  // Garbage collect the now-invisible note.
  setTimeout(function() {Blockly.utils.dom.removeNode(splash);}, 1000);
  if (pitch == '0' || pitch == '12') {
    var line = document.createElement('img');
    line.src = 'black1x1.gif';
    line.className = 'ledgerLine';
    line.style.top = (top + 32) + 'px';
    line.style.left = (left - 5) + 'px';
    musicContainer.appendChild(line);
  }
};

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
  Music.clock64ths = 0;
  Music.startTime = 0;
  Music.canSubmit = false;

  Music.drawAnswer();
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
};

/**
 * Execute the user's code.  Heaven help us...
 */
Music.execute = function() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
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
  console.log(code);
  if (Music.startCount == 0) {  // Blank workspace.
    Music.resetButtonClick();
  }

  Music.interpreter = new Interpreter(code, Music.initInterpreter);
  for (var i = 1; i <= Music.startCount; i++) {
    var interpreter = new Interpreter('');
    // Replace this thread's global scope with the cross-thread global.
    interpreter.stateStack[0].scope = Music.interpreter.global;
    interpreter.appendCode('start' + i + '();\n');
    Music.threads.push(new Music.Thread(i, interpreter.stateStack));
  }
  setTimeout(Music.tick, 100);
};

/**
 * Execute a 1/64th tick of the program.
 */
Music.tick = function() {
  // Delay between start of each beat (1/64ths of a whole note).
  var scaleDuration = 1000 * (2.5 - 2 * Music.speedSlider.getValue()) / 64;
  if (!Music.startTime) {
    // Either the first tick, or first tick after slider was adjusted.
    Music.startTime = Date.now() - Music.clock64ths * scaleDuration;
  }
  var done = true;
  for (var i = 0, thread; (thread = Music.threads[i]); i++) {
    if (!thread.done) {
      done = false;
      if (thread.pauseUntil64ths <= Music.clock64ths) {
        Music.executeChunk_(thread);
      }
    }
  }

  if (done) {
    // Program completed
    document.getElementById('spinner').style.visibility = 'hidden';
    Music.workspace.highlightBlock(null);
    // Playback complete; allow the user to submit this music to gallery.
    Music.canSubmit = true;
  } else {
    Music.autoScroll();
    Music.clock64ths++;
    var ms = (Music.startTime + Music.clock64ths * scaleDuration) - Date.now();
    Music.pid = setTimeout(Music.tick, ms);
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
  var go;
  do {
    try {
      go = Music.interpreter.step();
    } catch (e) {
      // User error, terminate in shame.
      alert(e);
      go = false;
    }
    if (thread.pauseUntil64ths > Music.clock64ths) {
      // The last executed command requested a pause.
      return;
    }
  } while (go);
  // Thread complete.  Wrap up.
  Music.stopSound(thread);
  if (thread.highlighedBlock) {
    Music.highlight(thread.highlighedBlock, false);
    thread.highlighedBlock = null;
  }
  thread.done = true;
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
 * @param {?string} id ID of block.
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
 * @param {number} pitch MIDI note number to play.
 * @param {?string} id ID of block.
 */
Music.play = function(duration, pitch, id) {
  if (Music.activeThread.resting) {
    // Reorder this thread to the top of the resting threads.
    // Find the min resting thread stave.
    var minResting = Infinity;
    for (var i = 0, thread; (thread = Music.threads[i]); i++) {
      if (thread.resting && thread.stave < minResting) {
        minResting = thread.stave;
      }
    }
    // Swap this thread and the min-thread's staves.
    for (var i = 0, thread; (thread = Music.threads[i]); i++) {
      if (minResting == thread.stave) {
        var swapStave = Music.activeThread.stave;
        Music.activeThread.stave = minResting;
        thread.stave = swapStave;
        break;
      }
    }
    Music.activeThread.resting = false;
  }
  Music.stopSound(Music.activeThread);
  Music.activeThread.sound = createjs.Sound.play(pitch);
  Music.activeThread.pauseUntil64ths = duration * 64 + Music.clock64ths;
  // Make a record of this note.
  Music.activeThread.transcript.push(pitch);
  Music.activeThread.transcript.push(duration);
  Music.drawNote(Music.activeThread.stave, Music.clock64ths / 64,
                 String(pitch), duration);
  Music.animate(id);
};

/**
 * Wait one rest.
 * @param {number} duration Fraction of a whole note length to rest.
 * @param {?string} id ID of block.
 */
Music.rest = function(duration, id) {
  Music.stopSound(Music.activeThread);
  Music.activeThread.pauseUntil64ths = duration * 64 + Music.clock64ths;
  // Make a record of this rest.
  if (Music.activeThread.transcript.length > 1 &&
      Music.activeThread.transcript
          [Music.activeThread.transcript.length - 2] == Music.REST) {
    // Concatenate this rest with previous one.
    Music.activeThread.transcript
        [Music.activeThread.transcript.length - 1] += duration;
  } else {
    Music.activeThread.transcript.push(Music.REST);
    Music.activeThread.transcript.push(duration);
  }
  Music.drawNote(Music.activeThread.stave, Music.clock64ths / 64,
                 String(Music.REST), duration);
  Music.animate(id);
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
  if (id) {
    var m = id.match(/^block_id_([^']+)$/);
    if (m) {
      id = m[1];
    }
  }
  Music.workspace.highlightBlock(id, opt_state);
};

/**
 * One execution thread.
 * @param {number} i Number of this thread (1-4).
 * @param {!Array.<!Interpreter.State>} stateStack JS Interpreter state stack.
 * @constructor
 */
Music.Thread = function(i, stateStack) {
  this.stave = i;  // 1-4
  this.stateStack = stateStack;
  this.transcript = [];
  this.pauseUntil64ths = 0;
  this.highlighedBlock = null;
  // Currently playing sound object.
  this.sound = null;
  // Has not played a note yet.  Level 1-9 the threads need to reorder
  // as the first note is played.  Level 10 is by start block height.
  this.resting = false;
  this.done = false;
};
