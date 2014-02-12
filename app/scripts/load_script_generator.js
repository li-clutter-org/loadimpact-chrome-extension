/*
 * Copyright 2014 Load Impact
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Extension namespace.
window.LI = window.LI || {};

(function(LI) {
    var BATCH_THRESHOLD = 3000;
    var PAGE_MATCH_THRESHOLD = 1000;

    LI.LoadScriptGenerator = function() {
        this.lastPage = 0;
    };

    LI.LoadScriptGenerator.prototype.generateFromTransactions = function(transactions, start, end) {
        var self = this,
            ir = [],
            pageOpen = false,
            pages = 0,
            batches = 0,
            batch = [],
            lastUrlTime = Date.now();

        // Make sure we have at least one transaction.
        if (!transactions.length) {
            return '-- No HTTP/HTTPS transactions have been recorded.';
        }

        // Build IR from requests.
        transactions.forEach(function(transaction) {
            var time = transaction.timeStamp;

            // Determine if this transaction represents a new page.
            if (self._isTransactionNewPage(transaction)) {
                // Close batch, if open.
                if (batch.length) {
                    ir.push(['batch', batch]);
                    ++batches;
                    batch = [];
                }

                // Close page, if open.
                if (0 < pages) {
                    ir.push(['pageEnd', 'Page ' + pages]);
                    var fracSleep = (time - lastUrlTime) / 1000,
                        sleep = Math.round(fracSleep);
                    if (sleep > 0) {
                        ir.push(['sleep', sleep]);
                    } else if (fracSleep >= 0.1) {
                        ir.push(['sleep', fracSleep.toFixed(2)]);
                    }
                    pageOpen = false;
                }

                // Start page.
                ir.push(['pageStart', 'Page ' + (pages + 1)]);
                pageOpen = true;
                ++pages;

                // Add page as separate batche.
                ir.push(['batch', [transaction]]);
                ++batches;
            } else {
                // Determine if this URL should start a new batch or join an
                // existing.
                if (!batch.length || (time - lastUrlTime) < BATCH_THRESHOLD) {
                    batch.push(transaction);
                    if (0 === batches) {
                        ir.push(['batch', batch]);
                        ++batches;
                        batch = [];
                    }
                } else {
                    ir.push(['batch', batch]);
                    ++batches;
                    batch = [transaction];
                }
            }

            lastUrlTime = time;
        });

        if (batch.length) {
            ir.push(['batch', batch]);
        }

        if (pageOpen) {
            ir.push(['pageEnd', 'Page ' + pages]);
        }

        ir.push(['sleep', 'math.random(20, 40)']);

        // Compile IR to Lua script.
        return this._compileIRToLua(ir);
    };

    LI.LoadScriptGenerator.prototype._convertFormDataToBodyData = function(formData) {
        var params = [];
        Object.keys(formData).forEach(function(key) {
            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(formData[key][0]));
        });
        return params.join('&');
    };

    LI.LoadScriptGenerator.prototype._getRequestContentType = function(transaction) {
        var contentType = '';
        if (transaction.requestHeaders) {
            transaction.requestHeaders.forEach(function(header) {
                if ('Content-Type' === header.name) {
                    contentType = header.value;
                }
            });
        }
        return contentType;
    };

    LI.LoadScriptGenerator.prototype._getResponseContentType = function(transaction) {
        var contentType = '';
        if (transaction.responseHeaders) {
            transaction.responseHeaders.forEach(function(header) {
                if ('Content-Type' === header.name) {
                    contentType = header.value;
                }
            });
        }
        return contentType;
    };

    LI.LoadScriptGenerator.prototype._isTransactionXHR = function(transaction) {
        var isXHR = false;
        if (transaction.responseHeaders) {
            transaction.responseHeaders.forEach(function(header) {
                if ('X-Requested-With' === header.name &&
                    'XMLHttpRequest' === header.value) {
                    isXHR = true;
                }
            });
        }
        return isXHR;
    };

    LI.LoadScriptGenerator.prototype._isTransactionNewPage = function(transaction) {
        // Only accept 200 codes. This avoids redirect pages that often contain
        // proper HTML.
        if (200 !== transaction.responseStatusCode) {
            return false;
        }

        // Require "Content-Type" header.
        var contentType = this._getResponseContentType(transaction),
            hasContentType = '' !== contentType;
        if (!hasContentType) {
            return false;
        }

        // No XHR requests.
        if (this._isTransactionXHR(transaction)) {
            return false;
        }

        // Check for document/page content type.
        var hasDoContentType = false;
        ['text/html', 'application/xhtml', 'application/xml'].forEach(function(docContentType) {
            if (-1 !== contentType.indexOf(docContentType)) {
                hasDoContentType = true;
            }
        });
        if (!hasDoContentType) {
            return false;
        }

        // Check when last page was seen (if any) and how long ago that was.
        if (0 === this.lastPage ||
            (transaction.timeStamp - this.lastPage) >= PAGE_MATCH_THRESHOLD) {
            this.lastPage = transaction.timeStamp;
            return true;
        }

        return false;
    };

    LI.LoadScriptGenerator.prototype._compileIRToLua = function(ir) {
        var self = this,
            script = '';
        ir.forEach(function(node) {
            if ('batch' === node[0]) {
                script += "http.request_batch({\n";
                var requests = [];
                node[1].forEach(function(transaction) {
                    var method = transaction.method.toUpperCase(),
                        headers = {},
                        bodyMethods = ['POST', 'PUT'],
                        body = transaction.requestBody,
                        contentType = self._getRequestContentType(transaction),
                        base64ContentTypes = ['multipart/form-data', 'application/x-amf'],
                        requestIR = [method, transaction.url];

                    // Add X-headers.
                    if (transaction.requestHeaders) {
                        transaction.requestHeaders.forEach(function(header) {
                            if (0 === header.name.indexOf('X-')) {
                                headers[header.name] = header.value;
                            } else if (0 === header.name.indexOf('Authorization')) {
                                headers[header.name] = header.value;
                            }
                        });
                    }

                    // Handle request body.
                    if (transaction.requestBody && transaction.requestBody !== '') {
                        var shouldBase64Body = false;
                        if ($.inArray(method, bodyMethods) &&
                            '' !== contentType &&
                            $.inArray(contentType, base64ContentTypes)) {
                            shouldBase64Body = true;
                        } else if (/[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(body)) { // Look for binary data.
                            shouldBase64Body = true;
                        }

                        headers['Content-Type'] = contentType;
                        requestIR.push(['headers', headers]);

                        if (shouldBase64Body) {
                            requestIR.push(['data', '"' + btoa(body[0].bytes) + '"']);
                            requestIR.push(['base64_encoded_body', 'true']);
                        } else {
                            if ($.isPlainObject(body)) {
                                requestIR.push(['data', '"' + self._convertFormDataToBodyData(body) + '"']);
                            } else {
                                var bodyAsString = String.fromCharCode.apply(null, new Uint8Array(body[0].bytes));
                                requestIR.push(['data', '"' + bodyAsString.replace(/"/g, '\\\"').replace(/[\r\n]/g, "") + '"']);
                            }
                        }
                    } else if (Object.keys(headers).length) {
                        requestIR.push(['headers', headers]);
                    }

                    // Add compression handling.
                    requestIR.push(['auto_decompress', 'true']);

                    // Compile request IR into a Lua string.
                    requests.push("\t{" + self._compileRequestIRToLua(requestIR) + "}");
                });
                script += requests.join(",\n") + "\n})\n\n";
            } else if ('pageStart' === node[0]) {
                script += 'http.page_start("' + node[1] + '")\n';
            } else if ('pageEnd' === node[0]) {
                script += 'http.page_end("' + node[1] + '")\n\n';
            } else if ('sleep' === node[0]) {
                script += 'client.sleep(' + node[1] + ')\n\n';
            }
        });
        return script;
    };

    LI.LoadScriptGenerator.prototype._compileRequestIRToLua = function(requestIR) {
        var params = [];
        requestIR.forEach(function(param) {
            if ($.isArray(param)) {
                if ($.isPlainObject(param[1])) {
                    var items = [];
                    Object.keys(param[1]).forEach(function(key) {
                        items.push('["' + key + '"]="' + param[1][key] + '"');
                    });
                    params.push(param[0] + '=' + '{' + items.join(',') + '}');
                } else {
                    params.push(param[0] + '=' + param[1]);
                }
            } else {
                params.push('"' + param + '"');
            }
        });
        return params.join(', ');
    };
})(LI);
