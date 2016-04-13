/*
 * Handles trading page default values
 * 
 * Priorities:
 * 1. Client's input: on each change to form, it will reflect to both query string & session storage
 * 2. Query string parameters: will change session storage values
 * 3. Session storage values: if none of the above, it will be the source
 *
 */

var Defaults = (function(){
    'use strict';

    var getDefault = function(key) {
        var pValue = page.url.param(key),
            sValue = sessionStorage.getItem(key);
        if(pValue && !sValue) {
            sessionStorage.setItem(key, pValue);
        }
        if(!pValue && sValue) {
            setDefault(key, sValue);
        }
        return pValue || sValue;
    };

    var setDefault = function(key, value) {
        if(key) {
            value = value || '';
            sessionStorage.setItem(key, value);
            var params = page.url.params_hash();
            params[key] = value;
            window.history.replaceState(null, null, window.location.pathname + '?' + page.url.params_hash_to_string(params));
        }
    };

    var removeDefault = function() {
        var params = page.url.params_hash();
        for (var i = 0; i < arguments.length; i++) {
            sessionStorage.removeItem(arguments[i]);
            delete(params[arguments[i]]);
        }
        window.history.replaceState(null, null, window.location.pathname + '?' + page.url.params_hash_to_string(params));
    };

    return {
        get   : getDefault,
        set   : setDefault,
        remove: removeDefault,
    };
})();
