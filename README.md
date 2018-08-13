# Accessibility-Gravity Model
This is a Nodejs web application using Arcgis Javascript API. It can analyze the job/institution accessibilty by different travel methods.
## Set Up
#### From Github:
1. If you haven't downloaded Nodejs on your computer, you need to download it and add it into PATH.
2. Download this folder
3. Browse to the root of the folder
4. Open the terminal/cmd and go to the root of the App './jobAccessibility'. 
5. Type 'npm install'
6. Type 'npm intall express --save'
7. Type 'npm install http-errors --save'
8. Type 'npm install fs --save'
9. Put your csv data into './public/data' folder.

#### From Lab Computer I
1. Browse to the root of the folder
2. Open the terminal/cmd and go to the root of the App './jobAccessibility'. 
3. In the './public/data/' folder, all the data source is provided.

## Run
1. Use terminal/cmd to go to the root of the App './jobAccessibility'. 
2. Type 'npm start'
2. Browse 'http://localhost:3032' or http://162.106.202.155:3032/

## Use tips:

#### If you want to update the TravelZoneLayer shape file:
 1. The map layer is not stored in localhost. It is stored in the arcgis online server.
 2. In './public/javascript/test.js', you can find the current layer: 'https://services8.arcgis.com/FCQ1UtL7vfUUEwH7/arcgis/rest/services/newestTAZ/FeatureServer/0?token=8gOmRemAl8guD3WA_rfLwe50SgsEvaZzIcXIraH9xC3NQPCLraLwcHIkz3osWU-SHUdSKO1N6rCnWDF_CzWLFlFFUCeugETS44f409SsCtX9eC-HoX0dkXZj2vQD1SsboTGNgAzLDtG-BfIv0FnlWBNqq84hC5a6e7lj2Tt1oV8V0WxGiCE7rtaXgxZr18TZur-l_T6gWW2jDh1mt5q0mqty8vc133DvOtg5JhtGm8OTdn9rYtscRKu66B153RYB'. If you want to change it to another layer, you can create you own arcgis online account and upload the layer to the arcgis server. You need to replace the url into a new one. You can also ask Sandeep to access Yue Ma's arcgis account.
#### If you want to change the legend:
1. Open './public/test.js' file, search 'readerer.addBreak' to show that part of code.
2. Right now, the break points all are calculated based on data of zone[101]. It can adjust the legend to suit different dataset. If you want to change the break points, you could just manually change 'sort[chunkZone]' to some specific value. 
      For exampe:
      * renderer.addBreak(0, 70, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([255, 255, 255,0.90])));
      * renderer.addBreak(70, 150, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0,0.1]),1)).setColor(new Color([249, 238, 237,0.90])));
#### If you want to change the legend color:
1. Open './public/test.js' file, search 'readerer.addBreak' to show that part of code.
2. Change 'new Color([255, 255, 255,0.90])' to some other RGB color.
      
#### Woops, the App can't run after changing a new dataset:
 1. You need to restart the server from terminal/cmd (Rerun 'npm start').
