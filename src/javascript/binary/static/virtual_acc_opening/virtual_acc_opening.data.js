var VirtualAccOpeningData = (function(){
    "use strict";

    function getDetails(email, password, residence, verificationCode){
        var req = {
                    new_account_virtual: 1,
                    email: email,
                    client_password: password,
                    residence: residence,
                    verification_code: verificationCode
                };

        if ($.cookie('affiliate_tracking')) {
            req.affiliate_token = JSON.parse($.cookie('affiliate_tracking')).t;
        }

        BinarySocket.send(req);
    }

    return {
        getDetails: getDetails
    };
}());
