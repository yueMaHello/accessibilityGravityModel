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
    ], function(
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

        domClass.add(popup.domNode, "myTheme");

        map = new Map("map", {
            basemap: "dark-gray-vector",
            center: [-113.4909, 53.5444],
            zoom: 9,
            minZoom:6,
               infoWindow: popup,
            slider: false
        });
        map.setInfoWindowOnClick(true);
        
        map.on("click", function (event) {
          var query = new Query();
          query.geometry = pointToExtent(map, event.mapPoint, 10);
          var deferred = featureLayer.selectFeatures(query,
            FeatureLayer.SELECTION_NEW);
          map.infoWindow.setFeatures([deferred]);
          map.infoWindow.show(event.mapPoint);
        });

        var toggle = new BasemapToggle({
           map: map,
           basemap: "topo"
         }, "viewDiv");
         
         toggle.startup();
         
        var template = new InfoTemplate();
        template.setContent(getTextContent);
        accessibilityResult = accessibilityCalculation(travelJson,jobType);
        var featureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=zwpope-UYmNeuAwyc7QdyY3CtnSR3zD05XyI45tDO27Xza7jjV6mY12x-jU6leaGFEN1DTvH092WhWyC5LmwHxpaVePomdQhkPd86OblRRtzO-LAzKP4mtjKJNEpS4XMpCYydXMlXN24O7H1MxUT99Ay_ztPJDRRU5ZO_uKZf-3IJDEEPVPSPTTYloiTYMGiMrup6UeuP_h4fhCFYtnHD2rzjAj2vRvBDSc5j0gIPIoi9iqMsBlkYatgXsV-gLj0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
            infoTemplate: template
        });
        var legendLayers = [];
        legendLayers.push({ layer: featureLayer, title: 'Edmonton Layer' });
        map.on('load',function(){
            map.addLayer(featureLayer);

            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });

        function redrawLayer(ClassBreaksRenderer,accessibilityResult){

            $('.legendClass').remove();
            var accessibilityResultArray = Object.values(accessibilityResult);
            var min = accessibilityResultArray.sort((prev, next) => prev - next)[0];
            var max =accessibilityResultArray.sort((prev, next) => next - prev)[1];
            var chunk = 8;
            var chunksize =(max-min)/chunk;
            var symbol = new SimpleFillSymbol();

            var renderer = new ClassBreaksRenderer(symbol, function(feature){
                return accessibilityResult[feature.attributes.TAZ_New];
            });

            renderer.addBreak(0, chunksize, new SimpleFillSymbol().setColor(new Color([237,248,251, 1.0])));
            renderer.addBreak(chunksize, 2*chunksize, new SimpleFillSymbol().setColor(new Color([237,248,251, 1.0])));
            renderer.addBreak(2*chunksize, 3*chunksize, new SimpleFillSymbol().setColor(new Color([204,236,230,1.0])));
            renderer.addBreak(3*chunksize, 4*chunksize, new SimpleFillSymbol().setColor(new Color([153,216,201, 1.0])));
            renderer.addBreak(4*chunksize, 5*chunksize, new SimpleFillSymbol().setColor(new Color([102,194,164, 1.0])));
            renderer.addBreak(5*chunksize, 6*chunksize, new SimpleFillSymbol().setColor(new Color([65,174,118, 1.0])));
            renderer.addBreak(6*chunksize, 7*chunksize, new SimpleFillSymbol().setColor(new Color([35,139,69, 1.0])));
            renderer.addBreak(7*chunksize, Infinity, new SimpleFillSymbol().setColor(new Color([0,88,36, 1.0])));
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
            accessibilityResult = accessibilityCalculation(travelJson,jobType);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        $('#jobType').change(function(){
          jobType = $(this).val();
          accessibilityResult = accessibilityCalculation(travelJson,jobType);
          redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        $("#interact").click(function(e, parameters) {
            
            if($("#interact").is(':checked')){
                connections.push(dojo.connect(map.getLayer(map.graphicsLayerIds[0]), 'onClick', MouseClickhighlightGraphic));
                connections.push(dojo.connect(map.getLayer(map.graphicsLayerIds[0]), 'onMouseOver', MouseOverhighlightGraphic));

            }
            else{
              dojo.forEach(connections,dojo.disconnect);
              accessibilityResult = accessibilityCalculation(travelJson,jobType);
              redrawLayer(ClassBreaksRenderer,accessibilityResult);
            }
        });
        
        var MouseClickhighlightGraphic = function(evt) {
            var graphic = evt.graphic;
            selectZone = graphic.attributes.TAZ_New;
            accessibilityResult = individualCaculation(travelJson,jobType,selectZone);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        };
        
        var MouseOverhighlightGraphic = function(evt) {
          var graphic = evt.graphic;
          hoverZone = graphic.attributes.TAZ_New;
          var access = accessibilityResult[hoverZone];


          //console.log(graphic._graphicsLayer);
          // assuming the graphic has a SimpleLineSymbol...
          //symbol.setColor("red");
          //graphic.setSymbol(symbol);

          map.infoWindow.setTitle("<b>Zone Number: </b>"+hoverZone);
          map.infoWindow.setContent("<b><font size=\"3\"> Value:</font> </b>"+ "<font size=\"4\">"+access.toFixed(2)+"</font>");
          map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));

          // var highlightSymbol = new SimpleFillSymbol(
          //     SimpleFillSymbol.STYLE_SOLID,
          //     new SimpleLineSymbol(
          //         SimpleLineSymbol.STYLE_SOLID,
          //         new Color([255,0,0,0.5]), 3
          //     ),
          //     new Color([255,0,0,0.5])
          // );
          // var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
          // map.graphics.add(highlightGraphic)
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
    for(var destZone in transitMatrix[selectedZone]){
      if(typeof(popEmp[destZone])!=='undefined'){
        var num = transitMatrix[selectZone][destZone];
        var enr = Number(popEmp[selectZone][jobType]);
        if (Number(num)!==0 && isNaN(enr) === false){
            accessibilityArray[destZone] =  enr/Math.pow(num,1.285);
        }
      }  
    }
    return accessibilityArray;
  
  
}
