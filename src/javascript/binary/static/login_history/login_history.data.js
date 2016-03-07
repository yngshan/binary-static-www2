var LoginHistoryData = (function(){
    "use strict";
    
    function getHistory(limit){
        var request = {login_history: 1};
        if(limit){
            $.extend(request,limit);
        }
        BinarySocket.send(request);
    }
    
    return{
      getHistory: getHistory,
    };
}());