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

"""Fetch the latest tune from Datastore using App Engine.
"""

__author__ = "fraser@google.com (Neil Fraser)"

from google.appengine.ext import ndb

class Tune(ndb.Model):
  data = ndb.TextProperty()

print("Content-Type: text/plain\n")

result = Tune.get_by_id("PLAY")
if result:
  print(result.data)
  result.key.delete()
