/**
 * Create a NameSpace for Datasets
 */
var Datasets = {};
//var Code = require('./code');
Datasets.convert = {};
Datasets.imported = {};

/**
 * Tracks built-in datasets that have been imported
 */
Datasets.loaded = {
    "iris":false,
    "california_housing":false
};


/**
 * Construct the blocks required by the flyout for the colours category.
 * @param {!Blockly.Workspace} workspace The workspace this flyout is for.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Datasets.flyoutCallback = function(workspace) {
    // Returns dataset blocks
    var xmlList = [];
    var datasetList = Object.keys(Datasets.loaded);
    var labelText = '<xml><label text="Import datasets from the Data Explorer"></label></xml>';
    var label = Blockly.Xml.textToDom(labelText).firstChild;
    xmlList.push(label);
    for (var index in datasetList){
        var name = datasetList[index];
        if (Datasets.loaded[name] == true && Datasets.imported[name]!=undefined) {
               Datasets.generateBlock(name);
            var blockText = '<xml>' +
                '<block type="'+name+'_get">' +
                '</block>' +
                '</xml>';
            var block = Blockly.Xml.textToDom(blockText).firstChild;
            xmlList.push(block);
        }
    }
    return xmlList;
};

/**
 * Defines dataset blocks dynamically
 * @param name - name of loaded dataset
 */
Datasets.generateBlock = function(name){
        var keys = Object.keys(Datasets.imported[name]);
        Datasets.imported[name]["options"] = [];
        for(var index in keys){
            var option = keys[index];
            var optionname = keys[index];
            Datasets.imported[name]["options"].push([option,optionname]);
        }
        Datasets.generateBlockDefinition(name);
        Blockly.JavaScript[name+"_get"] = Datasets.codegenTemplate(name);
    
}
Datasets.generateBlockDefinition = function(name){
    if(Datasets.imported[name]!=undefined){
        Blockly.defineBlocksWithJsonArray([{
            "type": name+"_get",
            "message0": "get %1 from " + name,
            "args0": [
                {
                "type": "field_dropdown",
                "name": "index",
                "options": Datasets.imported[name].options,
                }
            ],
            "output": "Array",
            "colour": Blockly.Msg.HISTOGRAM_HUE,
            "tooltip": "Get chosen attribute from " + name + "dataset",
            "helpUrl": ""
        }]);
    }
};
/**
 * Triggers a click for input element fileLoader
 */

Datasets.triggerClick = function(){
    $("#fileLoader").click();
};

/**
 * Reads csv file selected by user
 * @param event - File Input event
 */

Datasets.uploadDataset= function(event){
    var file = event.target.files[0];
    var fileName = file.name.replace(".csv","");
    if(file.type == "text/csv" || file.type == "application/vnd.ms-excel"){
        $("#confirmModalTrigger").click();
        Datasets.readUploadedFile(file);
    }
    else{
        Helpers.showAlert("Error","Only csv files supported");
    }
};

/**
 * Custom confirm Template
 * @param fileName - name of uploaded file
 */
Datasets.readUploadedFile = function(file){
    var fileName = file.name;
    var reader = new FileReader();
    if(Datasets.fileName == undefined){
        Datasets[fileName] = {};
        Datasets[fileName].header = false;
        Datasets[fileName].rows = [];
    }
    else{
        Helpers.showAlert("File Error", " A File already exists with the name. This will update the contents of the previously loaded file!");
    }
    reader.onprogress = function(){
        $('#loadingDiv').show();
    }
    reader.onloadend = function(){
        $('#loadingDiv').hide();
    }
    reader.onerror = function(){
        Helpers.showAlert("Error", " Error encountered while reading file. Please try again!");
    }
    reader.onabort = function(){
        Helpers.showAlert("Error", "File reading aborted");
    }
    reader.onload = function(){
        console.log("onload");
        var data = String(reader.result).split("\n");
        var nrows = data.length;
        var noAttributes;
        if(data[0]!=undefined){
            noAttributes = data[0].split(",").length;
        }
        for(var i = 0 ;i < nrows-1; i++)
        {
            var rowElements = data[i].split(",");
            var rowToString = [];
            for(var j = 0; j < noAttributes; j++)
                rowToString.push(String(rowElements[j]));
            Datasets[fileName].rows.push(rowToString);
        }
        Datasets.loaded[fileName] = true;
        $("#dataset_list").append(
            '<li><button class="button-none" onclick="Datasets.show(\''+fileName+'\')">'+fileName+'</button></li>'
        );
        console.log(Datasets[fileName]);
        Datasets.checkHeader(fileName);
        Datasets.show(fileName);
    }
    $('#confirmBody').html(" Is the first row a header row?" +
                            "<br>If not default column headers will be used.");
        $('#confirmBtnYes').on("click",function(){
            Datasets[fileName].header = true;
            reader.readAsText(file);
            $('confirmModal').modal('hide');
        });
        $('#confirmBtnNo').on("click",function(){
            reader.readAsText(file);
            $('confirmModal').modal('hide');
        });
};

/**
 *
 * @param {*} name - Dataset
 * Checks whether the uploaded file has its first row as header or not.
 * If not it arbitarily assigns headers to it.
 * Headers are immutable
 */
