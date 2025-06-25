#!/usr/bin/python3
"""
Copyright 2019 Neil Fraser

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

"""Fetch tune from server, and play it.
"""

import json
import pigpio
import signal
import sys
import threading
import time
import requests

FETCH_URL = "https://neil.fraser.name/scripts/glockenspiel/fetch.py"

# Strike time for hammer in seconds.
STRIKE_TIME = 8 / 1000.0

# Map of MIDI note values to GPIO pin number.
PINOUT = {
  81:  24,  # A5
  82:  15,  # Bb5
  83:  10,  # B5
  84:  9,   # C6
  85:  14,  # Db6
  86:  25,  # D6
  87:  4,   # Eb6
  88:  11,  # E6
  89:  8,   # F6
  90:  3,   # Gb6
  91:  7,   # G6
  92:  2,   # Ab6
  93:  5,   # A6
  94:  23,  # Bb6
  95:  6,   # B6
  96:  12,  # C7
  97:  22,  # Db7
  98:  13,  # D7
  99:  27,  # Eb7
  100: 19,  # E7
  101: 16,  # F7
  102: 17,  # Gb7
  103: 26,  # G7
  104: 18,  # Ab7
  105: 20   # A7
}

# GPIO pin number of reset button/LED.
RESET_PIN = 21

# Global variable used to pass parsed JSON from the fetch loop
# to the play thread.
new_data = None


class PlayForever(threading.Thread):
  """
  Runs in a separate thread.
  """
  def __init__(self):
    threading.Thread.__init__(self)
    self.pi = pigpio.pi()
    for pinNumber in PINOUT.values():
      self.pi.set_mode(pinNumber, pigpio.OUTPUT)
      self.pi.write(pinNumber, 0)
    self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)
    signal.signal(signal.SIGINT, self.shutdown)

  def run(self):
    global new_data
    stream = None
    stream_index = 0
    pause_remaining = 0
    while(True):
      if new_data:
        if stream:
          print("Interrupting current tune.\n")
          # Insert a pause between the old tune and the new one.
          time.sleep(1)

        print("Got new tune: %s\n" % new_data)
        # Convert tempo from referencing 1/4 note to referencing 1/32 note.
        tempo = (new_data["tempo"] / 8.0) / 1000.0
        stream = new_data["stream"]
        new_data = None
        stream_index = 0
        pause_remaining = 0

        # Number of 1/32nds notes since the start.
        clock32nds = 0
        # Time of start of execution in seconds.
        startTime = time.time()
        # Turn on the reset LED.
        self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)
        self.pi.write(RESET_PIN, 1)

      if stream and stream_index >= len(stream):
        # Turn off the reset LED.
        self.pi.write(RESET_PIN, 0)
        print("Finished playing tune.  Waiting for next tune.\n")
        stream = None

      if stream == None:
        # Just waiting for next tune to arrive.
        time.sleep(1)
        continue

      # Switch the reset GPIO pin from LED to button for a moment.
      # If pressed, terminate the tune.
      self.pi.set_mode(RESET_PIN, pigpio.INPUT)
      if self.pi.read(RESET_PIN):
        print("Tune manually terminated with local reset button.\n")
        stream = None
        continue
      self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)

      if pause_remaining > 0:
        # Keep waiting for the right time for the next note.
        pause_remaining -= 1
        clock32nds += 1
        s = (startTime + clock32nds * tempo) - time.time()
        if (s > 0):
          time.sleep(s)
        continue

      # Read the next item off the stream.
      datum = stream[stream_index]
      stream_index += 1

      if type(datum) == float:
        # New pause.
        pause_remaining = datum * 32
      elif type(datum) == list:
        for note in datum:
          if note in PINOUT:
            self.pi.write(PINOUT[note], 1)
          else:
            print("Skipping invalid note: %s\n" % note)
        time.sleep(STRIKE_TIME)
        for note in datum:
          if note in PINOUT:
            self.pi.write(PINOUT[note], 0)

  def shutdown(self, sig, frame):
    # Gracefully shutdown without spewing traceback.
    # Turn off any powered solenoids.
    print("Shutting down.\n")
    for pinNumber in PINOUT.values():
      self.pi.write(pinNumber, 0)
    self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)
    self.pi.write(RESET_PIN, 0)
    sys.exit(0)

def startup():
  # On start up, play the entire scale.
  global new_data
  stream = []
  for midi in PINOUT.keys():
    stream.append([midi])
    stream.append(1/4)
  new_data = {"tempo": 125, "stream": stream}
  time.sleep(5)

def fetch():
  # Check to see if there's a new tune waiting on server.
  global new_data, last_status_time
  try:
    text = requests.get(FETCH_URL, timeout=60).text
  except Exception as e:
    print("Failure to fetch: %s\n" % e)
    last_status_time = time.time()
    return
  if text.strip():
    try:
      unvalidated_data = json.loads(text)
      new_data = validateData(unvalidated_data)
    except Exception as e:
      print("Invalid JSON: %s\n" % e)
    last_status_time = time.time()
  elif last_status_time + 60 < time.time():
    # Print an "I'm still alive" message once a minute.
    last_status_time = time.time()
    print("Still waiting for next tune.\n")


def validateData(unvalidated_data):
  # Ensure stream is valid, and normalize repeated content.
  if "tempo" in unvalidated_data:
    validated_tempo = float(unvalidated_data["tempo"])
  else:
    validated_tempo = 375  # Default speed.
  assert 125 <= validated_tempo <= 625, "Tempo out of bounds"

  unvalidated_stream = unvalidated_data["stream"]
  assert type(unvalidated_stream) == list, "Stream not a list"
  validated_stream = []
  pending_notes = set()
  pending_pause = 0
  # Append a null operation to ensure no remainder when loop exits.
  unvalidated_stream.append(None)
  for datum in unvalidated_stream:
    if type(datum) == list or datum == None:
      if datum != None and len(datum) == 0:
        continue
      # Got some new notes.  Append any pending pause.
      if pending_pause > 0:
        assert 1 / 32 <= pending_pause <= 256, "Invalid duration"
        validated_stream.append(pending_pause)
        pending_pause = 0
      if datum != None:
        for note in datum:
          pending_notes.add(int(note))

    if type(datum) == int or type(datum) == float or datum == None:
      if datum != None and datum == 0:
        continue
      # Got a new pause.  Append any pending notes.
      if pending_notes:
        assert len(pending_notes) <= 8, "More than 8 notes at once"
        validated_stream.append(list(pending_notes))
        pending_notes.clear()
      if datum != None:
        pending_pause += float(datum)
  assert len(validated_stream), "Empty stream"
  return {
    "tempo": validated_tempo,
    "stream": validated_stream
  }


f = PlayForever()
f.daemon = True
f.start()

startup()

# Global variable used for last "I'm still alive" status message.
last_status_time = time.time()

print("Watching %s...\n" % FETCH_URL)
while(True):
  fetch()
  time.sleep(5)
