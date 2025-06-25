# Script for generating the compiled acorn_interpreter_simple.js file.
# For Linux, BSD, MacOS, etc.

# Download Closure Compiler if not already present.
if test -f "../../compiler.jar"; then
  echo "Found Closure Compiler."
else
  echo "Downloading Closure Compiler."
  wget -N https://unpkg.com/google-closure-compiler-java/compiler.jar
  if test -f "compiler.jar"; then
    echo "Downloaded Closure Compiler."
    mv compiler.jar ../../compiler.jar
  else
    echo "Unable to download Closure Compiler."
    exit 1
  fi
fi

# Make a copy of the interpreter so that polyfill sources can be complied.
cp interpreter.js interpreter.tmp.js
# This step is optional, but reduces the output by 5 KB.
python polyfill_compile.py interpreter.tmp.js

echo "Compiling Acorn + JS-Interpreter..."
echo "Compiling using SIMPLE because Glockenspiel needs to mess with the stack."
java -jar ../../compiler.jar \
     --compilation_level SIMPLE \
     --language_in=ECMASCRIPT5 --language_out=ECMASCRIPT5 \
     --warning_level VERBOSE \
     --js='acorn.js' --js='interpreter.tmp.js' \
     --js_output_file acorn_interpreter_simple.js
rm interpreter.tmp.js

echo "Done"
