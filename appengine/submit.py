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

"""Store the latest tune in Datastore using App Engine.
"""

__author__ = "fraser@google.com (Neil Fraser)"

import cgi
from google.appengine.ext import ndb

class Tune(ndb.Model):
  data = ndb.TextProperty()

print("Content-Type: text/plain\n")

forms = cgi.FieldStorage()
data = forms["data"].value

row = Tune(id = "PLAY", data = data)
row.put()

print("Your tune has been sent to the glockenspiel and will play shortly.")
