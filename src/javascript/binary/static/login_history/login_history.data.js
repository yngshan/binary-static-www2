var LoginHistoryData = (function(){
    "use strict";
    
    function get(limit){
        var request = {login_history: 1};
        if(limit){
            $.extend(request,limit);
        }
        BinarySocket.send(request);
    }
    
    return{
      get: get
    };
}());