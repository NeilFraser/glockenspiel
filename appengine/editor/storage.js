/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Loading and saving blocks with cloud storage.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

// Create a namespace.
var BlocklyStorage = {};

/**
 * If code recorded code changes, delete the URL hash.
 * @type ?string
 */
BlocklyStorage.startCode = null;

/**
 * Save blocks or JS to database and return a link containing key.
 */
BlocklyStorage.link = function() {
  if (location.protocol === 'file:') {
    BlocklyStorage.alert_('Cannot submit XHR from "file:" URL.');
    return;
  }
  var code = Music.getCode();
  BlocklyStorage.makeRequest_('/storage', 'xml=' + encodeURIComponent(code),
      BlocklyStorage.handleLinkResponse_);
};

/**
 * Retrieve XML text from database using given key.
 * @param {string} key Key to XML, obtained from href.
 */
BlocklyStorage.retrieveXml = function(key) {
  BlocklyStorage.makeRequest_('/storage', 'key=' + encodeURIComponent(key),
      BlocklyStorage.handleRetrieveXmlResponse_);
};

/**
 * Global reference to current AJAX request.
 * @type {XMLHttpRequest}
 * @private
 */
BlocklyStorage.httpRequest_ = null;

/**
 * Fire a new AJAX request.
 * @param {string} url URL to fetch.
 * @param {string} data Body of data to be sent in request.
 * @param {!Function} onSuccess Function to call after request completes
 *    successfully.
 * @private
 */
BlocklyStorage.makeRequest_ = function(url, data, onSuccess) {
  if (BlocklyStorage.httpRequest_) {
    // AJAX call is in-flight.
    BlocklyStorage.httpRequest_.abort();
  }
  BlocklyStorage.httpRequest_ = new XMLHttpRequest();

  BlocklyStorage.httpRequest_.onload = function() {
    if (this.status === 200) {
      onSuccess.call(this);
    } else {
      BlocklyStorage.alert_(BlocklyStorage.HTTPREQUEST_ERROR +
          '\nXHR status: ' + this.status);
    }
    BlocklyStorage.httpRequest_ = null;
  };
  BlocklyStorage.httpRequest_.open('POST', url);
  BlocklyStorage.httpRequest_.setRequestHeader('Content-Type',
      'application/x-www-form-urlencoded');
  BlocklyStorage.httpRequest_.send(data);
};

/**
 * Callback function for link AJAX call.
 * @param {string} responseText Response to request.
 * @private
 */
BlocklyStorage.handleLinkResponse_ = function() {
  var data = this.responseText.trim();
  window.location.hash = data;
  BlocklyStorage.alert_(BlocklyStorage.LINK_ALERT.replace('%1',
      window.location.href.replace('/editor/index.html#', '/#')));
  BlocklyStorage.startCode = Music.getCode();
};

/**
 * Callback function for retrieve XML AJAX call.
 * @param {string} responseText Response to request.
 * @private
 */
BlocklyStorage.handleRetrieveXmlResponse_ = function() {
  var data = this.responseText.trim();
  if (!data.length) {
    BlocklyStorage.alert_(BlocklyStorage.HASH_ERROR.replace('%1',
        window.location.hash));
  } else {
    Music.setCode(data);
  }
  BlocklyStorage.startCode = Music.getCode();
};

/**
 * Present a text message to the user.
 * @param {string} message Text to alert.
 * @private
 */
BlocklyStorage.alert_ = function(message) {
  var linkButton = document.getElementById('linkButton');
  linkButton.blur();  // Don't reopen dialog with space key.
  MusicDialogs.storageAlert(linkButton, message);
};

BlocklyStorage.HTTPREQUEST_ERROR = 'There was a problem with the request.\n';
BlocklyStorage.LINK_ALERT = 'Share your blocks with this link:\n\n%1';
BlocklyStorage.HASH_ERROR = 'Sorry, "%1" doesn\'t correspond with any saved Blockly file.';