Datasets.checkHeader = function(name){
    if(Datasets[name].rows[0]==undefined){
        Helpers.showAlert("File Error"," Nothing to read! Please try again!");
        return;
    }
    if(Datasets[name].header){
        Datasets[name].headers = Datasets[name].rows[0];
        Datasets[name].rows.shift();
    }
    else if(!Datasets[name].header){
        var rowLength = Datasets[name].rows[0].length;
        Datasets[name].headers = [];
        for(var i = 0;i < rowLength; i++){
            Datasets[name].headers.push(String.fromCharCode(i+65));
        }
    }
    Datasets.imported[name] = Datasets.convert.rowsToMap(Datasets[name]);
    Datasets[name].header = true;
}
/**
 * Generates code generator dynamically for dataset blocks
 * @param
 */
Datasets.codegenTemplate = function (name) {
    return function (block) {
        var dropdown_index = block.getFieldValue('index');
        // TODO: Assemble JavaScript into code variable.
        var code = 'Datasets.imported["' + name + '"]["'+dropdown_index+'"]';
        // TODO: Change ORDER_NONE to the correct strength.
        return [code, Blockly.JavaScript.ORDER_ATOMIC];
    };
};
/**
 * Imports dataset given as parameter
 * @param {string} name
 */

Datasets.importBuiltIn = function(){
    var name = $("#builtInDropdown").val();
    if (name == undefined) return;
    if (Datasets.loaded[name]== undefined || Datasets.loaded[name]) return;
    var scriptElement = document.createElement("script");
    scriptElement.setAttribute("id",name+"_dataset");
    scriptElement.src = "datasets/"+name+".js";
    scriptElement.onload = function () {
        Datasets.loaded[name] = true;
        Datasets.imported[name] = Datasets.convert.rowsToMap(Datasets[name]);
        $("#dataset_list").append(
            '<li><button class="button-none" onclick="Datasets.show(\''+name+'\')">'+name+'</button></li>'
        );
    };
    document.head.appendChild(scriptElement);
}

Datasets.newJexcelHandler = function(name) {
    return function(table){ 
        console.log(name);
        var headerLength = Datasets[name].headers.length;
        var newColumn = table.jexcel('getHeader',headerLength-1);
        Datasets[name].headers.push(newColumn); 
        console.log(newColumn);
        Datasets.imported[name] = Datasets.convert.rowsToMap(Datasets[name]);
        Code.workspace.updateToolbox(document.getElementById('toolbox'));
    }
};   

/**
 * Shows the loaded dataset on screen
 * @param {string} name
 */
Datasets.show = function(name){
    if (Datasets.loaded[name] == undefined || Datasets.loaded[name]==false) return;
    var data = Datasets[name].rows;
    var colWidths = [];
    for(var i = 0; i < Datasets[name].headers.length; i++){
        colWidths.push(100);
    }
    var handler = Datasets.newJexcelHandler(name);
    console.log(handler);
    $('#dataset_output').jexcel({data:data, colWidths:colWidths, colHeaders:Datasets[name].headers, oninsertcolumn: handler});
    $('#dataset_save').html('Save ' + name);
    $('#dataset_save').show();
    $('#dataset_save').on('click',function(){
        Datasets[name].rows = $("#dataset_output").jexcel('getData');
        Datasets.imported[name] = Datasets.convert.rowsToMap(Datasets[name]);
    });
}
/**
 * Converts from
 * @param {object} data = {
 *    header: ["id","class","items"],
 *    rows: [
 *           [3, 'A', 'Cheese', 1, '2017-01-12'],
 *           [1, 'B', 'Apples', 1, '2017-01-12'],
 *    ]
 *  }
 * To
 * @returns {object} = {
 *      id:[3,1]
 *      class:['A','B']
 *      items:['Cheese','Apples']
 *  }
*/
Datasets.convert.rowsToMap = function(data){
    var dataLength = data.rows.length;
    var dataDictionary = {};
    var headers = data.headers;
    var rowLength = headers.length;
    for(var head in headers){
        dataDictionary[headers[head]] = [];
    }
    for(var i = 0; i < dataLength; i++){
        var row = data.rows[i];
        for(var j = 0; j < row.length; j++){
            dataDictionary[headers[j]].push(row[j]);
        }
    }
    return dataDictionary;
}
/**
 * @param {object} dataDictionary =
 *      id:[3,1]
 *      class:['A','B']
 *      items:['Cheese','Apples']
 *
 * @returns {object} data = {
 *    fields: ["id","class","items"],
 *    rows: [
 *           [3, 'A', 'Cheese', 1, '2017-01-12'],
 *           [1, 'B', 'Apples', 1, '2017-01-12'],
 *    ]
 *  }
*/

Datasets.convert.mapToRows = function(dataDictionary){
    var rows = [];
    var keys = Object.keys(dataDictionary);
    var rowLength = dataDictionary[keys[0]].length;
    for(var i = 0; i < rowLength; i++)
    {
        var row = [];
        for(var key in keys)
        {
            var attributeValue = dataDictionary[key][i];
            row.push(attributeValue);
        }
        rows.push(row);
    }
    return rows;
}

/**
 * Equivalent of python's zip function
 * @param {*} arrays
 * Converts ([1,2][a,b][x,y]..) to [[1,a,x],[2,b,y]...]
 */
Datasets.zip = function(...arrays){
    const length = Math.min(...arrays.map(arr => arr.length));
    return Array.from({ length }, (value, index) => arrays.map((array => array[index])));
};

module.exports = Datasets;