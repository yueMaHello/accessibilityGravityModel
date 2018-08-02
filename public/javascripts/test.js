var map;
var geoJsonLayer1;
var Distance_mf2 = '../data/Distance_mf2.csv';
var SOV_AUTO_Time_AM_Cr_mf1 = '../data/SOV_AUTO_Time_AM_Cr_mf1.csv';
var Transit_Total_Time_AM = '../data/Transit_Total_Time_AM.csv';
var Walk_Time_AM_Cr_mf486 = '../data/Walk_Time_AM_Cr_mf486.csv';
var POP_EMP_PSE_HS = '../data/2015_POP_EMP_PSE_HS.csv';
var travelType = 'A_AM';
var jobType = 'Total Employment';
var travelJson;
var popEmp;
var accessibilityResult;
var travelTypeDict = {};
var q = d3.queue();
var check = false;
var largestIndividualArray = [];
var largestAccessibilityArray = [];

var selectZone = '101'; //default
q.defer(d3.csv,Distance_mf2)
    .defer(d3.csv,SOV_AUTO_Time_AM_Cr_mf1)
    .defer(d3.csv,Transit_Total_Time_AM)
    .defer(d3.csv,Walk_Time_AM_Cr_mf486)
    .defer(d3.csv,POP_EMP_PSE_HS)
    .await(brushMap);
