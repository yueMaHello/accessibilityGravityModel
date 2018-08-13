var map;
var Distance_mf2 = '../data/Distance_mf2.csv';
var SOV_AUTO_Time_AM_Cr_mf1 = '../data/SOV_AUTO_Time_AM_Cr_mf1.csv';
var Transit_Total_Time_AM = '../data/Transit_Total_Time_AM.csv';
var Walk_Time_AM_Cr_mf486 = '../data/Walk_Time_AM_Cr_mf486.csv';
var POP_EMP_PSE_HS = '../data/2015_POP_EMP_PSE_HS.csv';
var travelType = 'A_AM';
var jobType = 'Total Employment';
var popEmp;
var accessibilityResult;
var travelTypeDict = {};
var q = d3.queue();
var check = false;
var largestIndividualArray = [];
var largestAccessibilityArray = [];
var relativeLegend = true;
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
    popEmp = buildMatrixLookup2(pop_emp_pse_hs);
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
        var viewSpatialReference = new SpatialReference({wkid: 4326});
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
        
        
        var toggle = new BasemapToggle({
           map: map,
           basemap: "streets"
         }, "viewDiv");
         
        toggle.startup();
         
        var template = new InfoTemplate();
        template.setContent(getTextContent);
        largestAccessibilityArray = findRangeForAccessibilityCalculation(jobType);
        accessibilityResult = accessibilityCalculation(travelTypeDict[travelType],jobType);
        var featureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=8gOmRemAl8guD3WA_rfLwe50SgsEvaZzIcXIraH9xC3NQPCLraLwcHIkz3osWU-SHUdSKO1N6rCnWDF_CzWLFlFFUCeugETS44f409SsCtX9eC-HoX0dkXZj2vQD1SsboTGNgAzLDtG-BfIv0FnlWBNqq84hC5a6e7lj2Tt1oV8V0WxGiCE7rtaXgxZr18TZur-l_T6gWW2jDh1mt5q0mqty8vc133DvOtg5JhtGm8OTdn9rYtscRKu66B153RYB",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
            infoTemplate: template
        });
        var lrtFeatureLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/LRT/FeatureServer/0?token=8ulK33e1cubPoKiLq5MxH9EpaN_wuyYRrMTiwsYkGKnPgYFbII8tkvV5i9Dk6tz2jVqY-_Zx-0-GXY3DeSVbtpo0NlLxEjFuPwpccMNBTGZwZsVYNrqBui-6DhEyve8rnD3qGPg_2pun9hFotDWSmlWAQn41B_Sop7pr9KLSS64H_CiMRPW0GZ9Bn6gPWkR8d0CZQ6fUoctmBUJp4gvRdf6vroPETCE9zJ2OFUdPto1Xm2pxvDc7Y5mDPT_ZOXbi",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
        });
        
        // PSELayer = addPSELocation();
        var pseLayer = new FeatureLayer("https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/pse/FeatureServer/0?token=Z-SDaJDXBiNKlWI9q05NjRiKcjoysekbM2vYNhYD6gETiJzS7IggUYgO3fQ8yua2FMceup7wEsz440QpyduUiuu-OoAUMsjIOaqgrhjAU3oqoorIKY6HsM1-jpLgNPof-YrNhlTq04cJs9Soi0RqIjr3gCtuCaR74_0mLSjVN42R2okTrgOl7pr7thQEdveBKh6zNGgmrYMJiGtGA6dLwUgpJC59-9RL63-SoxDZdLDiwygEyy3wMP_lKcCbOPPU",{
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
      
        });
        featureLayer.on('click',function(evt){
          var graphic = evt.graphic;
          selectZone = graphic.attributes.TAZ_New;
          
        });
    
        var legendLayers = [];
        map.on('load',function(){
            map.on("mouse-move", showCoordinates);
            
            map.addLayer(featureLayer);
            map.addLayer(lrtFeatureLayer);
            map.addLayer(pseLayer)
            legendLayers.push({layer:pseLayer,title:'Institutions'},{layer:lrtFeatureLayer,title:'LRT'},{ layer: featureLayer, title: 'Legend' });
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        });
  
        // 
        // function addPSELocation(){
        //   var squareSymbol = new SimpleMarkerSymbol({
        //       "color":[0,0,128,128],
        //       "size":10,
        //       "angle":0,
        //       "xoffset":0,
        //       "yoffset":0,
        //       "type":"esriSMS",
        //       "style":"esriSMSCircle",
        //       "outline":{"color":[0,0,128,255],
        //           "width":1,
        //           "type":"esriSLS",
        //           "style":"esriSLSSolid"
        //       }
        //   });
        //   var layer = new GraphicsLayer();
        //   var PSEpoints = [[-113.525,53.528],[-113.413,53.524],[-113.451,53.531],[-113.505,53.568],[-113.506,53.547],[-113.587,53.54],[-113.632,53.640],[-113.508,53.540]];
        //   arrayUtils.forEach(PSEpoints, function(point) {
        //      var graphic = new Graphic(new Point(point),squareSymbol);
        //      layer.add(graphic);
        //   });
        //   return layer;
        // }
        
        function redrawLayer(ClassBreaksRenderer,accessibilityResult){
            $('.legendClass').remove();
            var sort = [];
            if(check === true){
              var largestIndividualResultArray = Object.values(largestIndividualArray);
              sort = largestIndividualResultArray.sort((prev,next)=>prev-next); //from smallest to largest
              
            }
            else{
              var largestAccessibilityResultArray = Object.values(largestAccessibilityArray);          
              sort = largestAccessibilityResultArray.sort((prev,next)=>prev-next); //from smallest to largest
            }

            var chunkZones = 74;        
            sort = sort.map(function (x) { 
              return parseInt(x, 10); 
            });  
            var symbol = new SimpleFillSymbol();

            var renderer = new ClassBreaksRenderer(symbol, function(feature){
              var r = accessibilityResult[feature.attributes.TAZ_New];
              return accessibilityResult[feature.attributes.TAZ_New];
            });
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
        function showCoordinates(evt) {
            //the map is in web mercator but display coordinates in geographic (lat, long)
            var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
            //display mouse coordinates
            dom.byId("info").innerHTML = mp.x.toFixed(3) + ", " + mp.y.toFixed(3);
          }
        var MouseClickhighlightGraphic = function(evt) {
            accessibilityResult = individualCaculation(travelTypeDict[travelType],jobType,selectZone);
            redrawLayer(ClassBreaksRenderer,accessibilityResult);
        };
        
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
        var num = transitMatrix[destZone][selectedZone];
        if (Number(num)!==0 && isNaN(enr) === false){
            accessibilityArray[destZone] =  enr/Math.pow(num,1.285);
        }
      }  
    }
    return accessibilityArray;
}
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

function findRangeForAccessibilityCalculation(jobType){
  if(relativeLegend === true){
    return accessibilityCalculation(travelTypeDict.A_AM,jobType);
  }
  else{
    return accessibilityCalculation(travelTypeDict[travelType],jobType);
  }

}
