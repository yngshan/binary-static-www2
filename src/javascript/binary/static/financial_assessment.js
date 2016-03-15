var FinancialAssessmentws = (function(){
   "use strict";
   
   var init = function(){
       LocalizeText();
       $("assessment_form").removeClass("invisible");
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
});
