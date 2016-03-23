var ApplicationsData = (function(){
    "use strict";

    function getApplications(id){
        var request = {oauth_apps: 1};
        if(id){
            $.extend(request,{revoke_app: id});
        }
        BinarySocket.send(request);
    }
    
    return{
      getApplications: getApplications,
    };
}());
