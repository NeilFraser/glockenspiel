#!/usr/bin/python2.7
"""
Copyright 2019 Google LLC

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

"""Fetch tune from App Engine, and play it.
"""

__author__ = "fraser@google.com (Neil Fraser)"

import json
import pigpio
import signal
import sys
import threading
import time
import urllib2

LOG = open("/home/pi/player.log", "w", 0)

#SOURCE = "http://localhost:13080/fetch"
SOURCE = "https://glockenspiel.appspot.com/fetch"

# Strike time for hammer in seconds.
STRIKE_TIME = 10 / 1000.0

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

LOG.write("Watching %s...\n" % SOURCE)

class PlayForever(threading.Thread):
  """
  Runs in a separate thread.
  """
  def __init__(self):
    global PINOUT, RESET_PIN
    threading.Thread.__init__(self)
    self.pi = pigpio.pi()
    for pinNumber in PINOUT.values():
      self.pi.set_mode(pinNumber, pigpio.OUTPUT)
      self.pi.write(pinNumber, 0)
    self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)
    signal.signal(signal.SIGINT, self.shutdown)

  def run(self):
    global PINOUT, RESET_PIN, new_data
    transcripts = []
    channels = 0
    while(True):
      if new_data:
        dataIsGood = True
        try:
          new_tempo_ms = float(new_data[0])
          assert 5 < new_tempo_ms < 50
          new_transcripts = new_data[1:]
          assert len(new_transcripts) > 0
        except:
          dataIsGood = False
        new_data = None
        if dataIsGood:
          LOG.write("Got new tune: %s\n" % new_transcripts)
          tempo = new_tempo_ms / 1000.0
          transcripts = new_transcripts

          # Insert a pause between the old tune and the new one.
          time.sleep(1)

          # Number of channels
          channels = len(transcripts)
          # Channel pointers
          pointers = [0] * channels
          # Channel clocks
          pauseUntil64ths = [0] * channels
          # Number of 1/64ths notes since the start.
          clock64ths = 0
          # Time of start of execution in seconds.
          startTime = time.time()
          # Turn on the reset LED.
          self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)
          self.pi.write(RESET_PIN, 1)
        else:
          LOG.write("Got invalid tune: %s\n" % transcripts)

      done = True
      activeNotes = []
      for i in xrange(channels):
        transcript = transcripts[i]
        if pointers[i] < len(transcript):
          done = False
          if pauseUntil64ths[i] <= clock64ths:
            dataIsGood = True
            try:
              (note, duration) = transcript[pointers[i]]
              note = int(note)
              duration = float(duration)
            except:
              # Tuple is invalid.  Drop this channel.
              dataIsGood = False
              LOG.write("Got invalid tuple: %s\n" % transcript[pointers[i]])
              transcripts[i] = []
            if dataIsGood:
              if PINOUT.has_key(note):
                self.pi.write(PINOUT[note], 1)
                activeNotes.append(PINOUT[note])
              pauseUntil64ths[i] = duration * 64 + clock64ths
              pointers[i] += 1

      time.sleep(STRIKE_TIME)
      for pinNumber in activeNotes:
        self.pi.write(pinNumber, 0)

      # Switch the reset GPIO pin from LED to button for a moment.
      # If pressed, terminate the tune.
      self.pi.set_mode(RESET_PIN, pigpio.INPUT)
      if self.pi.read(RESET_PIN):
        LOG.write("Tune manually terminated with local reset button.\n")
        done = True
      self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)

      if done:
        # Turn off the reset LED.
        self.pi.write(RESET_PIN, 0)
        if channels > 0:
          channels = 0
          LOG.write("Finished playing tune.  Waiting for next tune.\n")
        time.sleep(1)
      else:
        clock64ths += 1
        s = (startTime + clock64ths * tempo) - time.time()
        if (s > 0):
          time.sleep(s)

  def shutdown(self, sig, frame):
    global PINOUT, RESET_PIN
    # Gracefully shutdown without spewing traceback.
    # Turn off any powered solenoids.
    LOG.write("Shutting down.\n")
    for pinNumber in PINOUT.values():
      self.pi.write(pinNumber, 0)
    self.pi.set_mode(RESET_PIN, pigpio.OUTPUT)
    self.pi.write(RESET_PIN, 0)
    sys.exit(0)

f = PlayForever()
f.daemon = True
f.start()


def fetch():
  global new_data
  # Checks to see if there's a new tune on App Engine.
  try:
    response = urllib2.urlopen(SOURCE)
  except Exception as e:
    LOG.write("Failure to fetch: %s\nTrying again.\n" % e)
    return
  text = response.read()
  if text.strip():
    try:
      new_data = json.loads(text)
    except ValueError:
      LOG.write("Invalid JSON.\nTrying again.\n")

while(True):
  fetch()
  time.sleep(5)
