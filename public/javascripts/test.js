/*
This app can show the accessibility based on time period and travel method
The accessibility is the logsum of logsum.
There is one slider on the top of the left corner of the map which can switch between showing a static accessibility and a zone-to-zone accessibility
There is two radio buttons on the bottom of the left corner which can change the scale of the map.
If the user selects 'relative to auto', then all the accessibility is based on the best scale of 'Auto AM'.
If the user selects 'Absolute', the app will sort the selected matrix from smallest to largest and divide the sorted array into bins for each color.
By this method, the gravity map can have a beautiful and balanced look.

If you want to update the data, it is important to follow the data format. If you want to change the files' names,
you can change the following initialization variables.
*/

var map;
//csv files' names
//you can update the name if you are trying to use new datasets
//Transit_Total_Time_AM.csv is a summation of 'Transit_****.csv'.
//You can use /python/mergeCSV.py script to do this process firstly and then get the csv we need in this App
var zoneToZoneFiles = {
    'D': '../data/Distance_mf2.csv',
    'A_AM': '../data/SOV_AUTO_Time_AM_Cr_mf1.csv',
    'T_AM': '../data/Transit_Total_Time_AM.csv',
    'W_AM':  '../data/Walk_Time_AM_Cr_mf486.csv',
};
var POP_EMP_PSE_HS = '../data/2015_POP_EMP_PSE_HS.csv'; //pop,emp,pse,hs data!
var travelType = 'A_AM';//default travel type, you could change it to any key of zoneToZoneFiles
var jobType = 'Total Employment';
var popEmp;
var accessibilityResult;
var travelTypeDict = {};
var q = d3.queue();
var check = false;
var largestIndividualArray = [];
var largestAccessibilityArray = [];
var relativeLegend = true;
var selectZone = '101'; //default selected zone when the user enters the web page
//read data one by one and store data in the memory
for(var key in zoneToZoneFiles){
    q = q.defer(d3.csv,zoneToZoneFiles[key])
}
q.defer(d3.csv,POP_EMP_PSE_HS).await(brushMap);
//main function
function brushMap(error){
    if (!error) {
        travelTypeDict = {};
        // Either simply loop them:
        for (var i=1; i<arguments.length-1; i++){
            travelTypeDict[ Object.keys(zoneToZoneFiles)[i-1]] = buildMatrixLookup(arguments[i]);
        }
        popEmp = buildMatrixLookup2(arguments[arguments.length-1])
    }
    else{

        alert('Error Occurs when loading data!');
        return;
    }

    //store data into a json format
    //it will be very convenient to be used later
    //for example, if the user selects 'Auto, AM' option, you can get the data through travelTypeDict['A_AM']
    require(["esri/renderers/SimpleRenderer","esri/SpatialReference","esri/geometry/Point",
        "esri/geometry/webMercatorUtils","dojo/dom",
      "esri/layers/GraphicsLayer",
      "esri/geometry/Polyline",
      "esri/geometry/Extent",
      "dojo/dom-construct",
      "esri/tasks/query",
      "esri/graphic",
      "dojo/_base/array",
      "esri/dijit/Popup",
      "esri/dijit/PopupTemplate",
      "dojo/dom-class",
      "esri/dijit/BasemapToggle",
      "esri/dijit/Legend",
        "esri/map", "esri/layers/FeatureLayer",
        "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol","esri/symbols/SimpleMarkerSymbol",
        "esri/renderers/ClassBreaksRenderer",
        "esri/Color", "dojo/dom-style", "dojo/domReady!"
    ], function(SimpleRenderer,SpatialReference,Point,webMercatorUtils,dom,GraphicsLayer,Polyline,
      Extent,domConstruct,
      Query,Graphic,arrayUtils,Popup, PopupTemplate,domClass,BasemapToggle,Legend,Map, FeatureLayer,
        InfoTemplate, SimpleFillSymbol,SimpleLineSymbol,SimpleMarkerSymbol,
        ClassBreaksRenderer,
        Color, domStyle
    ) {
        //store map's onClick or onHover connections
        var connections = [];
        // var PSELayer;
        var popup = new Popup({  
          fillSymbol:
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 0, 0]), 2)
        }, domConstruct.create("div"));
  
        map = new Map("map", {
            basemap: "dark-gray-vector",
            center: [-113.4909, 53.5444],
            zoom: 9,
            minZoom:6,
            infoWindow: popup,
            slider: false
        });
        map.setInfoWindowOnClick(true);
        //Control baselayer
        var toggle = new BasemapToggle({
           map: map,
           basemap: "streets"
         }, "viewDiv");
         
        toggle.startup();
        //text template related to your mouse clicking event
        var template = new InfoTemplate();
        template.setContent(getTextContent);
        //Since it is very hard to use the same scale to show all the matrices
        //it is necessary to automatically adjust the scale based on the data distribution of all the matrices
        largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
        //get accessiblity through the selected matrix
        accessibilityResult = accessibilityCalculation(travelTypeDict[travelType],jobType);
        var featureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
            infoTemplate: template
        });
        var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
        });
        var pseLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/pse/FeatureServer/0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
        });
        featureLayer.on('click',function(evt){
          var graphic = evt.graphic;
          selectZone = graphic.attributes.TAZ_New;
        });
        var legendLayers = [];
        //add layers on the map
        map.on('load',function(){
            map.on("mouse-move", showCoordinates);
            map.addLayer(featureLayer);
            map.addLayer(lrtFeatureLayer);
            map.addLayer(pseLayer);
            //generate legends
            legendLayers.push({layer:pseLayer,title:'Institutions'},{layer:lrtFeatureLayer,title:'LRT'},{ layer: featureLayer, title: 'Legend' });
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });

        //when the user changes his selection, the map should change as well
        //this function will redraw the layer on the map in a different color
        function redrawLayer(ClassBreaksRenderer,accessibilityResult){
            $('.legendClass').remove();
            var sort = [];
            //slider checker
            if(check === true){
              var largestIndividualResultArray = Object.values(largestIndividualArray);
              sort = largestIndividualResultArray.sort((prev,next)=>prev-next); //from smallest to largest
            }
            else{
              var largestAccessibilityResultArray = Object.values(largestAccessibilityArray);          
              sort = largestAccessibilityResultArray.sort((prev,next)=>prev-next); //from smallest to largest
            }
            //chunk size for each color
            var chunkZones = 74;        
            sort = sort.map(function (x) { 
              return parseInt(x, 10); 
            });  
            var symbol = new SimpleFillSymbol();
            //a new class breaks render.
            var renderer = new ClassBreaksRenderer(symbol, function(feature){
              var r = accessibilityResult[feature.attributes.TAZ_New];
              return accessibilityResult[feature.attributes.TAZ_New];
            });
            //add break points and color information
            renderer.addBreak(0, sort[chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
            renderer.addBreak(sort[chunkZones], sort[2*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	249, 238, 237,0.90])));
            renderer.addBreak(sort[2*chunkZones], sort[3*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([243, 224, 219,0.90])));
            renderer.addBreak(sort[3*chunkZones], sort[4*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([237, 214, 202,0.90])));
            renderer.addBreak(sort[4*chunkZones], sort[5*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([225, 200, 170,0.90])));
            renderer.addBreak(sort[5*chunkZones],  sort[6*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([213, 196, 141,0.90])));
            renderer.addBreak(sort[6*chunkZones],  sort[7*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([207, 197, 127,0.90])));
            renderer.addBreak(sort[7*chunkZones], sort[8*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([201, 199, 113,0.90])));
            renderer.addBreak(sort[8*chunkZones], sort[9*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([185, 195, 101,0.90])));
            renderer.addBreak(sort[9*chunkZones], sort[10*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([168, 189, 88,0.90])));
            renderer.addBreak(sort[10*chunkZones], sort[11*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([149, 183, 77,0.90])));
            renderer.addBreak(sort[11*chunkZones], sort[12*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([129, 177, 66,0.90])));
            renderer.addBreak(sort[12*chunkZones], sort[14*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([109, 171, 55,0.90])));
            renderer.addBreak(sort[14*chunkZones], sort[16*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([87, 165, 45,0.90])));
            renderer.addBreak(sort[16*chunkZones], sort[18*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	66, 159, 36,0.90])));
            renderer.addBreak(sort[18*chunkZones], sort[20*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([44, 153, 27,0.90])));  
            renderer.addBreak(sort[20*chunkZones], sort[22*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	37, 121, 24,0.90])));
            renderer.addBreak(sort[22*chunkZones], sort[sort.length-1]+1, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([11, 106, 18,0.90])));
            renderer.addBreak(sort[sort.length-1]+1, Infinity, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([5, 80, 15,0.90])));
            featureLayer.setRenderer(renderer);
            featureLayer.redraw();
            //Since an id of <div> can be only used once,
            //I dynamically generate the id so that I can update the legend
            var string = 'dynamicLegend'+ Math.random().toString(36).substring(7);
            $('#legendDiv').append('<div class="legendClass" id = "'+string+'"</div>');  
            var legend = new Legend({
              map: map,
              layerInfos: legendLayers
            }, string);            
            legend.startup();    
        }

        function getTextContent (graphic) {
          selectZone = graphic.attributes.TAZ_New;
          var speciesName = "<b>Value: </b><br/>" +
                          "<i>" + accessibilityResult[graphic.attributes.TAZ_New] + "</i>";
          return  speciesName;
        }
        //radio button listener
        //if the user press the radio button, this function will be called
        $('input:radio[name=selectLegend]').change(function() {
            if (this.value === 'relative') {
                relativeLegend = true;
            }
            else{
                relativeLegend = false;
            }
            if(check === true){
              largestIndividualArray = findRangeForIndividualCalcultion(jobType);
            }
            else{
              largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
            }
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        //travel method listener
        $("#travelMethod").change(function(){
            travelType = $(this).val();
            if(check === true){
              if(!relativeLegend){
                largestIndividualArray = findRangeForIndividualCalcultion(jobType);
              }
              accessibilityResult = individualCaculation(travelTypeDict[travelType],jobType,selectZone);
            }
            else{
              if(!relativeLegend){
                largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
              }
              accessibilityResult = accessibilityCalculation(travelTypeDict[travelType],jobType);
            }
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        //job type listener
        $('#jobType').change(function(){
          jobType = $(this).val();
          if(check === true){
            largestIndividualArray = findRangeForIndividualCalcultion(jobType);
            accessibilityResult = individualCaculation(travelTypeDict[travelType],jobType,selectZone);
          }
          else{
            largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
            accessibilityResult = accessibilityCalculation(travelTypeDict[travelType],jobType);
          }
          redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        //interation button listener
        $("#interact").click(function(e, parameters) {
            if($("#interact").is(':checked')){
                check = true;
                connections.push(dojo.connect(map, 'onClick', MouseClickhighlightGraphic));
                connections.push(dojo.connect(featureLayer, 'onMouseOver', MouseOverhighlightGraphic));
                largestIndividualArray = findRangeForIndividualCalcultion(jobType);
                accessibilityResult = individualCaculation(travelTypeDict[travelType],jobType,selectZone);
                redrawLayer(ClassBreaksRenderer,accessibilityResult);
            }
            else{
              check = false;
              dojo.forEach(connections,dojo.disconnect);
              largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
              accessibilityResult = accessibilityCalculation(travelTypeDict[travelType],jobType);
              redrawLayer(ClassBreaksRenderer,accessibilityResult);
            }
        });
        //show lat and lng on the left corner. Not an important feature
        function showCoordinates(evt) {
            //the map is in web mercator but display coordinates in geographic (lat, long)
            var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
            //display mouse coordinates
            dom.byId("info").innerHTML = mp.x.toFixed(3) + ", " + mp.y.toFixed(3);
          }

        //highlight the clicked zone
        var MouseClickhighlightGraphic = function(evt) {
            accessibilityResult = individualCaculation(travelTypeDict[travelType],jobType,selectZone);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        };
        //show text info for hovered zone
        var MouseOverhighlightGraphic = function(evt) {
          hoverZone = evt.graphic.attributes.TAZ_New;
          var access = accessibilityResult[hoverZone];
          map.infoWindow.setTitle("<b>Zone Number: </b>"+hoverZone);
          if(typeof(access)!=='undefined'){
            map.infoWindow.setContent("<b><font size=\"3\"> Value:</font> </b>"+ "<font size=\"4\">"+access.toFixed(2)+"</font>");
          }
          else{
            map.infoWindow.setContent("<b><font size=\"3\"> Value:</font> </b>"+ "<font size=\"4\">"+'undefined'+"</font>");
          }
          map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
      };
    });
}
//json converter for logsum matrices
function buildMatrixLookup(arr) {
  var lookup = {};
  var index = arr.columns;
  var verbal = index[0];
  for(var i =0; i<arr.length;i++){
    var k = arr[i][verbal];
    delete arr[i][verbal];
    lookup[parseInt(k)] = Object.keys(arr[i]).reduce((obj, key) => (obj[parseInt(key)] = Number(arr[i][key]),obj), {});
  }

  return lookup;
}
//json converter for employee and population csv file
function buildMatrixLookup2(arr) {
    var lookup = {};
    var zoneName = Object.keys(arr[0])[1];
    arr.forEach(row => {
        for(var k in row){
          row[k] = row[k].replace(',','');
          row[k] = row[k].replace('-','');
          row[k] = row[k].replace(' ','');
        }
        lookup[row[zoneName]]= row;
    });
    return lookup;
}
//do logsum of logsum calculation
//from one zone to any other zones
//the result will be a 1-d array
function accessibilityCalculation(transitMatrix,jobType){
    var accessibilityArray ={};
    for (var zone in transitMatrix){
        var result = 0;
        for(var destZone in transitMatrix[zone]){
            if(typeof(popEmp[destZone])!=='undefined'){
                var num = transitMatrix[zone][destZone];
                var enr = Number(popEmp[destZone][jobType]);
                if (Number(num)!==0 && isNaN(enr) === false){
                    result += enr/Math.pow(num,1.285);
                }
            }
        }
        accessibilityArray[zone] = result;
    }
    return accessibilityArray;
}
//do logsum of logsum calculation
//from one zone to another zone
//the result will be a matrix
function individualCaculation(transitMatrix,jobType,selectedZone){
    var accessibilityArray = {};
    var enr = parseFloat(popEmp[selectedZone][jobType]);
    for(var destZone in transitMatrix[selectedZone]){
      if(typeof(popEmp[selectedZone])!=='undefined'){
        var num = transitMatrix[destZone][selectedZone];
        if (Number(num)!==0 && isNaN(enr) === false){
            accessibilityArray[destZone] =  enr/Math.pow(num,1.285);
        }
      }  
    }
    return accessibilityArray;
}
//Find the range of the matrix when the user chooses to view zone-to-zone map
function findRangeForIndividualCalcultion(jobType){
  if(relativeLegend === true){
    var dict = {};
    var TAZ = 0;
    for(var k in popEmp){
            dict[popEmp[k]['New Zone']] = Number(popEmp[k][jobType]);
    }
    // Create items array
    var items = Object.keys(dict).map(function(key) {
      return [key, dict[key]];
    });
    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    });
    while(items[items.length-1][1] === 0){ // While the last element is a 0,
        items.pop();                  // Remove that last element
    }
    TAZ = items[parseInt(items.length/22)][0];
    var largestIndividualArray = individualCaculation(travelTypeDict.A_AM,jobType,TAZ);
    return largestIndividualArray;
  }
  else{
    var TAZ = 0;
    var max = 0;
    for(var k in popEmp){
        if(Number(popEmp[k][jobType])>max){
            TAZ = popEmp[k]['New Zone'];
            max = Number(popEmp[k][jobType]);
        }
    }
    var largestAccessibilityArray = individualCaculation(travelTypeDict[travelType],jobType,TAZ);
    return largestAccessibilityArray;
  }
}
//Find the range of accessibility when the user chooses to view a static zone-to-all map
function findRangeForAccessibilityCalculation(jobType){
    //relative legend, then it means relative to A_AM
  if(relativeLegend === true){
    return accessibilityCalculation(travelTypeDict.A_AM,jobType);
  }
  else{
    return accessibilityCalculation(travelTypeDict[travelType],jobType);
  }

}