function brushMap(error,distance_mf2,sov_auto_time,transit_total_time,walk_time,pop_emp_pse_hs){
    travelTypeDict = {
      'A_AM':buildMatrixLookup(sov_auto_time),
      'D':buildMatrixLookup(distance_mf2),
      'T_AM':buildMatrixLookup(transit_total_time),
      'W_AM': buildMatrixLookup(walk_time)  
    };
    travelJson = travelTypeDict[travelType];//default
    popEmp = buildMatrixLookup2(pop_emp_pse_hs);
    require([
      "esri/geometry/Polyline",
      "esri/geometry/Extent",
      "dojo/dom-construct",
      "esri/tasks/query",
      "esri/dijit/Popup",
      "esri/dijit/PopupTemplate",
      "dojo/dom-class",
      "esri/dijit/BasemapToggle",
      "esri/dijit/Legend",
        "../externalJS/geojsonlayer.js",
        "esri/map", "esri/layers/FeatureLayer",
        "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol",
        "esri/renderers/ClassBreaksRenderer",
        "esri/Color", "dojo/dom-style", "dojo/domReady!"
    ], function(Polyline,
      Extent,domConstruct,
      Query,Popup, PopupTemplate,domClass,BasemapToggle,Legend,
        GeoJsonLayer,Map, FeatureLayer,
        InfoTemplate, SimpleFillSymbol,SimpleLineSymbol,
        ClassBreaksRenderer,
        Color, domStyle
    ) {
        var connections = [];
        
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
        
        var toggle = new BasemapToggle({
           map: map,
           basemap: "streets"
         }, "viewDiv");
         
         toggle.startup();
         
        var template = new InfoTemplate();
        template.setContent(getTextContent);
        largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
        accessibilityResult = accessibilityCalculation(travelJson,jobType);
        var featureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=zwpope-UYmNeuAwyc7QdyY3CtnSR3zD05XyI45tDO27Xza7jjV6mY12x-jU6leaGFEN1DTvH092WhWyC5LmwHxpaVePomdQhkPd86OblRRtzO-LAzKP4mtjKJNEpS4XMpCYydXMlXN24O7H1MxUT99Ay_ztPJDRRU5ZO_uKZf-3IJDEEPVPSPTTYloiTYMGiMrup6UeuP_h4fhCFYtnHD2rzjAj2vRvBDSc5j0gIPIoi9iqMsBlkYatgXsV-gLj0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
            infoTemplate: template
        });
        featureLayer.on('click',function(evt){
          
          var graphic = evt.graphic;
          selectZone = graphic.attributes.TAZ_New;
          
        })
    
        var legendLayers = [];
        legendLayers.push({ layer: featureLayer, title: 'Legend' });
        map.on('load',function(){
            map.addLayer(featureLayer);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });

        function redrawLayer(ClassBreaksRenderer,accessibilityResult){

            $('.legendClass').remove();

            // console.log(accessibilityResultArray)
            
            
            // var min = accessibilityResultArray.sort((prev, next) => prev - next)[0];
            // var max =accessibilityResultArray.sort((prev, next) => next - prev)[1];
            var sort = [];
            if(check === true){
              var largestIndividualResultArray = Object.values(largestIndividualArray);
              sort = largestIndividualResultArray.sort((prev,next)=>prev-next); //from smallest to largest
              
            }
            // else{
            // 
            //   var accessibilityResultArray = Object.values(accessibilityResult);
            //   sort = accessibilityResultArray.sort((prev,next)=>prev-next); //from smallest to largest
            // }
            else{
              var largestAccessibilityResultArray = Object.values(largestAccessibilityArray);
            
              sort = largestAccessibilityResultArray.sort((prev,next)=>prev-next); //from smallest to largest
            }

            var chunkZones = 74;        
            sort = sort.map(function (x) { 
              return parseInt(x, 10); 
            });  
            var symbol = new SimpleFillSymbol();
                        // get the features within the current extent from the feature layer
              
            var renderer = new ClassBreaksRenderer(symbol, function(feature){
          
              var r = accessibilityResult[feature.attributes.TAZ_New];
  
              return accessibilityResult[feature.attributes.TAZ_New];
            });
            // renderer.addBreak(-Infinity,0, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([153, 153, 153,0.90])));
            renderer.addBreak(0, sort[chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
            renderer.addBreak(sort[chunkZones], sort[2*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([	249, 238, 237,0.90])));
            renderer.addBreak(sort[2*chunkZones], sort[3*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([243, 224, 219,0.90])));
            renderer.addBreak(sort[3*chunkZones], sort[4*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([237, 214, 202,0.90])));
            renderer.addBreak( sort[4*chunkZones], sort[5*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([225, 200, 170,0.90])));
            renderer.addBreak( sort[5*chunkZones],  sort[6*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([213, 196, 141,0.90])));
            renderer.addBreak( sort[6*chunkZones],  sort[7*chunkZones], new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([207, 197, 127,0.90])));
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
            
            var string = 'dynamicLegend'+ Math.random().toString(36).substring(7);
            $('#legendDiv').append('<div class="legendClass" id = "'+string+'"</div>');  
            var legend = new Legend({
              map: map,
              layerInfos: legendLayers
            }, string);
            legend.startup();
            
        }
        function pointToExtent (map, point, toleranceInPixel) {
          var pixelWidth = map.extent.getWidth() / map.width;
          var toleranceInMapCoords = toleranceInPixel * pixelWidth;
          return new Extent(point.x - toleranceInMapCoords,
                            point.y - toleranceInMapCoords,
                            point.x + toleranceInMapCoords,
                            point.y + toleranceInMapCoords,
                            map.spatialReference);
        }
        function getTextContent (graphic) {
          var speciesName = "<b>Value: </b><br/>" +
                          "<i>" + accessibilityResult[graphic.attributes.TAZ_New] + "</i>";
          return  speciesName;
        }

        $("#travelMethod").change(function(){
            travelJson = travelTypeDict[$(this).val()];
    
            if(check === true){
              largestIndividualArray = findRangeForIndividualCalcultion(travelJson,jobType);
              accessibilityResult = individualCaculation(travelJson,jobType,selectZone);

            }
            else{
              accessibilityResult = accessibilityCalculation(travelJson,jobType);
            }
            redrawLayer(ClassBreaksRenderer,accessibilityResult);

        });
        $('#jobType').change(function(){
          jobType = $(this).val();
          if(check === true){
            largestIndividualArray = findRangeForIndividualCalcultion(travelJson,jobType);
            accessibilityResult = individualCaculation(travelJson,jobType,selectZone);

          }
          else{
            largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
            accessibilityResult = accessibilityCalculation(travelJson,jobType);
          }
          redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        $("#interact").click(function(e, parameters) {
            
            if($("#interact").is(':checked')){
                check = true;
                connections.push(dojo.connect(map.getLayer(map.graphicsLayerIds[0]), 'onClick', MouseClickhighlightGraphic));
                connections.push(dojo.connect(map.getLayer(map.graphicsLayerIds[0]), 'onMouseOver', MouseOverhighlightGraphic));
                largestIndividualArray = findRangeForIndividualCalcultion(travelJson,jobType);
                accessibilityResult = individualCaculation(travelJson,jobType,selectZone);
                redrawLayer(ClassBreaksRenderer,accessibilityResult);

            }
            else{
              check = false;
              dojo.forEach(connections,dojo.disconnect);
              accessibilityResult = accessibilityCalculation(travelJson,jobType);
              redrawLayer(ClassBreaksRenderer,accessibilityResult);
            }
        });
        
        var MouseClickhighlightGraphic = function(evt) {
            var graphic = evt.graphic;
            selectZone = graphic.attributes.TAZ_New;
            accessibilityResult = individualCaculation(travelJson,jobType,selectZone);
            var query = new Query();
            query.geometry = pointToExtent(map, event.mapPoint, 10);
            var deferred = featureLayer.selectFeatures(query,
              FeatureLayer.SELECTION_NEW);
            map.infoWindow.setFeatures([deferred]);
            map.infoWindow.show(event.mapPoint);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        };
        
        var MouseOverhighlightGraphic = function(evt) {
          var graphic = evt.graphic;
          hoverZone = graphic.attributes.TAZ_New;
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

function buildMatrixLookup(arr) {
    var lookup = {};
    var indexCol = Object.keys(arr[0]).filter(k => k.match(/\s+/) !== null);
    arr.forEach(row => {
        var idx = row[indexCol];
        delete row[indexCol];
        var newRow = {};
        for(var key in row){
            newRow[key] = parseFloat(row[key]);
        }


        lookup[idx] = newRow;
    });
    return lookup;
}

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
function individualCaculation(transitMatrix,jobType,selectedZone){
    var accessibilityArray = {};
    var enr = parseFloat(popEmp[selectedZone][jobType]);
    for(var destZone in transitMatrix[selectedZone]){
      if(typeof(popEmp[selectedZone])!=='undefined'){
        var num = transitMatrix[selectedZone][destZone];
        if (Number(num)!==0 && isNaN(enr) === false){
            accessibilityArray[destZone] =  enr/Math.pow(num,1.285);
        }
      }  
    }
    return accessibilityArray;
}
function findRangeForIndividualCalcultion(transitMatrix,jobType){

  var TAZ = 0;
  var max = 0;
  for(var k in popEmp){
      if(Number(popEmp[k][jobType])>max){
          TAZ = popEmp[k]['New Zone'];
          max = Number(popEmp[k][jobType]);
      }
  }
  var largestIndividualArray = individualCaculation(transitMatrix,jobType,TAZ);
  return largestIndividualArray;
}
function findRangeForAccessibilityCalculation(jobType){
  var largestAccessibilityArray = accessibilityCalculation(travelTypeDict.A_AM,jobType);
  return largestAccessibilityArray;
}
