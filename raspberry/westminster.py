#!/usr/bin/python3
"""
Copyright 2021 Neil Fraser

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

"""Compose the Westminster Quarters for the current time, and send to App Engine.
"""

import json
import requests
from datetime import datetime
from time import sleep

# App Engine submission page.
SUBMIT_URL = "https://glockenspiel.appspot.com/submit"

# Larger tempo is slower.
TEMPO = 512

# Number of seconds before the minute to submit the chimes.
LAG = 5

# Look up the nearest quarter and hour.
now = datetime.now()
hour = now.hour
quarter_float = now.minute / 15.0
quarter = int(round(quarter_float))
if quarter == 4:
  hour += 1
elif quarter == 0:
  quarter = 4
if hour > 12:
  hour -= 12
if hour == 0:
  hour = 12
print("Hour: %d Quarter: %d" % (hour, quarter))

group1 = [[92], 0.25, [90], 0.25, [88], 0.25, [83], 0.5]
group2 = [[88], 0.25, [92], 0.25, [90], 0.25, [83], 0.5]
group3 = [[88], 0.25, [90], 0.25, [92], 0.25, [88], 0.5]
group4 = [[92], 0.25, [88], 0.25, [90], 0.25, [83], 0.5]
group5 = [[83], 0.25, [90], 0.25, [92], 0.25, [88], 0.5]

# Assemble the notes.
if quarter == 1:
  stream = group1
elif quarter == 2:
  stream = group2 + group3
elif quarter == 3:
  stream = group4 + group5 + group1
elif quarter == 4:
  stream = group2 + group3 + group4 + group5
  # Append the hour bongs.
  for i in range(hour):
    stream.append(1)
    stream.append([88])

data = json.dumps({"tempo": TEMPO, "stream": stream})

# Wait for the right moment.
now = datetime.now()
delay = -LAG - now.second
while delay < 0:
  delay += 60
print("Waiting %d seconds..." % delay)
sleep(delay)

# Transmit the notes to the server.
x = requests.post(SUBMIT_URL, data = {"data": data})
print(x.text)
