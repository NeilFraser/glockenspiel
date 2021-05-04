#!/usr/bin/python2.7
"""
Copyright 2021 Google LLC

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

# App Engine submission page.
SUBMIT_URL = 'https://glockenspiel.appspot.com/submit'

# Larger tempo is slower.
TEMPO = 512

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

group1 = [[92, 0.25], [90, 0.25], [88, 0.25], [83, 0.5]]
group2 = [[88, 0.25], [92, 0.25], [90, 0.25], [83, 0.5]]
group3 = [[88, 0.25], [90, 0.25], [92, 0.25], [88, 0.5]]
group4 = [[92, 0.25], [88, 0.25], [90, 0.25], [83, 0.5]]
group5 = [[83, 0.25], [90, 0.25], [92, 0.25], [88, 0.5]]

# Assemble the notes.
if quarter == 1:
  notes = group1
elif quarter == 2:
  notes = group2 + group3
elif quarter == 3:
  notes = group4 + group5 + group1
elif quarter == 4:
  notes = group2 + group3 + group4 + group5
  notes.append([-1, 1])
  # Append the hour bongs.
  for i in range(hour):
    notes.append([88, 1])

# Transmit the notes to the server.
data = json.dumps({'tempo': TEMPO, 'voices': [notes]})
x = requests.post(SUBMIT_URL, data = {'data': data})
print(x.text)
