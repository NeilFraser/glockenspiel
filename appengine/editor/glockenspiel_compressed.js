/*

 Copyright 2016 Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
var FieldPitch=function(a){FieldPitch.superClass_.constructor.call(this,a)};Blockly.utils.object.inherits(FieldPitch,Blockly.FieldTextInput);FieldPitch.NOTES="A5 B5 C6 D6 E6 F6 G6 A6 B6 C7 D7 E7 F7 G7 A7".split(" ");
FieldPitch.prototype.showEditor_=function(){FieldPitch.superClass_.showEditor_.call(this);if(Blockly.WidgetDiv.DIV.firstChild){var a=this.dropdownCreate_();Blockly.DropDownDiv.getContentDiv().appendChild(a);a=this.sourceBlock_.getColourBorder();a=a.colourBorder||a.colourLight;Blockly.DropDownDiv.setColour(this.sourceBlock_.getColour(),a);Blockly.DropDownDiv.showPositionedByField(this,this.dropdownDispose_.bind(this));this.clickWrapper_=Blockly.bindEvent_(this.imageElement_,"click",this,this.hide_);
this.moveWrapper_=Blockly.bindEvent_(this.imageElement_,"mousemove",this,this.onMouseMove);this.updateGraph_()}};FieldPitch.prototype.dropdownCreate_=function(){this.imageElement_=document.createElement("div");this.imageElement_.id="notePicker";return this.imageElement_};FieldPitch.prototype.dropdownDispose_=function(){Blockly.unbindEvent_(this.clickWrapper_);Blockly.unbindEvent_(this.moveWrapper_)};FieldPitch.prototype.hide_=function(){Blockly.WidgetDiv.hide();Blockly.DropDownDiv.hideWithoutAnimation()};
FieldPitch.prototype.onMouseMove=function(a){var b=this.imageElement_.getBoundingClientRect();a=Blockly.utils.math.clamp(Math.round(13.5-(a.clientY-b.top-13.5)/7.5),0,14);this.imageElement_.style.backgroundPosition=37*-a+"px 0";this.setEditorValue_(FieldPitch.NOTES[a])};FieldPitch.prototype.render_=function(){FieldPitch.superClass_.render_.call(this);this.updateGraph_()};
FieldPitch.prototype.updateGraph_=function(){if(this.imageElement_){var a=this.getValue();a=FieldPitch.NOTES.indexOf(a);this.imageElement_.style.backgroundPosition=37*-a+"px 0"}};FieldPitch.prototype.doClassValidation_=function(a){return null===a||void 0===a?null:-1==FieldPitch.NOTES.indexOf(a)?null:a};/*

 Copyright 2012 Neil Fraser
 SPDX-License-Identifier: Apache-2.0
*/
Blockly.Blocks.music_pitch={init:function(){this.appendDummyInput().appendField(new FieldPitch("C7"),"PITCH");this.setOutput(!0,"Number");this.setColour(Blockly.Msg.MATH_HUE);this.setTooltip("One note (C7 is 96).")}};Blockly.JavaScript.music_pitch=function(a){return[a.getFieldValue("PITCH"),Blockly.JavaScript.ORDER_ATOMIC]};
Blockly.Blocks.music_note={init:function(){this.jsonInit({message0:"play %1 note %2",args0:[{type:"field_dropdown",name:"DURATION",options:[[{src:"notes/1-low.png",width:9,height:19,alt:"whole"},"1"],[{src:"notes/0.5-low.png",width:9,height:19,alt:"half"},"1/2"],[{src:"notes/0.25-low.png",width:9,height:19,alt:"quarter"},"1/4"],[{src:"notes/0.125-low.png",width:9,height:19,alt:"eighth"},"1/8"],[{src:"notes/0.0625-low.png",width:9,height:19,alt:"sixteenth"},"1/16"],[{src:"notes/0.03125-low.png",width:9,
height:19,alt:"thirtysecond"},"1/32"]]},{type:"input_value",name:"PITCH",check:["Number","Array"]}],inputsInline:!0,previousStatement:null,nextStatement:null,colour:160,tooltip:"Plays one musical note of the specified duration and pitch."})}};Blockly.JavaScript.music_note=function(a){let b=Blockly.JavaScript.valueToCode(a,"PITCH",Blockly.JavaScript.ORDER_COMMA)||"C7";return`play(${a.getFieldValue("DURATION")}, ${b}, 'block_id_${a.id}');\n`};
Blockly.Blocks.music_rest={init:function(){this.jsonInit({message0:"rest %1",args0:[{type:"field_dropdown",name:"DURATION",options:[[{src:"rests/1.png",width:10,height:20,alt:"whole"},"1"],[{src:"rests/0.5.png",width:10,height:20,alt:"half"},"1/2"],[{src:"rests/0.25.png",width:10,height:20,alt:"quarter"},"1/4"],[{src:"rests/0.125.png",width:10,height:20,alt:"eighth"},"1/8"],[{src:"rests/0.0625.png",width:10,height:20,alt:"sixteenth"},"1/16"],[{src:"rests/0.03125.png",width:10,height:20,alt:"thirtysecond"},
"1/32"]]}],inputsInline:!0,previousStatement:null,nextStatement:null,colour:160,tooltip:"Waits for the specified duration."})}};Blockly.JavaScript.music_rest=function(a){return`rest(${a.getFieldValue("DURATION")}, 'block_id_${a.id}');\n`};Blockly.Blocks.music_start={init:function(){this.jsonInit({message0:"when %1 clicked",args0:[{type:"field_image",src:"play.png",width:17,height:17,alt:"\u25b6"}],message1:"%1",args1:[{type:"input_statement",name:"STACK"}],colour:0,tooltip:"Executes the blocks inside when the 'Run Program' button is clicked."})}};
Blockly.JavaScript.music_start=function(a){Music.startCount++;a=Blockly.JavaScript.statementToCode(a,"STACK");Blockly.JavaScript.definitions_["%start"+Music.startCount]=`function start${Music.startCount}() {\n${a}}\n`;return null};const original_math_arithmetic=Blockly.JavaScript.math_arithmetic;
Blockly.JavaScript.math_arithmetic=function(a){let [b,c]=original_math_arithmetic(a);a=Object.values(Music.fromMidi);for(let d=0;d<a.length;d++){const f=a[d-1],e=a[d],g=a[d+1];f&&b===e+" - 1"&&(b=f,c=Blockly.JavaScript.ORDER_ATOMIC);!g||b!==e+" + 1"&&b!=="1 + "+e||(b=g,c=Blockly.JavaScript.ORDER_ATOMIC)}return[b,c]};/*

 Copyright 2013 Neil Fraser
 SPDX-License-Identifier: Apache-2.0
*/
var MusicDialogs={isDialogVisible_:!1,dialogOrigin_:null,dialogDispose_:null,showDialog:function(a,b,c,d,f,e){function g(){MusicDialogs.isDialogVisible_&&(h.style.visibility="visible",h.style.zIndex=10,k.style.visibility="hidden")}if(!a)throw TypeError("Content not found: "+a);MusicDialogs.isDialogVisible_&&MusicDialogs.hideDialog(!1);Blockly.getMainWorkspace()&&Blockly.hideChaff(!0);MusicDialogs.isDialogVisible_=!0;MusicDialogs.dialogOrigin_=b;MusicDialogs.dialogDispose_=e;const h=document.getElementById("dialog");
e=document.getElementById("dialogShadow");const k=document.getElementById("dialogBorder");for(const l in f)h.style[l]=f[l];d&&(e.style.visibility="visible",e.style.opacity=.3,e.style.zIndex=9,d=document.createElement("div"),d.id="dialogHeader",h.appendChild(d),MusicDialogs.dialogMouseDownWrapper_=Blockly.bindEvent_(d,"mousedown",null,MusicDialogs.dialogMouseDown_));h.appendChild(a);a.className=a.className.replace("dialogHiddenContent","");try{b.blur()}catch(l){}c&&b?(MusicDialogs.matchBorder_(b,!1,
.2),MusicDialogs.matchBorder_(h,!0,.8),setTimeout(g,175)):g()},dialogStartX_:0,dialogStartY_:0,dialogMouseDown_:function(a){MusicDialogs.dialogUnbindDragEvents_();if(!Blockly.utils.isRightButton(a)){var b=document.getElementById("dialog");MusicDialogs.dialogStartX_=b.offsetLeft-a.clientX;MusicDialogs.dialogStartY_=b.offsetTop-a.clientY;MusicDialogs.dialogMouseUpWrapper_=Blockly.bindEvent_(document,"mouseup",null,MusicDialogs.dialogUnbindDragEvents_);MusicDialogs.dialogMouseMoveWrapper_=Blockly.bindEvent_(document,
"mousemove",null,MusicDialogs.dialogMouseMove_);a.stopPropagation()}},dialogMouseMove_:function(a){const b=document.getElementById("dialog");let c=MusicDialogs.dialogStartX_+a.clientX;a=MusicDialogs.dialogStartY_+a.clientY;a=Math.max(a,0);a=Math.min(a,window.innerHeight-b.offsetHeight);c=Math.max(c,0);c=Math.min(c,window.innerWidth-b.offsetWidth);b.style.left=c+"px";b.style.top=a+"px"},dialogUnbindDragEvents_:function(){MusicDialogs.dialogMouseUpWrapper_&&(Blockly.unbindEvent_(MusicDialogs.dialogMouseUpWrapper_),
MusicDialogs.dialogMouseUpWrapper_=null);MusicDialogs.dialogMouseMoveWrapper_&&(Blockly.unbindEvent_(MusicDialogs.dialogMouseMoveWrapper_),MusicDialogs.dialogMouseMoveWrapper_=null)},hideDialog:function(a){function b(){d.style.zIndex=-1;d.style.visibility="hidden";document.getElementById("dialogBorder").style.visibility="hidden"}document.body.style.cursor="";if(MusicDialogs.isDialogVisible_){MusicDialogs.dialogUnbindDragEvents_();MusicDialogs.dialogMouseDownWrapper_&&(Blockly.unbindEvent_(MusicDialogs.dialogMouseDownWrapper_),
MusicDialogs.dialogMouseDownWrapper_=null);MusicDialogs.isDialogVisible_=!1;MusicDialogs.dialogDispose_&&MusicDialogs.dialogDispose_();MusicDialogs.dialogDispose_=null;var c=!1===a?null:MusicDialogs.dialogOrigin_;a=document.getElementById("dialog");var d=document.getElementById("dialogShadow");d.style.opacity=0;c&&a?(MusicDialogs.matchBorder_(a,!1,.8),MusicDialogs.matchBorder_(c,!0,.2),setTimeout(b,175)):b();a.style.visibility="hidden";a.style.zIndex=-1;for((c=document.getElementById("dialogHeader"))&&
c.parentNode.removeChild(c);a.firstChild;)c=a.firstChild,c.className+=" dialogHiddenContent",document.body.appendChild(c)}},matchBorder_:function(a,b,c){function d(){f.style.width=e.width+"px";f.style.height=e.height+"px";f.style.left=e.x+"px";f.style.top=e.y+"px";f.style.opacity=c}if(a){var f=document.getElementById("dialogBorder"),e=MusicDialogs.getBBox_(a);b?(f.className="dialogAnimate",setTimeout(d,1)):(f.className="",d());f.style.visibility="visible"}},getBBox_:function(a){var b=Blockly.utils.style.getPageOffset(a);
b={x:b.x,y:b.y};a.getBBox?(a=a.getBBox(),b.height=a.height,b.width=a.width):(b.height=a.offsetHeight,b.width=a.offsetWidth);return b},storageAlert:function(a,b){var c=document.getElementById("containerStorage");c.textContent="";b=b.split("\n");for(const d of b)b=document.createElement("p"),b.appendChild(document.createTextNode(d)),c.appendChild(b);c=document.getElementById("dialogStorage");MusicDialogs.showDialog(c,a,!0,!0,{width:"50%",left:"25%",top:"5em"},MusicDialogs.stopDialogKeyDown);MusicDialogs.startDialogKeyDown()},
dialogKeyDown_:function(a){!MusicDialogs.isDialogVisible_||13!=a.keyCode&&27!=a.keyCode&&32!=a.keyCode||(MusicDialogs.hideDialog(!0),a.stopPropagation(),a.preventDefault())},startDialogKeyDown:function(){document.body.addEventListener("keydown",MusicDialogs.dialogKeyDown_,!0)},stopDialogKeyDown:function(){document.body.removeEventListener("keydown",MusicDialogs.dialogKeyDown_,!0)},showLoading:function(){const a=document.getElementById("dialogLoading");MusicDialogs.showDialog(a,null,!1,!0,{width:"33%",
left:"33%",top:"5em"},null);document.body.style.cursor="wait"}};/*

 Copyright 2012 Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
var BlocklyStorage={startCode:null,link:function(){if("file:"===location.protocol)BlocklyStorage.alert_('Cannot submit XHR from "file:" URL.');else{var a=Music.getCode();BlocklyStorage.makeRequest_("/storage","xml="+encodeURIComponent(a),BlocklyStorage.handleLinkResponse_)}},retrieveXml:function(a){MusicDialogs.showLoading();BlocklyStorage.makeRequest_("/storage","key="+encodeURIComponent(a),BlocklyStorage.handleRetrieveXmlResponse_)},httpRequest_:null,makeRequest_:function(a,b,c){BlocklyStorage.httpRequest_&&
BlocklyStorage.httpRequest_.abort();BlocklyStorage.httpRequest_=new XMLHttpRequest;BlocklyStorage.httpRequest_.onload=function(){200===this.status?c.call(this):BlocklyStorage.alert_(BlocklyStorage.HTTPREQUEST_ERROR+"\nXHR status: "+this.status);BlocklyStorage.httpRequest_=null};BlocklyStorage.httpRequest_.open("POST",a);BlocklyStorage.httpRequest_.setRequestHeader("Content-Type","application/x-www-form-urlencoded");BlocklyStorage.httpRequest_.send(b)},handleLinkResponse_:function(){const a=this.responseText.trim();
window.location.hash=a;BlocklyStorage.alert_(BlocklyStorage.LINK_ALERT.replace("%1",window.location.href.replace("/editor/index.html#","/#")));BlocklyStorage.startCode=Music.getCode()},handleRetrieveXmlResponse_:function(){const a=this.responseText.trim();a.length?(Music.setCode(a),MusicDialogs.hideDialog()):BlocklyStorage.alert_(BlocklyStorage.HASH_ERROR.replace("%1",window.location.hash));BlocklyStorage.startCode=Music.getCode()},alert_:function(a){const b=document.getElementById("linkButton");
MusicDialogs.storageAlert(b,a)},HTTPREQUEST_ERROR:"There was a problem with the request.\n",LINK_ALERT:"Share your blocks with this link:\n\n%1",HASH_ERROR:'Sorry, "%1" doesn\'t correspond with any saved Blockly file.'};/*

 Copyright 2016 Neil Fraser
 SPDX-License-Identifier: Apache-2.0
*/
var Music={HEIGHT:400,WIDTH:400,pid:0,startCount:0,staveCount:0,barCount:0,interpreter:null,threads:[],startTime:0,clock32nds:0,activeThread:null,REST:-1,editorTabs:null,blocksEnabled_:!0,ignoreEditorChanges_:!0,transcriptTempo:NaN,transcriptVoices:[],threadCount:0,fromMidi:{81:"A5",82:"Bb5",83:"B5",84:"C6",85:"Db6",86:"D6",87:"Eb6",88:"E6",89:"F6",90:"Gb6",91:"G6",92:"Ab6",93:"A6",94:"Bb6",95:"B6",96:"C7",97:"Db7",98:"D7",99:"Eb7",100:"E7",101:"F7",102:"Gb7",103:"G7",104:"Ab7",105:"A7"},init:function(){function a(l){return function(){if(!Blockly.utils.dom.hasClass(Music.editorTabs[l],
"tab-disabled")){for(let m=0;m<Music.editorTabs.length;m++)l===m?Blockly.utils.dom.addClass(Music.editorTabs[m],"tab-selected"):Blockly.utils.dom.removeClass(Music.editorTabs[m],"tab-selected");Music.changeTab(l)}}}Music.editorTabs=Array.prototype.slice.call(document.querySelectorAll("#editorBar>.tab"));for(var b=0;b<Music.editorTabs.length;b++)Music.bindClick(Music.editorTabs[b],a(b));const c=document.getElementById("paddingBox"),d=document.getElementById("staveBox"),f=document.getElementById("musicBox"),
e=document.getElementById("tabarea");b=document.getElementById("blockly");var g=document.getElementById("editor");const h=[b,g],k=function(l){l=c.offsetTop;d.style.top=l+"px";f.style.top=l+"px";e.style.top=l-window.pageYOffset+"px";e.style.left="420px";e.style.width=window.innerWidth-440+"px";l=Math.max(0,l+e.offsetHeight-window.pageYOffset)+"px";const m=window.innerWidth-440+"px";for(const n of h)n.style.top=l,n.style.left="420px",n.style.width=m};window.addEventListener("scroll",function(){k(null);
Blockly.svgResize(Music.workspace)});window.addEventListener("resize",k);k(null);b=window.ace;b.require("ace/ext/language_tools");b=b.edit("editor");Music.editor=b;b.setTheme("ace/theme/chrome");b.setShowPrintMargin(!1);b.setOptions({enableBasicAutocompletion:!0,enableLiveAutocompletion:!0});g=b.getSession();g.setMode("ace/mode/javascript");g.setTabSize(2);g.setUseSoftTabs(!0);g.setUseWrapMode(!0);g.on("change",Music.editorChanged);b.setValue("",-1);b=document.getElementById("toolbox");Music.workspace=
Blockly.inject("blockly",{disable:!1,media:"../third-party/blockly/media/",oneBasedIndex:!1,rtl:!1,toolbox:b,zoom:{maxScale:2,controls:!0,wheel:!0,startScale:1}});Music.workspace.addChangeListener(Blockly.Events.disableOrphans);Music.workspace.addChangeListener(Music.disableExtraStarts);Music.workspace.addChangeListener(Music.codeChanged);Blockly.JavaScript.addReservedWords("play,rest,start0,start1,start2,start3,start4,start5,start6,start7,start8,start9"+Object.values(Music.fromMidi).join(","));b=
document.getElementById("slider");Music.speedSlider=new Slider(10,35,130,b,Music.sliderChange);1<window.location.hash.length?BlocklyStorage.retrieveXml(window.location.hash.substring(1)):(b=document.getElementById("defaultXml"),Music.workspace.clear(),Blockly.Xml.domToWorkspace(b,Music.workspace),Music.workspace.clearUndo(),setTimeout(Music.showHelp,1E3));Music.reset();Music.changeTab(0);Music.ignoreEditorChanges_=!1;Music.bindClick("runButton",Music.runButtonClick);Music.bindClick("resetButton",
Music.resetButtonClick);Music.bindClick("submitButton",Music.submitButtonClick);setTimeout(Music.importInterpreter,1);setTimeout(Music.importSounds,2);Music.bindClick("linkButton",BlocklyStorage.link);Music.bindClick("helpButton",Music.showHelp);Midi&&Midi.init()}};window.addEventListener("load",Music.init);
Music.changeTab=function(a){var b=["blockly","editor"];for(let c=0,d;d=b[c];c++)document.getElementById(d).style.visibility=c===a?"visible":"hidden";b=[".blocklyTooltipDiv",".blocklyToolboxDiv"];for(let c=0,d;d=b[c];c++)document.querySelector(d).style.visibility=0===a?"visible":"hidden";Blockly.hideChaff();1===a&&Music.blocksEnabled_&&((a=Music.editor.getSession().getMode().$highlightRules.$keywordList)&&a.splice(0,Infinity,"arguments","this","NaN","Math","JSON","parseInt","parseFloat","isNaN","isFinite",
"eval","String","RegExp","Object","Number","Function","Date","Boolean","Array","while","var","let","typeof","try","throw","switch","return","new","instanceof","of","in","if","function","for","finally","else","do","delete","continue","catch","case","break","const","undefined","Infinity","null","false","true"),a=Music.blocksToCode(),a=a.replace(/, 'block_id_([^']+)'/g,""),Music.ignoreEditorChanges_=!0,Music.editor.setValue(a,-1),Music.ignoreEditorChanges_=!1)};
Music.blocksToCode=function(){Music.startCount=0;const a=Blockly.JavaScript.workspaceToCode(Music.workspace);let b="";var c=[];for(const d in Music.fromMidi)c.push(Music.fromMidi[d]+"="+d);b+="var "+c.join(", ")+";\n\n";for(c=1;c<=Music.startCount;c++)b+="runThread(start"+c+");\n";return b+"\n"+a};
Music.editorChanged=function(){if(!Music.ignoreEditorChanges_)if(Music.blocksEnabled_)if(!Music.workspace.getTopBlocks(!1).length||confirm("Once you start editing JavaScript, you can't go back to editing blocks. Is this OK?"))Blockly.utils.dom.addClass(Music.editorTabs[0],"tab-disabled"),Music.blocksEnabled_=!1,Music.startCount=0,Music.codeChanged(),Music.importBabel();else{let a=Music.blocksToCode();a=a.replace(/, 'block_id_([^']+)'/g,"");Music.ignoreEditorChanges_=!0;setTimeout(function(){Music.editor.setValue(a,
-1);Music.ignoreEditorChanges_=!1},0)}else Music.editor.getValue().trim()||(Music.workspace.clear(),Blockly.utils.dom.removeClass(Music.editorTabs[0],"tab-disabled"),Music.blocksEnabled_=!0),Music.codeChanged()};Music.codeChanged=function(){null!==BlocklyStorage.startCode&&BlocklyStorage.startCode!==Music.getCode()&&(window.location.hash="",BlocklyStorage.startCode=null)};
Music.bindClick=function(a,b){if(!a)throw TypeError("Element not found: "+a);"string"===typeof a&&(a=document.getElementById(a));a.addEventListener("click",b,!0);a.addEventListener("touchend",b,!0)};Music.importInterpreter=function(){const a=document.createElement("script");a.type="text/javascript";a.src="../third-party/JS-Interpreter/acorn_interpreter_simple.js";document.head.appendChild(a)};
Music.importSounds=function(){const a=document.createElement("script");a.type="text/javascript";a.src="../third-party/soundjs.min.js";a.onload=Music.registerSounds;document.head.appendChild(a)};Music.registerSounds=function(){const a=[];for(const b in Music.fromMidi)a.push({src:Music.fromMidi[b]+".mp3",id:b});createjs.Sound.registerSounds(a,"../third-party/soundfont/")};
Music.importBabel=function(){const a=document.createElement("script");a.type="text/javascript";a.src="../third-party/babel.min.js";document.head.appendChild(a)};Music.transpileToEs5=function(a){if("object"===typeof Babel)return Babel.transform(a,{presets:["es2015"]}).code};Music.sliderChange=function(){Music.startTime=0};
Music.drawStaveBox=function(){document.getElementById("staveBox").innerHTML="";var a=document.getElementById("musicContainer");a.innerHTML="";Music.barCount=0;var b=document.createElement("img");b.id="musicContainerWidth";b.src="1x1.gif";a.appendChild(b);Music.drawStave(Blockly.utils.math.clamp(0<Music.transcriptVoices.length?Music.transcriptVoices.length:Music.startCount,1,4));for(a=0;a<Math.min(4,Music.transcriptVoices.length);a++){b=Music.transcriptVoices[a];let c=0;for(const d of b){for(const f of d.pitches)Music.drawNote(a+
1,c,f,d.duration);c+=32*d.duration}}};Music.drawStave=function(a){Music.staveCount=a;const b=document.getElementById("staveBox");for(let d=1;d<=a;d++){const f=Math.round(Music.staveTop_(d,a));var c=document.createElement("img");c.src="stave.png";c.className="stave";c.style.top=f+"px";b.appendChild(c);c=document.createElement("img");c.className="stave-15";c.src="1x1.gif";c.style.top=f-12+"px";c.style.left="10px";b.appendChild(c)}};Music.staveTop_=function(a,b){return a=(2*a-1)/(2*b)*385-34.5+5};
Music.drawNote=function(a,b,c,d){var f=[1,.5,.25,.125,.0625,.03125];for(var e of f){if(d===e)break;for(;d>=e;)Music.drawNote(a,b,c,e),c=Music.REST,b+=32*e,d-=e}if(!(d<f[f.length-1])){e=b/32;f=a=Music.staveTop_(a,Music.staveCount);c===Music.REST?a=Math.round(a+21):(a+=Music.drawNote.heights_[c],a=Math.floor(a));e=Math.round(256*e+10);var g=e-5,h=document.getElementById("musicContainer"),k=document.createElement("img"),l="";c!==Music.REST&&(l=1===d||94>c?"-low":"-high");k.src=(c===Music.REST?"rests/":
"notes/")+d+l+".png";c===Music.REST?k.className="rest":(k.className="note"+l,k.title=Music.fromMidi[c],"-high"===l&&(a+=28,e-=6));k.style.top=a+"px";k.style.left=e+"px";h.appendChild(k);if(c!==Music.REST&&-1!==Music.fromMidi[c].indexOf("b")){const m=document.createElement("img");m.src="notes/flat.png";m.className="flat";m.title=k.title;"-low"===l?(a+=18,e-=10):(a-=10,e-=4);m.style.top=a+"px";m.style.left=e+"px";h.appendChild(m)}if(Music.clock32nds===b){const m=k.cloneNode(!0);h.appendChild(m);setTimeout(function(){m.className=
"splash "+k.className},0);setTimeout(function(){Blockly.utils.dom.removeNode(m)},1E3)}c!==Music.REST&&(104<=c&&Music.makeLedgerLine_(f+9,g,d,h),84>=c&&Music.makeLedgerLine_(f+63,g,d,h),81>=c&&Music.makeLedgerLine_(f+63+9,g,d,h))}};Music.makeLedgerLine_=function(a,b,c,d){const f=document.createElement("img");f.src="black1x1.gif";f.className=1===c?"ledgerLineWide":"ledgerLine";f.style.top=a+"px";f.style.left=b+"px";d.appendChild(f)};Music.drawNote.heights_={};
(function(){let a=40.5;for(const b in Music.fromMidi){const c=Music.fromMidi[b];Music.drawNote.heights_[b]=a;-1===c.indexOf("b")&&(a-=4.5)}})();Music.showHelp=function(){const a=document.getElementById("dialogHelp"),b=document.getElementById("helpButton");MusicDialogs.showDialog(a,b,!0,!0,{width:"50%",left:"25%",top:"5em"},Music.hideHelp);MusicDialogs.startDialogKeyDown()};Music.hideHelp=function(){MusicDialogs.stopDialogKeyDown()};
Music.disableExtraStarts=function(a){const b=document.getElementById("toolbox"),c=document.getElementById("music_start");if(c){var d=Music.expectedAnswer?Music.expectedAnswer.length:4,f=Music.startCount;if(a instanceof Blockly.Events.Create){var e=[];const k=Music.workspace.getTopBlocks(!1);for(var g of k)"music_start"!==g.type||g.isInsertionMarker()||e.push(g);if(d<e.length)for(var h of a.ids)for(const l of e)l.id===h&&l.setDisabled(!0);d<=e.length?(c.setAttribute("disabled","true"),Music.workspace.updateToolbox(b),
Music.startCount=d):Music.startCount=e.length}else if(a instanceof Blockly.Events.Delete){a=[];g=[];h=Music.workspace.getTopBlocks(!0);for(e of h)"music_start"===e.type&&(e.isEnabled()?a:g).push(e);for(;d>a.length&&g.length;)e=g.shift(),e.setDisabled(!1),a.push(e);d>a.length&&(c.setAttribute("disabled","false"),Music.workspace.updateToolbox(b));Music.startCount=a.length}Music.startCount!==f&&Music.resetButtonClick()}};
Music.reset=function(){clearTimeout(Music.pid);for(const a of Music.threads)Music.stopSound(a);Music.interpreter=null;Music.activeThread=null;Music.threads.length=0;Music.threadCount=0;Music.clock32nds=0;Music.startTime=0;Music.transcriptVoices.length=0;Music.transcriptTempo=NaN;Music.drawStaveBox()};
Music.runButtonClick=function(a){if(!Music.eventSpam(a)){a=document.getElementById("runButton");var b=document.getElementById("resetButton");b.style.minWidth||(b.style.minWidth=a.offsetWidth+"px");a.style.display="none";b.style.display="inline";document.getElementById("spinner").style.visibility="visible";Music.execute()}};
Music.resetButtonClick=function(a){a&&Music.eventSpam(a)||(document.getElementById("runButton").style.display="inline",document.getElementById("resetButton").style.display="none",document.getElementById("spinner").style.visibility="hidden",document.getElementById("submitButton").setAttribute("disabled",""),Music.workspace.highlightBlock(null),Music.reset())};
Music.initInterpreter_=function(a,b){a.setProperty(b,"play",a.createNativeFunction(function(d,f,e){f=a.pseudoToNative(f);Music.play(d,f,e)}));a.setProperty(b,"rest",a.createNativeFunction(function(d,f){Music.rest(d,f)}));a.setProperty(b,"runThread",a.createNativeFunction(function(d){if(8<Music.threads.length)throw Error("Too many threads");const f=[],e=a.getGlobalScope();var g=a.newNode();g.type="Program";g.body=[];g=new Interpreter.State(g,e);g.done=!1;f.push(g);g=a.newNode();g.type="ExpressionStatement";
g=new Interpreter.State(g,e);g.done_=!0;f.push(g);g=a.newNode();g.type="CallExpression";g=new Interpreter.State(g,e);g.doneCallee_=!0;g.funcThis_=e.object;g.func_=d;g.doneArgs_=!0;g.arguments_=[];f.push(g);d=new Music.Thread(f);Music.threads.push(d)}));const c=a.nativeToPseudo({});a.setProperty(b,"console",c);for(const d of["log","info","warn","error","dir"])a.setProperty(c,d,a.createNativeFunction(function(f){return console[d](String(f))}))};
Music.getCode=function(){if(Music.blocksEnabled_){const a=Blockly.Xml.workspaceToDom(Music.workspace,!0);if(1===Music.workspace.getTopBlocks(!1).length&&a.querySelector){const b=a.querySelector("block");b&&(b.removeAttribute("x"),b.removeAttribute("y"))}return Blockly.Xml.domToText(a)}return Music.editor.getValue()};
Music.setCode=function(a){let b;if(a instanceof Element)b=a;else try{b=Blockly.Xml.textToDom(a)}catch(c){b=null}b?(Music.workspace.clear(),Blockly.Xml.domToWorkspace(b,Music.workspace),Music.workspace.clearUndo(),Blockly.utils.dom.removeClass(Music.editorTabs[0],"tab-disabled"),Music.blocksEnabled_=!0,Music.editorTabs[0].dispatchEvent(new Event("click"))):(Music.editor.setValue(a,-1),Blockly.utils.dom.addClass(Music.editorTabs[0],"tab-disabled"),Music.blocksEnabled_=!1,Music.startCount=0,Music.editorTabs[1].dispatchEvent(new Event("click")))};
Music.execute=function(){if("Interpreter"in window)if("createjs"in window&&createjs.Sound.isReady()){if(Music.blocksEnabled_)var a=Music.blocksToCode();else{a=Music.editor.getValue();try{a=Music.transpileToEs5(a)}catch(b){throw Music.resetButtonClick(),alert(b),b;}if(void 0===a){console.log("Waiting for Babel to load.");setTimeout(Music.execute,250);return}}Music.reset();Blockly.selected&&Blockly.selected.unselect();Music.interpreter=new Interpreter(a,Music.initInterpreter_);Music.threads.push(new Music.Thread(Music.interpreter.getStateStack()));
setTimeout(Music.tick,100)}else console.log("Waiting for SoundJS to load."),setTimeout(Music.execute,250);else console.log("Waiting for JS-Interpreter to load."),setTimeout(Music.execute,250)};Music.getTempo=function(){return 1E3*(2.5-2*Music.speedSlider.getValue())};
Music.tick=function(){var a=Music.getTempo()/32;Music.startTime||(Music.startTime=Date.now()-Music.clock32nds*a);if(Music.threads.length){let b=32,c;do{if(0===b--){console.warn("Thread creation out of control.");break}c=Music.threadCount;const d=Music.threads.concat();for(const f of d)f.pauseUntil32nds<=Music.clock32nds&&Music.executeChunk_(f)}while(c!==Music.threadCount);Music.autoScroll();Music.clock32nds++;a=Music.startTime+Music.clock32nds*a-Date.now();Music.pid=setTimeout(Music.tick,a)}else document.getElementById("spinner").style.visibility=
"hidden",Music.workspace.highlightBlock(null),document.getElementById("submitButton").removeAttribute("disabled"),Music.transcriptTempo=Music.getTempo()/4};
Music.executeChunk_=function(a){Music.activeThread=a;Music.interpreter.setStateStack(a.stateStack);let b=1E4,c;do{try{c=Music.interpreter.step()}catch(d){alert(d),console.log(d),c=!1}if(0===b--){console.warn("Thread "+a.stave+" is running slowly.");return}if(Music.interpreter.getStatus()===Interpreter.Status.TASK||a.pauseUntil32nds>Music.clock32nds)return}while(c);a.dispose()};Music.stopSound=function(a){for(const b of a.sounds)setTimeout(b.stop.bind(b),100);a.sounds.length=0};
Music.autoScroll=function(){const a=document.getElementById("musicBox"),b=document.getElementById("musicContainer");var c=document.getElementById("musicContainerWidth");let d;d=Music.clock32nds?Math.round(Music.clock32nds/32*256+110):a.scrollWidth+100;for(c.width=d;Music.barCount<Math.floor(d/256);)for(Music.barCount++,c=1;c<=Music.staveCount;c++){const f=Music.staveTop_(c,Music.staveCount),e=document.createElement("img");e.src="black1x1.gif";e.className="barLine";e.style.top=f+18+"px";e.style.left=
256*Music.barCount+10-5+"px";b.appendChild(e)}a.scrollLeft=8*Music.clock32nds-182};Music.animate=function(a){a&&(Music.activeThread.highlighedBlock&&Music.highlight(Music.activeThread.highlighedBlock,!1),Music.highlight(a,!0),Music.activeThread.highlighedBlock=a)};
Music.play=function(a,b,c){if(isNaN(a)||.03125>a)console.warn("Invalid note duration: "+a);else{Music.stopSound(Music.activeThread);Array.isArray(b)||(b=[b]);Music.activeThread.appendTranscript(a,b);for(let d=0;d<b.length;d++){let f=Math.round(b[d]);Music.fromMidi[f]||(console.warn("MIDI note out of range (81-105): "+f),f=Music.REST);Music.activeThread.sounds.push(createjs.Sound.play(f));Music.drawNote(Music.activeThread.stave,Music.clock32nds,f,a)}Music.activeThread.pauseUntil32nds=32*a+Music.clock32nds;
Music.animate(c)}};Music.rest=function(a,b){isNaN(a)||.03125>a?console.warn("Invalid rest duration: "+a):(Music.stopSound(Music.activeThread),Music.activeThread.pauseUntil32nds=32*a+Music.clock32nds,Music.activeThread.appendTranscript(a,[Music.REST]),Music.drawNote(Music.activeThread.stave,Music.clock32nds,Music.REST,a),Music.animate(b))};
Music.eventSpam=function(a){if("click"===a.type&&"touchend"===Music.eventSpam.previousType_&&Music.eventSpam.previousDate_+2E3>Date.now()||Music.eventSpam.previousType_===a.type&&Music.eventSpam.previousDate_+400>Date.now())return a.preventDefault(),a.stopPropagation(),!0;Music.eventSpam.previousType_=a.type;Music.eventSpam.previousDate_=Date.now();return!1};Music.eventSpam.previousType_=null;Music.eventSpam.previousDate_=0;
Music.highlight=function(a,b){if(a&&"string"===typeof a){const c=a.match(/^block_id_([^']+)$/);c&&(a=c[1])}Music.workspace.highlightBlock(a,b)};
Music.submitButtonClick=function(a){if(!Music.eventSpam(a)){var b=document.getElementById("submitButton");if("file:"===location.protocol)MusicDialogs.storageAlert(b,'Cannot submit XHR from "file:" URL.');else{var c=new XMLHttpRequest;c.open("POST","/submit");c.setRequestHeader("Content-type","application/x-www-form-urlencoded");c.onload=function(){MusicDialogs.storageAlert(b,200===c.status?c.responseText:"XHR error.\nStatus: "+c.status)};a={tempo:Math.round(Music.transcriptTempo),stream:Music.voicesToStream(Music.transcriptVoices)};
c.send("data="+JSON.stringify(a))}}};Music.voicesToStream=function(a){const b=[];let c=-1,d=-1;const f=new Set,e=[],g=[];for(var h=0;h<a.length;h++)e.push(0),g.push(0);h=!0;do{c++;d++;h=!0;for(let k=0,l;l=a[k];k++)if(g[k]>c)h=!1;else{const m=l[e[k]];if(m){h=!1;for(const n of m.pitches)n!==Music.REST&&f.add(n);g[k]=32*m.duration+c;e[k]++}}if(f.size){d&&(b.push(d/32),d=0);const k=[];f.forEach(function(l){k.push(l)});k.sort();b.push(k);f.clear()}}while(!h);d&&b.push(d/32);return b};
Music.TranscriptPoint=class{constructor(a,b){this.duration=a;this.pitches=b}};
Music.Thread=class{constructor(a){this.id=Music.threadCount++;this.stave=void 0;this.stateStack=a;this.pauseUntil32nds=0;this.highlighedBlock=null;this.sounds=[]}appendTranscript(a,b){a=new Music.TranscriptPoint(a,b);if(void 0===this.stave){b=[];for(var c of Music.threads)void 0!==c.stave&&(b[c.stave]=!0);for(var d=1;b[d];)d++;this.stave=d;Music.transcriptVoices[d-1]||(Music.transcriptVoices[d-1]=[]);c=0;b=Music.transcriptVoices[d-1];for(d=0;d<b.length;d++)c+=b[d].duration;c=Music.clock32nds/32-c;
c=Math.round(1E6*c)/1E6;0<c&&b.push(new Music.TranscriptPoint(c,[Music.REST]));Music.drawStaveBox()}Music.transcriptVoices[this.stave-1].push(a)}dispose(){Music.stopSound(this);this.highlighedBlock&&(Music.highlight(this.highlighedBlock,!1),this.highlighedBlock=null);Blockly.utils.arrayRemove(Music.threads,this)}};/*

 Copyright 2023 Neil Fraser
 SPDX-License-Identifier: Apache-2.0
*/
const Midi={init:function(){document.getElementById("uploadButton").style.display="";document.getElementById("fileInput").addEventListener("change",Midi.doneUpload);Music.bindClick("uploadButton",Midi.startUpload)},startUpload:function(){document.getElementById("fileInput").click()},doneUpload:function(){const a=document.getElementById("fileInput");a.files.length&&a.files[0].arrayBuffer().then(Midi.fileLoaded,b=>alert("Upload failed.\n"+b))},fileLoaded:function(a){MusicDialogs.showLoading();setTimeout(Midi.startParse.bind(Midi,
a),50)},startParse:function(a){Music.resetButtonClick();Music.workspace.clear();a=new Uint8Array(a);a=MidiParser.parse(a);const b=Midi.createPitchTable(Midi.allPitches(a)),c=Blockly.utils.xml.createElement("xml");let d=0;for(let f=0;f<a.track.length;f++){const e=Midi.parseTrack(a,f);0===e.length||1===e.length&&"number"===typeof e[0]||c.appendChild(Midi.trackToXml(e,d++,b))}Music.setCode(c);MusicDialogs.hideDialog()},parseTrack:function(a,b){const c=2*a.timeDivision;b=a.track[b].event;a=[];for(const f of b){var d=
f.deltaTime/c;b=a[a.length-1];0<d&&("number"===typeof b?a[a.length-1]+=d:(a.push(d),b=d));9===f.type&&(d=f.data[0],Array.isArray(b)?b.push(d):a.push([d]))}return a},trackToXml:function(a,b,c){const d=Blockly.utils.xml.createElement("block");d.setAttribute("type","music_start");d.setAttribute("x",300*b+10);d.setAttribute("y",10);b=Blockly.utils.xml.createElement("statement");b.setAttribute("name","STACK");d.appendChild(b);var f=null;for(const l of a)if(Array.isArray(l)){a=Blockly.utils.xml.createElement("block");
a.setAttribute("type","music_note");b.appendChild(a);b=Blockly.utils.xml.createElement("field");b.setAttribute("name","DURATION");a.appendChild(b);f=b;var e=Blockly.utils.xml.createElement("value");e.setAttribute("name","PITCH");a.appendChild(e);b=Blockly.utils.xml.createElement("next");a.appendChild(b);a=[];var g=Midi.pitchesToChords(l,c);if(1<g.length){var h=Blockly.utils.xml.createElement("block");h.setAttribute("type","lists_create_with");e.appendChild(h);e=Blockly.utils.xml.createElement("mutation");
e.setAttribute("items",g.length);h.appendChild(e);for(e=0;e<g.length;e++){var k=Blockly.utils.xml.createElement("value");k.setAttribute("name","ADD"+e);h.appendChild(k);a.push(k)}}else a.push(e);for(const [m,n]of g){h=Blockly.utils.xml.createElement("block");h.setAttribute("type","music_pitch");g=Blockly.utils.xml.createElement("field");g.setAttribute("name","PITCH");h.appendChild(g);e=Blockly.utils.xml.createTextNode(m);g.appendChild(e);if(0===n)g=h;else{g=Blockly.utils.xml.createElement("block");
g.setAttribute("type","math_arithmetic");e=Blockly.utils.xml.createElement("field");e.setAttribute("name","OP");k=Blockly.utils.xml.createTextNode(0<n?"ADD":"MINUS");e.appendChild(k);g.appendChild(e);e=Blockly.utils.xml.createElement("value");e.setAttribute("name","A");g.appendChild(e);e.appendChild(h);h=Blockly.utils.xml.createElement("value");h.setAttribute("name","B");g.appendChild(h);e=Blockly.utils.xml.createElement("block");e.setAttribute("type","math_number");k=Blockly.utils.xml.createElement("field");
k.setAttribute("name","NUM");const p=Blockly.utils.xml.createTextNode("1");k.appendChild(p);e.appendChild(k);h.appendChild(e)}a.shift().appendChild(g)}}else for(a=l,f&&(a=Midi.timeSlice(a),g=a[0],a=a[1],g&&(g=Blockly.utils.xml.createTextNode(g),f.appendChild(g)));.03125<=a;)f=Midi.timeSlice(a),g=f[0],a=f[1],f=Blockly.utils.xml.createElement("block"),f.setAttribute("type","music_rest"),b.appendChild(f),b=Blockly.utils.xml.createElement("field"),b.setAttribute("name","DURATION"),f.appendChild(b),g=
Blockly.utils.xml.createTextNode(g),b.appendChild(g),b=Blockly.utils.xml.createElement("next"),f.appendChild(b),f=null;return d},pitchesToChords:function(a,b){const c=new Map;for(const d of a)a=b.get(d),c.set(String(a),a);b=Array.from(c.values());b.sort(function(d,f){const [e,g]=d,[h,k]=f;d=2*FieldPitch.NOTES.indexOf(e)+g;return 2*FieldPitch.NOTES.indexOf(h)+k-d});return b},timeSlice:function(a){let b;1<=a?(b="1",--a):.5<=a?(b="1/2",a-=.5):.25<=a?(b="1/4",a-=.25):.125<=a?(b="1/8",a-=.125):.0625<=
a?(b="1/16",a-=.0625):.03125<=a?(b="1/32",a-=.03125):(console.warn("Very short time signature: "+a),b="1/32",a=0);return[b,a]},allPitches:function(a){const b=Array(256).fill(0);for(const c of a.track)for(const d of c.event)9===d.type&&b[d.data[0]]++;return new Map(b.map((c,d)=>[d,c]).filter(([,c])=>0<c))},createPitchTable:function(a){const b=Math.min(...Object.keys(Music.fromMidi)),c=Math.max(...Object.keys(Music.fromMidi));var d=Math.min(...a.keys()),f=Math.max(...a.keys()),e=Math.min(b-d,c-f);f=
Math.max(b-d,c-f);d=0;for(var g=-Infinity;e<=f;e++){let h=e%12?0:10;h-=Math.abs(e)/12;for(const [k,l]of a){const m=k+e;m<b||m>c?h-=10*l:Music.fromMidi[m].includes("b")&&(h-=l)}h>g&&(d=e,g=h)}f=new Map;for(const h of a.keys()){for(a=h+d;a<b;)a+=12;for(;a>c;)a-=12;a=Music.fromMidi[a];g=0;a.includes("b")&&(a=a.replace("b",""),g=-1);f.set(h,[a,g])}return f}};
