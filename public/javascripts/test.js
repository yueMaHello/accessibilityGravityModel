var map;
var geoJsonLayer1;
var Distance_mf2 = '../data/Distance_mf2.csv';
var SOV_AUTO_Time_AM_Cr_mf1 = '../data/SOV_AUTO_Time_AM_Cr_mf1.csv';
// var Transit_1wait_Time_AM_Cr_mf1 = '../data/Transit_1wait_Time_AM_Cr_mf488.csv';
// var Transit_IVT_Time_AM_Cr_mf492 = '../data/Transit_IVT_Time_AM_Cr_mf492.csv';
// var Transit_RemWait_Time_AM_Cr_mf489 = '../data/Transit_RemWait_Time_AM_Cr_mf489.csv';
// var Transit_Transfer_Time_AM_Cr_mf490 = '../data/Transit_Transfer_Time_AM_Cr_mf490.csv';
// var Transit_Walk_Time_AM_Cr_mf491 = '../data/Transit_Walk_Time_AM_Cr_mf491.csv';
var Transit_Total_Time_AM = '../data/Transit_Total_Time_AM.csv';
var Walk_Time_AM_Cr_mf486 = '../data/Walk_Time_AM_Cr_mf486.csv';
var POP_EMP_PSE_HS = '../data/2015_POP_EMP_PSE_HS.csv';

var travelType = 'A_AM';
var jobType = 'Total Employment';
var travelJson;
var popEmp;
var accessibilityResult;

var q = d3.queue();
q.defer(d3.csv,Distance_mf2)
    .defer(d3.csv,SOV_AUTO_Time_AM_Cr_mf1)
    .defer(d3.csv,Transit_Total_Time_AM)
    .defer(d3.csv,Walk_Time_AM_Cr_mf486)
    .defer(d3.csv,POP_EMP_PSE_HS)
    .await(brushMap);
function brushMap(error,distance_mf2,sov_auto_time,transit_total_time,walk_time,pop_emp_pse_hs){

    var distanceJson = buildMatrixLookup(distance_mf2);
    var autoJson = buildMatrixLookup(sov_auto_time);
    var transitJson = buildMatrixLookup(transit_total_time);
    var walkJson = buildMatrixLookup(walk_time);
    travelJson = autoJson;
    popEmp = buildMatrixLookup2(pop_emp_pse_hs);
    require([
      
      "esri/dijit/Legend",
        "../externalJS/geojsonlayer.js",
        "esri/map", "esri/layers/FeatureLayer",
        "esri/InfoTemplate", "esri/symbols/SimpleFillSymbol",
        "esri/renderers/ClassBreaksRenderer",
        "esri/Color", "dojo/dom-style", "dojo/domReady!"
    ], function(
      Legend,
        GeoJsonLayer,Map, FeatureLayer,
        InfoTemplate, SimpleFillSymbol,
        ClassBreaksRenderer,
        Color, domStyle
    ) {


        map = new Map("map", {
            basemap: "streets",
            center: [-113.215, 53.382],
            zoom: 7,
            slider: false
        });
        accessibilityResult = accessibilityCalculation(autoJson,jobType);
        var featureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=zwpope-UYmNeuAwyc7QdyY3CtnSR3zD05XyI45tDO27Xza7jjV6mY12x-jU6leaGFEN1DTvH092WhWyC5LmwHxpaVePomdQhkPd86OblRRtzO-LAzKP4mtjKJNEpS4XMpCYydXMlXN24O7H1MxUT99Ay_ztPJDRRU5ZO_uKZf-3IJDEEPVPSPTTYloiTYMGiMrup6UeuP_h4fhCFYtnHD2rzjAj2vRvBDSc5j0gIPIoi9iqMsBlkYatgXsV-gLj0",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"]
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
            var max =accessibilityResultArray.sort((prev, next) => next - prev)[0];
            var chunk = 8;
            var chunksize =(max-min)/chunk;
            
            
          
            var symbol = new SimpleFillSymbol();

            var renderer = new ClassBreaksRenderer(symbol, function(feature){
                return accessibilityResult[feature.attributes["TAZ_New"]]
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

        $("#travelMethod").change(function(){
            if($(this).val() ==='A_AM'){
              travelJson = autoJson;

            }
            else if($(this).val() ==='T_AM'){
              travelJson = transitJson;
      
            }
            else if($(this).val() ==='W_AM'){
              travelJson = walkJson;

            }
            else if($(this).val() ==='D'){
              travelJson = distanceJson
    
            }
            accessibilityResult = accessibilityCalculation(travelJson,jobType);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
        $('#jobType').change(function(){
          jobType = $(this).val();
          accessibilityResult = accessibilityCalculation(travelJson,jobType)
          redrawLayer(ClassBreaksRenderer,accessibilityResult);
        })
    });


}

function buildMatrixLookup(arr) {
    var lookup = {};
    var indexCol = Object.keys(arr[0]).filter(k => k.match(/\s+/) !== null);
    arr.forEach(row => {
        let idx = row[indexCol];
        delete row[indexCol];
        var newRow = {};
        for(var key in row){
            newRow[key] = parseFloat(row[key])
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
