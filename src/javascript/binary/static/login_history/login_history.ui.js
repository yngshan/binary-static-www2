var LoginHistoryUI = (function(){
    "use strict";
    
    var tableID = "login-history-table",
        columns = ["browser","timestamp","ip","status"];
    
    function createEmptyTable(){
        var header = [
            text.localize("Browser"),
            text.localize("Date & Time"),
            text.localize("IP Location"),
            text.localize("Status"),
        ];
        var metadata = {
            id: tableID,
            cols: columns
        };
        var data = [];
        var $table = Table.createFlexTable(data,metadata,header);
        return $table;
    }
    
    function updateTable(history){
        Table.appendTableBody(tableID, history, createRow);
    }
    
    function createRow(data){
        var history = data['environment'].split(' ');
        var timestamp = history[0];
        var ip = history[2].split('=')[1];
        var browser = history[4].split('=')[1] + " " + 
                        history[5] + " " + history[6] + " " + history[7] + " " + 
                        history[8] + " " + history[9] + " " + history[10] + " " + 
                        history[11] + " " + history[12] + " " + history[13] +
                        " " + history[14];
        var status = data['status'] === 1 ? text.localize('Successful') : text.localize('Failed');
        var $row = Table.createFlexTableRow([browser, timestamp, ip, status], columns, "data");
        $row.children(".timestamp").first().append('<br>' + history[1]);
        return $row[0];
    }
    
    function clearTableContent(){
        Table.clearTableBody(tableID);
        $("#" + tableID +">tfoot").hide();
    }
    
    return{
        createEmptyTable: createEmptyTable,
        updateTable: updateTable,
        clearTableContent: clearTableContent
    };
}());