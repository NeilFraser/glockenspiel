Contents of third-party directory:

* ace
Source: https://github.com/ajaxorg/ace-builds/tree/master/src-min-noconflict
Date: 15 September 2019
Modifications:
- 'snippets' directory deleted.
- all keybinding files deleted.
- all ext files deleted.
- all theme files except 'theme-chrome.js' deleted.
- all mode files except 'mode-javascript.js' deleted.
- edit mode-javascript.js:
  - remove the following entries from "variable.language" to conform to the JS Interpreter:
    - Iterator
    - Proxy
    - Namespace
    - QName
    - XML
    - XMLList
    - ArrayBuffer
    - Float32Array
    - Float64Array
    - Int16Array
    - Int32Array
    - Int8Array
    - Uint16Array
    - Uint32Array
    - Uint8Array
    - Uint8ClampedArray
    - InternalError
    - StopIteration
    - document
  - remove the following entries from "keyword" to conform to the JS Interpreter:
    - const
    - yield
    - import
    - async
    - await
    - of
    - let
    - debugger
    - __parent__
    - __count__
    - __proto__
    - class
    - enum
    - extends
    - super
    - export
    - implements
    - private
    - public
    - interface
    - package
    - protected
    - static
  - remove the following entries from "storage.type" to conform to the JS Interpreter:
    - const
    - let
  - remove the following entries from "support.function" to conform to the JS Interpreter:
    - alert
- all worker files except 'worker-javascript.js' deleted.
- edit worker-javascript.js:
  S&R: "(let|enum|const|yield|class|super|export|import|extends|debugger)" -> "\\0\1\\0"

* blockly
Source: https://github.com/google/blockly/tree/master
Date: 14 October 2019
Modifications: None.

* blockly-games
Source: https://github.com/google/blockly-games/blob/master/appengine/js/slider.js
Date: 15 September 2019
Modifications: 'provide' and 'require' deleted.

* JS-Interpreter
Source: https://blockly.games/third-party/JS-Interpreter/compressed.js
Date: 14 October 2019
Modifications: None.

* soundfont
Source: https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM/glockenspiel-mp3
Date: 15 September 2019
Modifications: rm *[012348].mp3

* soundjs.min.js
Source: https://github.com/CreateJS/SoundJS/blob/master/lib/soundjs.min.js
Date: 15 September 2019
Modifications: None.
