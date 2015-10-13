/// <reference path="jquery-1.11.3.min.js" />


function SetFilters(ID, ParameterName) {
    var URL = "http://data.econw.com/sankey/meta/{0}/?format=json".format(ParameterName)

    //var Data = $.getJSON(URL,)

    var Data;
    $.ajax({
        dataType: "json",
        url: URL,
        data: Data
    });



}