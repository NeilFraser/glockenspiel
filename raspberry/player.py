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
import threading
import time
import urllib2
from gpiozero import LED


#SOURCE = "http://localhost:13080/fetch"
SOURCE = "https://glockenspiel.appspot.com/fetch"

# Strike time for hammer in seconds.
STRIKE_TIME = 10 / 1000.0

# Global variable used to pass parsed JSON from the fetch loop
# to the play thread.
new_data = None

print("Watching %s..." % SOURCE)

class PlayForever(threading.Thread):
  """
  Runs in a separate thread.
  """
  def __init__(self):
    threading.Thread.__init__(self)
    self.outputs = {}
    pinNumber = 2
    for note in xrange(81, 106):
      self.outputs[note] = LED(pinNumber)
      self.outputs[note].off()
      pinNumber += 1

  def run(self):
    global new_data
    transcripts = []
    channels = 0
    while(True):
      if new_data:
        tempo = new_data[0] / 1000.0
        transcripts = new_data[1:]
        new_data = None
        print("Got new tune: %s" % transcripts)

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

      done = True
      for i in xrange(channels):
        transcript = transcripts[i]
        if pointers[i] < len(transcript):
          done = False
          if pauseUntil64ths[i] <= clock64ths:
            (note, duration) = transcript[pointers[i]]
            if self.outputs.has_key(note):
              self.outputs[note].on()
            pauseUntil64ths[i] = duration * 64 + clock64ths
            pointers[i] += 1

      time.sleep(STRIKE_TIME)
      for note in self.outputs.keys():
        self.output[note].off()

      if done:
        if clock64ths > 0:
          clock64ths = 0
          print("Finished playing tune.  Waiting for next tune.")
        time.sleep(1)
      else:
        clock64ths += 1
        s = (startTime + clock64ths * tempo) - time.time()
        if (s > 0):
          time.sleep(s)


f = PlayForever()
f.daemon = True
f.start()


def fetch():
  global new_data
  # Checks to see if there's a new tune on App Engine.
  response = urllib2.urlopen(SOURCE)
  text = response.read()
  try:
    new_data = json.loads(text)
  except ValueError:
    pass


while(True):
  fetch()
  time.sleep(5)
