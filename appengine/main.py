"""
Copyright 2020 Neil Fraser

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

import cgi
import datetime
import expiration
import storage
from google.cloud import ndb


# Datastore models.
# Tune waiting on server for collection by the glockenspiel.
class Tune(ndb.Model):
  data = ndb.TextProperty()
# Last time the glockenspiel fetched from the server.
class Time(ndb.Model):
  data = ndb.DateTimeProperty()


# Route to requested handler.
def app(environ, start_response):
  if environ["PATH_INFO"] == "/":
    return redirect(environ, start_response)
  if environ["PATH_INFO"] == "/submit":
    return submit(environ, start_response)
  if environ["PATH_INFO"] == "/fetch":
    return fetch(environ, start_response)
  if environ["PATH_INFO"] == "/storage":
    return storage.app(environ, start_response)
  if environ["PATH_INFO"] == "/expiration":
    return expiration.app(environ, start_response)
  start_response("404 Not Found", [])
  return [b"Page not found."]


# Redirect for root directory.
def redirect(environ, start_response):
  headers = [
    ("Location", "/editor/index.html")
  ]
  start_response("301 Found", headers)
  return []


# Store the latest tune in Datastore using App Engine.
def submit(environ, start_response):
  forms = cgi.FieldStorage(fp=environ["wsgi.input"], environ=environ)
  data = forms["data"].value

  client = ndb.Client()
  with client.context():
    row = Tune(id="PLAY", data=data)
    row.put()
    result = Time.get_by_id("WHEN")

  delta = datetime.datetime.now() - result.data
  if delta.total_seconds() < 60:
    out = "Your tune has been sent to the glockenspiel and will play shortly."
  else:
    out = "The glockenspiel appears to be offline at the moment."

  headers = [
    ("Content-Type", "text/plain")
  ]
  start_response("200 OK", headers)
  return [out.encode("utf-8")]


# Fetch the latest tune from Datastore using App Engine.
def fetch(environ, start_response):
  out = ""
  client = ndb.Client()
  with client.context():
    result = Tune.get_by_id("PLAY")
    if result:
      out = result.data
      result.key.delete()
    # Record that the glockenspiel is online as of this time.
    row = Time(id="WHEN", data=datetime.datetime.now())
    row.put()

  headers = [
    ("Content-Type", "text/plain")
  ]
  start_response("200 OK", headers)
  return [out.encode("utf-8")]
