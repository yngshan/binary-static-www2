var FinancialAssessmentws = (function(){
   "use strict";
   
    var init = function(){
        LocalizeText();
        $("#assessment_form").removeClass('invisible');
        $("#assessment_form").on("submit",function(event) {
            event.preventDefault();
            submitForm();
            return false;
        });
    };
   
    // For translating strings
    var LocalizeText = function(){
        $("#heading").text(text.localize($("#heading").text())); 
        $("legend").text(text.localize($("legend").text()));
        $("#assessment_form label").each(function(){
            var ele = $(this);
            ele.text(text.localize(ele.text()));
        });
        $("#assessment_form option").each(function(){
            var ele = $(this);
            ele.text(text.localize(ele.text()));
        });
        $("#warning").text(text.localize($("#warning").text()));
        $("#submit").text(text.localize($("#submit").text()));
    };
    
    var submitForm = function(){
        var data = {'set_financial_assessment' : 1};
        showLoadingImg();
        $('#assessment_form select').each(function(){
            data[$(this).attr("id")] = $(this).val();
        });
        console.log(data['estimated_worth']);
        console.log(data['net_income']);
        BinarySocket.send(data);
    };
    
    var showLoadingImg = function(){
        showLoadingImage($('<div/>', {id: 'loading'}).insertAfter('#heading')); 
        $("#assessment_form").addClass('invisible');
    };
    
    var hideLoadingImg = function(){
        $("#loading").remove();
        $("#assessment_form").removeClass('invisible');
    };
    
    var apiResponse = function(response){
        console.log(response);
    };
    return {
        init : init,
        apiResponse : apiResponse
    };
}());


pjax_config_page("user/assessmentws", function() {
    return {
        onLoad: function() {
            if (page.client.redirect_if_logout() || page.client.redirect_if_is_virtual('user/my_accountws')) {
                return;
            }

            BinarySocket.init({
                onmessage: function(msg) {
                    var response = JSON.parse(msg.data);
                    if (response) {
                        FinancialAssessmentws.apiResponse(response);
                    }
                }
            });

            FinancialAssessmentws.init();
        }
    };
});
