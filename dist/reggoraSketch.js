import { fabric } from "fabric";
import $ from "jquery";
import polylabel from 'polylabel';

export default class ReggoraSketch {
    constructor(canvasId, nameForRef, sizeX, sizeY) {
        this.completeFloorEvent = new Event('floor');
        this.mode = "drawstart";
        this.currentShape = null;
        this._this = this;
        this.currentCurve = "";
        this.currentCurveGroup = null;
        this.originalCurveY = null;
        this.originalCurveX = null;

        this.originalCurveX1 = null;
        this.originalCurveX2 = null;
        this.originalCurveY1 = null;
        this.originalCurveY2 = null;

        this.gridLineX = null;
        this.gridLineY = null;

        this.onGridLineX = null;
        this.onGridLineY = null;

        this.globalcurveControl = null;
        this.globalL;
        this.globalM;
        this.isDirty = false;
        this.serial = nameForRef
        this.globmousePos = null;
        this.drawNumberKey = null;
        this.drawNumberInches = null;
        this.drawInches = null;

        this.drawArrowKey = null;
        this.hotkeyDrawUsed = false;
        this.lastHotkeyX = null;
        this.lastHotkeyY = null;

        this.MouseoffsetX = null;
        this.MouseoffsetY = null;

        this.correctedMouseX = null;
        this.correctedMouseY = null;

        this._clipboard = null;

        this.mainCursor = null;

        this.activeGroup = null;

        this.angleMeasurements = null;
        this.angleText = null;

        //Intersecting Point
        this.intersectingWall = null;

        //Continuing Point
        this.continuingControl = null;
        this.continuingCircle = null;

        this.lastCreateArea = null;

        this._curX, this._curY;
        this.canvas = null;
        this.panning = false;

        this.createdFloor = false;
        this.viewBeforePreview = null;

        this.canvasMousePosX = null;
        this.canvasMousePosY = null;
        this.canvasMousePosXDelta = null;
        this.canvasMousePosYDelta = null;

        this.singleLineSelect = null;


        this.objectTypes = {
            door: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Architectural_plan%2C_door1.svg/120px-Architectural_plan%2C_door1.svg.png",
            window: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Gray_Rectangle_Tiny.svg/768px-Gray_Rectangle_Tiny.svg.png",
            stairs: "https://s3.us-east-2.amazonaws.com/reggora-sketch/straight_stairs.png",
        };

        this.objectSizes = {
            door: 1,
            stairs: 1.9,
            window: 0.09
        };

        this.init(canvasId, sizeX, sizeY);
    }

    moveToPoint(x, y, objXs, objYs){

        var Xmax = Math.max(...objXs);
        var Ymax = Math.max(...objYs);

        var Xmin = Math.min(...objXs);
        var Ymin = Math.min(...objYs);

        var tarViewHeight = Math.abs(Ymax - Ymin);
        var tarViewWidth = Math.abs(Xmax - Xmin);

        var currViewWidth = Math.abs(this._this.canvas.vptCoords.bl.x-this._this.canvas.vptCoords.br.x);
        var currViewHeight = Math.abs(this._this.canvas.vptCoords.bl.y-this._this.canvas.vptCoords.tl.y);

        while(tarViewHeight >= currViewHeight){
          var currZoom = this._this.canvas.getZoom();
          this._this.canvas.setZoom(currZoom*0.9);
          currViewWidth = Math.abs(this._this.canvas.vptCoords.bl.x-this._this.canvas.vptCoords.br.x);
          currViewHeight = Math.abs(this._this.canvas.vptCoords.bl.y-this._this.canvas.vptCoords.tl.y);
        }
      

      
        while(tarViewWidth+100 >= currViewWidth){
          var currZoom = this._this.canvas.getZoom();
          this._this.canvas.setZoom(currZoom*0.9);
          currViewWidth = Math.abs(this._this.canvas.vptCoords.bl.x-this._this.canvas.vptCoords.br.x);
          currViewHeight = Math.abs(this._this.canvas.vptCoords.bl.y-this._this.canvas.vptCoords.tl.y);
        }
        

        var currentY = (this._this.canvas.vptCoords.bl.y+this._this.canvas.vptCoords.tl.y)/2;
        var currentX = (this._this.canvas.vptCoords.bl.x+this._this.canvas.vptCoords.br.x)/2;

        var currZoom = this._this.canvas.getZoom();

        if (y > currentY){
          this._this.canvas.relativePan({x:0,y:(-1*Math.abs(currentY - y))*currZoom});
        }
        else if (y < currentY){
          this._this.canvas.relativePan({x:0,y:Math.abs(currentY - y)*currZoom});
        }
        if (x < currentX){
          this._this.canvas.relativePan({x:Math.abs(x - currentX)*currZoom,y:0});
        }
        else if (x > currentY){
          this._this.canvas.relativePan({x:(-1*Math.abs((x - currentX)))*currZoom,y:0});
        }
      
    }

    moveToMiddle(isInital){
      var objXs = [];
      var objYs = [];
      
      for (var obj of this.canvas.getObjects('circle')){
        objXs.push(obj.left);
        objYs.push(obj.top);
      }

      const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

      this.moveToPoint(average(objXs), average(objYs), objXs, objYs);
        
    }



    hideGrid(){
      if (this.canvas.getObjects('circle').length > 0){
        var objects = this.canvas.getObjects('line');

        for (var line of objects){
          if (line.isGrid){
            line.visible = false;
          }
        }

        var currentY = (this._this.canvas.vptCoords.bl.y+this._this.canvas.vptCoords.tl.y)/2;
        var currentX = (this._this.canvas.vptCoords.bl.x+this._this.canvas.vptCoords.br.x)/2;

        this.viewBeforePreview = [currentX, currentY];

        this.moveToMiddle(true);

        this.mode = 'preview';
      }

      this.canvas.renderAll();
    }

    showGrid(){
      var objects = this.canvas.getObjects('line');

      for (var i = 0, len = objects.length; i < len; i++) {
        if (objects[i].isGrid){
          objects[i].visible = true;
        }
      }

      this.mode = "select";
      this.canvas.defaultCursor = 'pointer';
      this.mainCursor.visible = false;
      
      this.canvas.setZoom(1/3);
      
      var currentY = (this._this.canvas.vptCoords.bl.y+this._this.canvas.vptCoords.tl.y)/2;
      var currentX = (this._this.canvas.vptCoords.bl.x+this._this.canvas.vptCoords.br.x)/2;

      var currZoom = this._this.canvas.getZoom();

      if (this._this.viewBeforePreview[1] > currentY){
        this._this.canvas.relativePan({x:0,y:(-1*Math.abs(currentY - this._this.viewBeforePreview[1]))*currZoom});
      }
      else if (this._this.viewBeforePreview[1] < currentY){
        this._this.canvas.relativePan({x:0,y:Math.abs(currentY - this._this.viewBeforePreview[1])*currZoom});
      }
      if (this._this.viewBeforePreview[0] < currentX){
        this._this.canvas.relativePan({x:Math.abs(this._this.viewBeforePreview[0] - currentX)*currZoom,y:0});
      }
      else if (this._this.viewBeforePreview[0] > currentY){
        this._this.canvas.relativePan({x:(-1*Math.abs((this._this.viewBeforePreview[0] - currentX)))*currZoom,y:0});
      }
      
      this.canvas.renderAll();
    }

    createArea(areaOption, areaType) {

      this.lastCreateArea.areaType = areaType;

      if (areaOption == 'isGLA'){
        this.lastCreateArea.isGLA = true;
      }
      else{
        this.lastCreateArea.isGLA = false;
        for (var wall of this.lastCreateArea._objects){
          wall.strokeDashArray = [10, 10];
        }
      }


      this.createPolyFloor(this.lastCreateArea);



      this.canvas.renderAll();
    }

    getRoomsAndMeasurements() {
      var floors = this.canvas.getObjects('polygon');
      var returnFloors = [];

      for (var floor of floors){
        returnFloors.push({floor:floor.wallGroup.areaType, area:floor.wallGroup.polyArea, gla:floor.wallGroup.isGLA});
      }
      return returnFloors;
    }

    //Editing Functions
    drawWalls() {
        this.mode = "drawstart";
        this.canvas.defaultCursor = 'none';
        //this.deselectAll();
        this.canvas.discardActiveObject();
        this.canvas.selection = false;
    }

    curveMode() {
        this.mode = "curve";
        //this.deselectAll();
        this.canvas.discardActiveObject();
        this.canvas.selection = false;
    }

    deleteMode() {
        this.mode = "delete";
    }

    renameObjects(oldObject){
      if('left' in oldObject){
        console.log('Starting convert');
        if (!('dataid' in oldObject)){
          var newSaveId = this.makeid();
          oldObject.dataid = newSaveId;
          return newSaveId;
        }else{
          return oldObject['dataid'];
        }
      }
    }

    isObject(o) {
      return Object.prototype.toString.call(o) === "[object Object]";
    }

    reverseObjectDependencies(isStillLoaded){

      var object = null, objects = this.canvas.getObjects();
      var fixList = ['linesX1','linesX2','floor','areaText', 'editControlsX1', 'editControlsX2'];

      var repairGroups = {};

      for (var i = 0, len = objects.length; i < len; i++) {
          for (var property in objects[i]) {
              if (!isStillLoaded)
              {
                if (property == 'groupid'){
                  if (objects[i][property] in repairGroups){
                    repairGroups[objects[i][property]].push(objects[i]);
                  }else{
                    repairGroups[objects[i][property]] = [objects[i]];
                  }
                }
                if (property == 'isPen'){
                  this.canvas.remove(objects[i]);
                  break;
                }
              }

              //Is Object ref
              if (fixList.includes(property)){

                //Is array of obj ref
                if (Array.isArray(objects[i][property])){
                  
                  //iterate over them
                  var objIndex = 0;
                  for (var oldObj of objects[i][property]){
                    if (Object.prototype.toString.call(oldObj) == '[object String]'){
                      if (oldObj.length == 5){
                        var foundObj = this.getObjByDataid(oldObj);
                        if (foundObj != null){
                          objects[i][property][objIndex] = foundObj;
                        }
                      }
                    }
                    objIndex++;
                  }
                }

                if (Object.prototype.toString.call(objects[i][property]) == '[object String]'){
                  if (objects[i][property].length == 5){
                    var foundObj = this.getObjByDataid(objects[i][property]);
                    if (foundObj != null){
                      objects[i][property] = foundObj;
                    }
                  }
                   
                }
            }        
         }
      }

      //Build groups
      //loop through groups
      if (!isStillLoaded){

        var canvasobj = this.canvas.getObjects();
        for (var i = 0, len = objects.length; i < len; i++) {
          if(objects[i].type == 'line'){
            
          }else{
            objects[i].set({x1:objects[i].x1, x2:objects[i].x2, top:objects[i].top, left:objects[i].left});
            objects[i].setCoords();
          }
          
        }

        for (var oldGroup in repairGroups){
          //loop thru objs
          
          //this.canvas._activeGroup = fixedGroup;
          var objsToAdd = [];
          var floorToAdd = null;
          var areaTypeText = '';
          var areaMeasurement = 0;
          for (var groupobj of repairGroups[oldGroup]){
            //console.log(groupobj);
            if(groupobj.type=='polygon'){
              floorToAdd = groupobj;
              delete groupobj["groupid"];
            }else if (groupobj.type=='line'){
              objsToAdd.push(groupobj);
              delete groupobj["groupid"];
            }
            else if (groupobj.type=='group'){
              if (groupobj.areaType != null && groupobj.areaType != ''){
                areaTypeText = groupobj.areaType;
                areaMeasurement = groupobj.polyArea;
              }
            }
          }

          var fixedGroup = new fabric.Group(objsToAdd);
          if (floorToAdd != null){
            floorToAdd.wallGroup = fixedGroup;
            fixedGroup.floor = [floorToAdd];
            fixedGroup.areaType = areaTypeText;
            fixedGroup.polyArea = areaMeasurement;
          }

          for (var fixedGroupObj of fixedGroup._objects){
            if (fixedGroupObj.type == 'line'){
              fixedGroupObj.wallGroup = fixedGroup;
            }
          }

        }
        this.canvas.renderAll();

        var canvasobj = this.canvas.getObjects();
        for (var i = 0, len = objects.length; i < len; i++) {
          if(objects[i].type == 'line'){
            if ('editControlsX1' in objects[i]){      
              var posX = this.getObjByName(objects[i].editControlsX1[0]);
              var posX2 = this.getObjByName(objects[i].editControlsX2[0]);

              posX = posX != null ? posX : objects[i];
              posX2 = posX2 != null ? posX2 : objects[i];

              var midmax = Math.max(...[posX.left,posX2.left])
              var minmax = Math.min(...[posX.left,posX2.left])

              objects[i].set({x1:posX.left, x2:posX2.left, y1:posX.top, y2:posX2.top, left:((midmax-minmax)/2)+minmax});
              objects[i].setCoords();
            }
          }
        }
      }
      this.canvas.renderAll();
    }

    fixObjectDependencies(){
      var object = null,
          objects = this.canvas.getObjects();
      var fixList = ['linesX1','linesX2','floor','areaText', 'editControlsX1','type','left', "editControlsX2"];

      for (var i = 0, len = objects.length; i < len; i++) {
          for (var property in objects[i]) {

              if (property == 'wallGroup'){
                var groupId = null;

                if (!('groupid' in objects[i]['wallGroup'])){
                    groupId = this.makeid();
                    objects[i]['wallGroup']['groupid'] = groupId;
                }else{
                  groupId = objects[i]['wallGroup']['groupid'];
                }

                if(objects[i].type == 'polygon'){
                  objects[i].groupid = groupId;
                }

                for (var groupObj of objects[i]['wallGroup']._objects){
                  if (!('groupid' in groupObj)){
                    groupObj.groupid = groupId;
                  }
                }
              }

              //Is Object ref
              if (fixList.includes(property)){

                //Is array of obj ref
                if (Array.isArray(objects[i][property])){
                  
                  //iterate over them
                  var objIndex = 0;
                  for (var oldObj of objects[i][property]){
                    
                    if (this.isObject(oldObj) && oldObj != null){

                      var needsConvert = false;
                      for (var otherProperty in oldObj){
                        if(fixList.includes(otherProperty)) {
                          needsConvert = true;
                        }
                      }

                      if (needsConvert){
                        var newSaveId = this.renameObjects(oldObj);
                        objects[i][property][objIndex] = newSaveId;
                      }
                    }

                    objIndex++;
                  }
                }

                if (this.isObject(objects[i][property]) && objects[i][property] != null){
                   //console.log('Needs convert 1');
                   var newSaveId = this.renameObjects(objects[i][property]);
                   objects[i][property] = newSaveId;
                   //console.log('Finished 1',objects[i])
                }
            }
              


              
          }
      }
    }

    saveCanvas() {
        //this.deselectAll();
        this.isDirty = false;

        this.fixObjectDependencies();

        var canvasjson = JSON.stringify(
            this.canvas.toJSON([
                "measurementText",
                "selectable",
                "hasControls",
                "hasBorders",
                "line1",
                "line",
                "wall",
                "curveControl",
                "controlType",
                "name",
                "curvePoint",
                "top",
                "left",
                "x1",
                "x2",
                "y1",
                "y2",
                "crossOrigin",
                "linesX1",
                "linesX2",
                "floor",
                "editControlsX1",
                "editControlsX2",
                "areaText",
                "dataid",
                "groupid",
                "selectable",
                "evented",
                "isPen",
                "isGrid",
                "isMeasurement",
                "wallGroup",
                "areaType",
                "isGLA",
                "polyArea",

            ])
        );
        //console.log(canvasjson);
        //localStorage[this.serial] = canvasjson;
        this.reverseObjectDependencies(true);
        return canvasjson;
    }

    saveImage() {
      var objects = this.canvas.getObjects('line');

      for (var line of objects){
        if (line.isGrid){
          line.visible = false;
        }
      }
      let dataURL = this.canvas.toDataURL("image/jpeg", 100);
      for (var line of objects){
        if (line.isGrid){
          line.visible = true;
        }
      }

      return dataURL;
    }

    loadCanvas(canvasjson) {
        fabric.Object.prototype.originX = fabric.Object.prototype.originY =
            "center";
        this.canvas.loadFromJSON(canvasjson, function() {
            this.canvas.renderAll();
            //this.reverseObjectDependencies();
            this.canvas.calcOffset();
            this.canvas.renderAll();
            this.reverseObjectDependencies(false);
        }.bind(this));

        this.canvas.renderAll();
        this.canvas.selection = false;
        fabric.Object.prototype.originX = fabric.Object.prototype.originY = "center";
        this.canvas.calcOffset();
        this.canvas.renderAll();
    }

    renderAllCanvas() {
        this.canvas.renderAll();
    }

    addLabel(textValue, left, top){
      var text = new fabric.IText(textValue, {
            fontSize: 60,
            left: this.canvas.vptCoords.tl.x+left*3,
            fontFamily: 'Helvetica',
            top: this.canvas.vptCoords.tl.y+top*3,
            selectable: true,
            padding:10,
        });
        this.canvas.add(text).setActiveObject(text);
        this.mode = "select";
        this.canvas.defaultCursor = 'pointer';
        this.mainCursor.visible = false;
    }

    Addtext() {
        var text = new fabric.IText("New label", {
            fontSize: 60,
            fontFamily: 'Helvetica',
            left: this.canvas.getVpCenter().x,
            top: this.canvas.getVpCenter().y,
            selectable: true,
            padding:10,
        });
        this.canvas.add(text).setActiveObject(text);
        this.mode = "select";
        this.canvas.defaultCursor = 'pointer';
        this.mainCursor.visible = false;
    }

    makeid() {
        var text = "";
        var possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    getObjByName(name) {
        var object = null,
            objects = this.canvas.getObjects();

        for (var i = 0, len = objects.length; i < len; i++) {
            if (objects[i].name && objects[i].name === name) {
                object = objects[i];
                break;
            }
        }

        return object;
    }

    getObjByPosition(x, y) {
        var object = null,
            objects = this.canvas.getObjects();

        for (var i = 0, len = objects.length; i < len; i++) {
            if (objects[i].top === y && objects[i].left === x) {
              if (objects[i].type == 'circle'){
                object = objects[i];
                break;
              }
            }
        }

        return object;
    }

    getWallByPosition(x, y) {
        var object = null,
            objects = this.canvas.getObjects('line');

        for (var i = 0, len = objects.length; i < len; i++) {
            if (objects[i].y2 === y && objects[i].x2 === x || objects[i].y1 === y && objects[i].x1 === x) {
              if (objects[i].wall == true){
                object = objects[i];
                break;
              }
            }
        }

        return object;
    }

    getObjByDataid(dataid) {
        var object = null,
            objects = this.canvas.getObjects();

        for (var i = 0, len = objects.length; i < len; i++) {
            if (objects[i].dataid == dataid) {
                object = objects[i];
                break;
            }
        }

        return object;
    }

    makeCurvePoint(line) {
        var c = new fabric.Circle({
            left: line.left,
            top: line.top,
            strokeWidth: 3,
            radius: 7,
            curvePoint: true,
            hasRotatingPoint:false,
            fill: "#fff",
            stroke: "#666"
        });

        c.hasBorders = c.hasControls = false;

        c.line = line;

        this.canvas.add(c);
    }

    sendGridToBack(){
      var canvasobj = this._this.canvas.getObjects('line');
      for (var object of canvasobj){
        if (object.isGrid == true){
          this.canvas.sendToBack(object);
        }
      }
    }

    convertToCurved(wall, curve1, curve2, curveControl) {
        //First Conversion
        let pointOne = [];
        let pointTwo = [];
        let pointCurve = [];
        if (wall.wallGroup != undefined){

          this.currentCurveGroup = wall.wallGroup;
        }

        if (this.originalCurveY == null && curve2 != null){
          this.originalCurveY = wall.top;
          this.originalCurveX1 = wall.x1;
          this.originalCurveY1 = wall.y1;
          this.originalCurveX2 = wall.x2;
          this.originalCurveY2 = wall.y2;
        }

        if (this.originalCurveX == null && curve1 != null){
          this.originalCurveX = wall.left;
        }

        //console.log(this.originalCurveY, curve2);
        if (wall.x1 != undefined) {
            pointOne[0] = "M";
            pointOne[1] = wall.x1;
            pointOne[2] = wall.y1;

            pointTwo[0] = "L";
            pointTwo[1] = wall.x2;
            pointTwo[2] = wall.y2;

            this.globalL = pointTwo;
            this.globalM = pointOne;
        }
        if (curve1 != null && curve2 != null) {
            pointOne[0] = "M";
            pointOne[1] = this.globalM[1];
            pointOne[2] = this.globalM[2];

            pointCurve[0] = "Q";
            pointCurve[1] = curve1;
            pointCurve[2] = curve2;
            pointCurve[3] = this.globalL[1];
            pointCurve[4] = this.globalL[2];
        }

        var curvedWall = new fabric.Path([pointOne, pointTwo, pointCurve], {
            fill: "rgba(204, 204, 204, .6)",
            wall: true,
            stroke: "#595959",
            hasBorders:false,
            hasRotatingPoint:false,
            hasControls:false,
            strokeWidth: 9,
            isCurved: true,
            originX: "center",
            originY: "center",
            selectable: false,
        });
        curvedWall.wallGroup = this.currentCurveGroup;
        this.canvas.add(curvedWall);
        wall.wallGroup.add(curvedWall);
        curvedWall.editControlsX1 = wall.editControlsX1;
        curvedWall.editControlsX2 = wall.editControlsX2;

        var newTop = wall.top;
        if (this.originalCurveY != null){
          newTop = this.originalCurveY - (this.originalCurveY - curve2)/2.7;
        }

        var newLeft = wall.left;
        if (this.originalCurveX != null){
          //console.log((this.originalCurveX - curve1));
          //newLeft = this.originalCurveX - (this.originalCurveX - curve1)/2.7;
        }

        curvedWall.set({ left: newLeft, top: newTop });

        curvedWall.setCoords();
        this.currentCurve = curvedWall;

        //this.canvas.add(curvedWall);
        
        this.transferWall(wall, curvedWall);

        this.deleteWall(wall, true);
        
        // console.log('this:', this)
        this.canvas.renderAll();
        this.mode = "editcurve";
        this.canvas.bringToFront(this.getObjByName(curvedWall.editControlsX1[0]));
        this.canvas.bringToFront(this.getObjByName(curvedWall.editControlsX2[0]));
        //this.sendGridToBack();
    }

    addObject(url) {
        var objImg = new Image();
        let _this = this;
        // console.log(this, this.objectSizes)
        let scaler = 1;
        objImg.crossOrigin = "Anonymous";
        var lefts = this.canvas.getWidth()/2;
        var tops = this.canvas.getHeight()/5;

        objImg.onload = function(img) {
            var obj = new fabric.Image(objImg, {
                left: _this.canvas.getVpCenter().x,
                top: _this.canvas.getVpCenter().y,
                padding:20,
                scaleX: scaler,
                scaleY: scaler
            });

            _this.canvas.add(obj);
            _this.canvas.deactivateAll();
            _this.canvas.setActiveObject(obj);
        };

        objImg.src = url;
        
        this.mode = "select";
        this.canvas.defaultCursor = 'pointer';
        this.mainCursor.visible = false;

        this.canvas.renderAll();
    }

    createPen(){
        var objImg = new Image();

        let _this = this;
        let scaler = 2.4;
        objImg.crossOrigin = "anonymous";
        var lefts= this.canvas.getWidth()/2;
        var tops= this.canvas.getHeight()/5;

        objImg.onload = function(img) {
            var obj = new fabric.Image(objImg, {
                left: lefts,
                top: tops,
                scaleX: scaler,
                scaleY: scaler,
                isPen:true,
                selectable: false,
                evented: false,
            });
            _this.canvas.add(obj);
            _this.mainCursor = obj;
            window.dispatchEvent( new Event('finishedLoading') );
        };
        objImg.src = "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA0NDggNDQ4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0NDggNDQ4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTU0MC4zNikiPgoJPGc+CgkJPGc+CgkJCTxwYXRoIGQ9Ik0yNTUuNSw3NjQuNDFjMC0xNy40LTE0LjEtMzEuNS0zMS41LTMxLjVjLTE3LjQsMC0zMS41LDE0LjEtMzEuNSwzMS41czE0LjEsMzEuNSwzMS41LDMxLjUgICAgIEMyNDEuNCw3OTUuOTEsMjU1LjUsNzgxLjgxLDI1NS41LDc2NC40MXogTTIyNCw3ODAuOTFjLTkuMSwwLTE2LjUtNy40LTE2LjUtMTYuNXM3LjQtMTYuNSwxNi41LTE2LjVjOS4xLDAsMTYuNSw3LjQsMTYuNSwxNi41ICAgICBTMjMzLjEsNzgwLjkxLDIyNCw3ODAuOTF6IiBmaWxsPSIjMDAwMDAwIi8+CgkJCTxwYXRoIGQ9Ik0zOTkuNSw3NTYuOTFjLTEuOC00NC40LTE5LjktODUuNy01MS40LTExN2MtMzEuNC0zMS4yLTcyLjUtNDkuMS0xMTYuNS01MXYtNDguNWgtMTV2NDguNWMtNDQuNSwxLjgtODUuOCwxOS43LTExNyw1MSAgICAgYy0zMS4yLDMxLjMtNDkuMiw3Mi41LTUxLDExN0gwdjE1aDQ4LjVjMS44LDQ0LDE5LjgsODUuMiw1MSwxMTYuNWMzMS40LDMxLjUsNzIuNyw0OS42LDExNyw1MS40djQ4LjVoMTV2LTQ4LjUgICAgIGM0My45LTEuOSw4NS4xLTE5LjksMTE2LjYtNTEuNHM0OS42LTcyLjYsNTEuNC0xMTYuNkg0NDh2LTE0LjlIMzk5LjV6IE0yMzEuNSw2MDMuOTFjODIuNiwzLjgsMTQ5LjIsNzAuNCwxNTMsMTUzaC0zMy4xICAgICBjLTEuOC0zMS42LTE0LjktNjAuOC0zNy4zLTgzLjFjLTIyLjMtMjIuMS01MS40LTM1LTgyLjYtMzYuOFY2MDMuOTF6IE0yMTYuNSw2MDMuOTF2MzMuMWMtNjUuNSwzLjYtMTE2LjMsNTQuNC0xMTkuOSwxMTkuOUg2My41ICAgICBDNjcuMiw2NzIuOTEsMTMyLjUsNjA3LjYxLDIxNi41LDYwMy45MXogTTIxNi41LDkyNC45MWMtODIuNi0zLjgtMTQ5LjItNzAuNC0xNTMtMTUzaDMzLjFjMS44LDMxLjMsMTQuNyw2MC40LDM2LjgsODIuNiAgICAgYzIyLjMsMjIuNCw1MS41LDM1LjUsODMuMSwzNy4zVjkyNC45MXogTTIxNi41LDg0NC4zMXYzMi41Yy01Ni4xLTMuNy0xMDEuMS00OC43LTEwNC45LTEwNC45aDMyLjV2LTE1aC0zMi41ICAgICBjMy42LTU3LDQ3LjgtMTAxLjMsMTA0LjktMTA0Ljl2MzIuNWgxNXYtMzIuNWM1Ni4xLDMuNywxMDEuMSw0OC43LDEwNC45LDEwNC45aC0zMi41djE1aDMyLjVjLTMuNyw1Ni4xLTQ4LjcsMTAxLjEtMTA0LjksMTA0LjkgICAgIHYtMzIuNUgyMTYuNXogTTIzMS41LDkyNC45MXYtMzMuMWM2NC40LTMuOCwxMTYuMS01NS41LDExOS45LTExOS45aDMzLjFDMzgwLjcsODU0LjUxLDMxNC4xLDkyMS4xMSwyMzEuNSw5MjQuOTF6IiBmaWxsPSIjMDAwMDAwIi8+CgkJPC9nPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="
        this._this.canvas.bringToFront(this._this.mainCursor)
        this.canvas.renderAll();
        
    }

    findCursor(){
      if (this._this.mainCursor.top > this._this.canvas.vptCoords.bl.y){
          this._this.canvas.relativePan({x:0,y:-60});
        }
        else if (this._this.mainCursor.top < this._this.canvas.vptCoords.tl.y){
          this._this.canvas.relativePan({x:0,y:60});
        }
        if (this._this.mainCursor.left < this._this.canvas.vptCoords.bl.x){
          this._this.canvas.relativePan({x:60,y:0});
        }
        else if (this._this.mainCursor.left > this._this.canvas.vptCoords.br.x){
          this._this.canvas.relativePan({x:-60,y:0});
        }
    }

    checkCursorIsOnScreen(){
      if(this._this.mainCursor != null && !this._this.mainCursor.isOnScreen()){
        while(!this._this.mainCursor.isOnScreen()){
          this._this.findCursor();
        }
      }
    }

    checkMouseMoveScreen(){

      if(this._this.mainCursor != null){
        if (this._this.mainCursor.aCoords.bl.y > this._this.canvas.vptCoords.bl.y || this._this.mainCursor.aCoords.tl.y < this._this.canvas.vptCoords.tl.y || this._this.mainCursor.aCoords.bl.x < this._this.canvas.vptCoords.bl.x || this._this.mainCursor.aCoords.br.y > this._this.canvas.vptCoords.br.x){
          this._this.findCursor();
        }
      }
    }

    snapToPoint(){
      var lineEndings = this.canvas.getObjects('circle');

      var correctedMouseRangeX = [this.correctedMouseX - 15, this.correctedMouseX + 15];
      var correctedMouseRangeY = [this.correctedMouseY - 15, this.correctedMouseY + 15];

      var onGridLineX = [];
      for (var lineEnd of lineEndings){
        if ('linesX1' in lineEnd){
          if (lineEnd.left > correctedMouseRangeX[0] && lineEnd.left < correctedMouseRangeX[1] && lineEnd.top > correctedMouseRangeY[0] && lineEnd.top < correctedMouseRangeY[1]){

            if (this._this.mainCursor != null){
              this._this.correctedMouseX = lineEnd.left;
              this._this.correctedMouseY = lineEnd.top;

              this._this.mainCursor.set({top:this._this.correctedMouseY, left:this._this.correctedMouseX});
              this._this.mainCursor.setCoords();
              this._this.canvas.bringToFront(this._this.mainCursor)
            }

          }
        }
      }
    }

    updatePen(){
        if (this._this.mainCursor != null){
          this._this.mainCursor.set({top:this._this.correctedMouseY, left:this._this.correctedMouseX});
          this._this.mainCursor.setCoords();
          this._this.canvas.bringToFront(this._this.mainCursor)
        }
        if(this._this.mainCursor.isOnScreen()){
            
        }
        else{
          var vpw = this._this.canvas.width;
          var vph = this._this.canvas.height;

          var x = 0;
          var y = 0;

          this._this.checkCursorIsOnScreen();
        }   
        this._this.checkIntersection();
        this._this.checkGridlines();
        
        this.canvas.renderAll();
        this._this.drawNumberKey = null;
    }

    deselectLine(line) {
        if (line.editControls1 != null) {
            //this.canvas.remove(this.getObjByName(line.editControls1));
            //this.canvas.remove(this.getObjByName(line.editControls2));
            //line.editControls1 = null;
            //line.editControls2 = null;
        }
    }

    deselectAll() {
        // console.log('deselect all',this.canvas, this.canvas.getObjects('line').length)
        for (var i = 0; i < this.canvas.getObjects("line").length; i++) {
            var currentObj = this.canvas.getObjects("line")[i];
            if (currentObj.wall == true) {
                // console.log(currentObj)
                this.deselectLine(currentObj);
            } else {
                // console.log(currentObj)
            }
        }
        this.canvas.discardActiveObject();
    }

    deleteWall(wall, isCurved, isFloor) {

        var grouparea = wall.wallGroup;

        try{
          for (var linecontrol of wall.editControlsX1){
            var controlLine = this.getObjByName(linecontrol);
            if (controlLine != null){
              var controlLines = controlLine.linesX1;

              var wallIndex = 0;
              for (var line of controlLines){
                if (wall == line){
                  this.getObjByName(linecontrol).linesX1.splice(wallIndex,1);
                  break;
                }
                wallIndex++;
              }
            }

            if (controlLine.linesX1.length + controlLine.linesX2.length == 0){
              this.canvas.remove(controlLine);
            }
          }
        }
        catch(e){}

        try{
          for (var linecontrol of wall.editControlsX2){
            var controlLine = this.getObjByName(linecontrol);
            if (controlLine != null){
              var controlLines = controlLine.linesX2;

              var wallIndex = 0;
              for (var line of controlLines){
                if (wall == line){
                  this.getObjByName(linecontrol).linesX2.splice(wallIndex,1);
                  break;
                }
                wallIndex++;
              }
            }
            if (controlLine.linesX1.length + controlLine.linesX2.length == 0){
              this.canvas.remove(controlLine);
            }
          }
        }catch(e){}

        this.canvas.remove(this.getObjByName(wall.measurementText));

        if (!isFloor){
          if ('wallGroup' in wall && wall.wallGroup.floor != null && 'floor' in wall.wallGroup){
            if (isCurved){

            }else{
              this.removePolyFloor(wall.wallGroup);
            }
          }
          if ('wallGroup' in wall){
            wall.wallGroup.remove(wall);
          }
        }

        

        this.canvas.remove(wall);


    }

    transferWall(wall, newwall) {

        var grouparea = wall.wallGroup;

        const newEdit1 = wall.editControlsX1;
        const newEdit2 = wall.editControlsX2;

        newwall.editControlsX1 = newEdit1;
        newwall.editControlsX2 = newEdit2;

        try{
          for (var linecontrol of wall.editControlsX1){
            var controlLine = this.getObjByName(linecontrol);
            if (controlLine != null){
              var controlLines = controlLine.linesX1;

              var wallIndex = 0;
              for (var line of controlLines){
                if (wall == line){
                  this.getObjByName(linecontrol).linesX1[wallIndex] = newwall;
                  break;
                }
                wallIndex++;
              }
            }
          }
        }catch(e){}
        
        try{
          for (var linecontrol of wall.editControlsX2){
            var controlLine = this.getObjByName(linecontrol);
            if (controlLine != null){
              var controlLines = controlLine.linesX2;

              var wallIndex = 0;
              for (var line of controlLines){
                if (wall == line){
                  this.getObjByName(linecontrol).linesX2[wallIndex] = newwall;
                  break;
                }
                wallIndex++;
              }
            }
          }
        }catch(e){}

        if (wall.measurementText != undefined){
          this.canvas.remove(this.getObjByName(wall.measurementText));
        }
        try{
          const newgroup = wall.wallGroup;
          newgroup.add(newwall);
          newgroup.remove(wall);
          this.canvas.remove(wall);
        }catch(e){}
    }

    getControlGroup(p){
        var wallGroup = null;
        for (var line of p.linesX1){
          if (line != undefined && line != null){
            wallGroup = line.wallGroup;
            break;
          }
        }
        if (wallGroup == null){
          for (var line of p.linesX2){
            if (line != undefined && line != null){
                wallGroup = line.wallGroup;
                break;
            }
          }
        }
        return wallGroup;
      }

    lineControls(line, continuing) {

        if (!continuing) {

            var lineControl = this.makeCircle(
                line.get("x1"),
                line.get("y1"),
                line,
                "x1"
            );

            line.editControlsX1 = [lineControl];

            if (line.wallGroup._objects.length > 1){

              if ('editControlsX2' in line.wallGroup._objects[line.wallGroup._objects.length-2]){
                line.wallGroup._objects[line.wallGroup._objects.length-2].editControlsX2.push(lineControl);
              }
              else{
                line.wallGroup._objects[line.wallGroup._objects.length-2].editControlsX2 = [lineControl];
              }

            }
        }
        else{
            line.editControlsX1 = [this.continuingControl.name];
            if ('linesX1' in this.continuingControl && this.continuingControl.linesX1 != null && this.continuingControl.linesX1.length > 0){
              this.continuingControl.linesX2 = [line];
            }
            if ('linesX2' in this.continuingControl && this.continuingControl.linesX2 != null && this.continuingControl.linesX2.length > 0){
              this.continuingControl.linesX1 = [line];
            }
            
            this.continuingControl = null;
        }
    }

    lineCap(line){
      var lineControl2 = this.makeCircle(
          line.get("x2"),
          line.get("y2"),
          line,
          "x2",
          true
      );

      line.editControls2 = lineControl2;
    }

    getWallIndex(wall){
      var wallIndex = 0;
      for (var line of wall.wallGroup._objects){
        if (wall == line){
          
          break;
        }
        wallIndex++;
      }
      return wallIndex;
    }

    makeCircle(left, top, line1, controlType, isLineCap) {
        var new_name = this.makeid();

        var connectedLines = line1.wallGroup._objects.length > 1 ? [line1.wallGroup._objects[this.getWallIndex(line1)-1]] : [];

        var c = new fabric.Circle({
            left: left,
            top: top,
            strokeWidth: 2,
            radius:10,
            fill: "#fff",
            stroke: "#666",
            hasControls:false,

            lockUniScaling: true,
            hasRotatingPoint:false,
            selectable: false,
            linesX1: [line1],
            //linesX2: [line1.group._objects[this.getWallIndex(line1)-1]],
            linesX2: connectedLines,
            name: new_name
        });

        if (isLineCap){
          c.isLineCap = isLineCap;
        }

        c.hasControls = c.hasBorders = false;
        c.controlType = controlType;

        this.canvas.add(c);

        return new_name;
    }

    checkIntersection() {
      for (var obj of this.canvas.getObjects('circle')){
        if (obj.type == 'circle' && !('isMeasurement' in obj)){
          if (obj.top == this.correctedMouseY && obj.left == this.correctedMouseX){
            obj.set('fill' , "#67a565");
            this.intersectingWall = obj;
            break;
          }else{;
            this.intersectingWall = null;
          }
          
        }
      }
    }

    toRad(pnt){
      return pnt * Math.PI / 180;
    }

    //-- Define degrees function
    toDegrees(pnt){
      return pnt * (180 / Math.PI);
    }

    middlePoint(lat1, lng1, lat2, lng2) {
      
        //-- Longitude difference
        var dLng = this.toRad((lng2 - lng1));

        //-- Convert to radians
        lat1 = this.toRad(lat1);
        lat2 = this.toRad(lat2);
        lng1 = this.toRad(lng1);

        var bX = Math.cos(lat2) * Math.cos(dLng);
        var bY = Math.cos(lat2) * Math.sin(dLng);
        var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY));
        var lng3 = lng1 + Math.atan2(bY, Math.cos(lat1) + bX);

        //-- Return result
        return [this.toDegrees(lng3), this.toDegrees(lat3)];
    }

    RadsToDegrees(radians){
      return (radians * 180 / Math.PI);
    }

    updateAngleGizmo(){
      if (this._this.angleMeasurements != null){
        let moveAngle = this.angle360(this.currentShape.x1, this.currentShape.y1, this.currentShape.x2, this.currentShape.y2);

        let prevLine = this.getWallByPosition(this.currentShape.x1, this.currentShape.y1);

        let endAngle;
        let startAngle;
        let diffAngle;

        diffAngle = this.angle360(prevLine.x2, prevLine.y2, prevLine.x1, prevLine.y1);

        if (Math.abs(this.RadsToDegrees(moveAngle)-this.RadsToDegrees(diffAngle)) < 180){
          startAngle = moveAngle;
          endAngle = diffAngle;
        }else{
          endAngle = moveAngle;
          startAngle = diffAngle;
        }


        var newAngleMeasurement = new fabric.Circle({
            radius: 70,
            left: this.angleMeasurements.left,
            top: this.angleMeasurements.top,
            startAngle: startAngle,
            endAngle: endAngle,
            isMeasurement: true,
            stroke: 'rgba(13, 66, 210, 0.42)',
            strokeWidth: 4,
            fill: ''
        });
        this.angleText.setColor('rgba(13, 66, 210, .8)');

        this.canvas.remove(this.angleMeasurements);
        this.angleMeasurements = newAngleMeasurement;
        this.canvas.add(this.angleMeasurements);

        var AB = Math.sqrt(Math.pow(this.currentShape.x1-prevLine.x1,2)+ Math.pow(this.currentShape.y1-prevLine.y1,2));    
        var BC = Math.sqrt(Math.pow(this.currentShape.x1-this.currentShape.x2,2)+ Math.pow(this.currentShape.y1-this.currentShape.y2,2)); 
        var AC = Math.sqrt(Math.pow(this.currentShape.x2-prevLine.x1,2)+ Math.pow(this.currentShape.y2-prevLine.y1,2));
        var ang = Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
        var angdeg = (ang * 180) / Math.PI;


        var newx = this.currentShape.x1;
        var newy = this.currentShape.y1;

        var angleGizmoText = Math.round(angdeg,2).toString() == 'NaN' ? '' :  Math.round(angdeg,2).toString();
        var angleGizmoColor = Math.round(angdeg,2).toString() == 'NaN' ? 'rgba(13, 66, 210, 0)' : 'rgba(13, 66, 210, 0.8)';

        this.angleText.set({
          text:angleGizmoText+'°',
          top:newy,
          color: angleGizmoColor,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          selectable: false,
          evented: false,

          left:newx
        });

      }
    }

    updateMeasurements(measurement, line, isX1) {
        var anglex2;
        var angley2;
        var dist;
        var angle;

        var textref = this.getObjByName(line.measurementText);

        var hasFloor = false;
        var polyLinesX = [];
        var polyLinesY = [];
        var polyLinesMidd = [];

        var modLeft = 0;
        var modTop = 0;

        var textLeft = (line.x2 + line.x1) / 2;
        var textTop = (line.y2 + line.y1) / 2;


        if (textref != null){
          
              anglex2 = line.x1 - line.x2;
              angley2 = line.y1 - line.y2;
              dist = Math.sqrt(anglex2 * anglex2 + angley2 * angley2);
              angle = (Math.atan2(angley2, anglex2) / Math.PI * 180) + 180;

              var testPnt = this.movePnt([textLeft, textTop], angle, 100);
              var testFabricPnt = new fabric.Point(testPnt[0], testPnt[1]);

              var textAngle = angle <= 180 ? angle + 180 : angle;

              if ('wallGroup' in line){

                var groupPoints = [];
                //GET ALL WALL POINTS
                for (var wallSegment of line.wallGroup._objects){
                  var pntOne = {x:wallSegment.x1, y: wallSegment.y1};
                  var pntTwo = {x:wallSegment.x2, y: wallSegment.y2};
                  if (true){
                    groupPoints.push(pntOne);
                  }
                  if (true){
                    groupPoints.push(pntTwo);
                  }
                }
                var pntOne = {x:line.x1, y: line.y1};
                var pntTwo = {x:line.x2, y: line.y2};
                groupPoints.push(pntTwo);
                  

                if (this.inside([testFabricPnt.x, testFabricPnt.y], groupPoints)){

                  var posTextPnt = this.movePnt([textLeft, textTop], angle, -40);
                  var posTextFabPnt = new fabric.Point(posTextPnt[0], posTextPnt[1]);

                  textref.set({
                      left: posTextFabPnt.x,
                      top: posTextFabPnt.y,
                      angle: textAngle 
                  });
                  
                }
                else{
                  //var oppang = angle + 180 > 360 ? angle - 180 : angle + 180;
                  var negTextPnt = this.movePnt([textLeft, textTop], angle, 40);
                  var negTextFabPnt = new fabric.Point(negTextPnt[0], negTextPnt[1]);

                  textref.set({
                      left: negTextFabPnt.x,
                      top: negTextFabPnt.y,
                      angle: textAngle 
                  });
                }
              }

              //console.log(angle);
          }


          var imag_dist = dist / 24;

          var feet_meas = Math.floor(imag_dist);
          var decimal = imag_dist - feet_meas;

          var decminalMeasurement = decimal!= 0 ? (decimal*100).toString().substring(0,1) : 0;

          // var inches = Math.round(decimal * 12);
          // if (inches >= 12) {
          //     feet_meas = feet_meas + 1;
          //     inches = 0;
          // }

          textref.text = feet_meas.toString() + "." + decminalMeasurement + ' ft';
          if(feet_meas < 2){
            textref.visible = false;
          }else{
            textref.visible = true;
          }

          textref.setCoords();
      
    }

    checkGridlines(){
      var lineEndings = this.canvas.getObjects('circle');
      
      var showGridlineX = false;
      var showGridlineY = false;

      var correctedMouseRangeX = [this.correctedMouseX - 15, this.correctedMouseX + 15];
      var correctedMouseRangeY = [this.correctedMouseY - 15, this.correctedMouseY + 15];

      var onGridLineX = [];
      for (var lineEnd of lineEndings){
        if ('linesX1' in lineEnd){
          if (lineEnd.left > correctedMouseRangeX[0] && lineEnd.left < correctedMouseRangeX[1]){
            onGridLineX.push(lineEnd);
            lineEnd.set({fill:'rgba(0,0,255,.35)', stroke:'rgba(0,0,255,.35)'});
            this.canvas.remove(this.gridLineX);
            var points = [
                lineEnd.left,
                lineEnd.top-5000,
                lineEnd.left,
                lineEnd.top+5000
            ];

            var gridLine = new fabric.Line(points, {
                strokeWidth: 2,
                stroke: "rgba(0,0,255,0.6)",
                selectable: false,
                hasBorders:false,
                hasRotatingPoint:false,
                hasControls:false,
                lockUniScaling: true,
                strokeLineCap: 'round',
                evented: false,
            });


            this.gridLineX = gridLine;

            this.canvas.add(gridLine);
            //this.canvas.sendToBack(gridLine);
            showGridlineX = true;
          }
        }
      }

      var onGridLineY = [];
      for (var lineEnd of lineEndings){
        if ('linesX1' in lineEnd){
          if (lineEnd.top > correctedMouseRangeY[0] && lineEnd.top < correctedMouseRangeY[1]){
            onGridLineY.push(lineEnd);
            lineEnd.set({fill:'rgba(0,0,255,.35)', stroke:'rgba(0,0,255,.35)'});
            this.canvas.remove(this.gridLineY);
            var points = [
                lineEnd.left-5000,
                lineEnd.top,
                lineEnd.left+5000,
                lineEnd.top
            ];

            var gridLine = new fabric.Line(points, {
                strokeWidth: 2,
                stroke: "rgba(0,0,255,0.6)",
                selectable: false,
                hasBorders:false,
                hasRotatingPoint:false,
                hasControls:false,
                lockUniScaling: true,
                strokeLineCap: 'round',
                evented: false,
            });



            this.gridLineY=gridLine;

            this.canvas.add(gridLine);
            //this.canvas.sendToBack(gridLine);
            showGridlineY = true;
          }
        }
      }

      if (onGridLineY.length > 0){
        this.onGridLineY = onGridLineY;
      }
      if (onGridLineX.length > 0){
        this.onGridLineX = onGridLineX;
      }

      if (!showGridlineY){
        this.canvas.remove(this.gridLineY);
        this.gridLineY = null;

        if (this.onGridLineY != null){
          for (var lineEnd of this.onGridLineY){
            lineEnd.set({fill: "#fff",stroke: "#666"});
          }
        }
        this.onGridLineY = null;
      }
      if (!showGridlineX){
        this.canvas.remove(this.gridLineX);
        this.gridLineX = null;

        if (this.onGridLineX != null){
          for (var lineEnd of this.onGridLineX){
            lineEnd.set({fill: "#fff",stroke: "#666"});
          }
        }
        this.onGridLineX = null;
      }

    }

    endCheckGridlines() {
      if (this.gridLineX != null){
        this.canvas.remove(this._this.gridLineX);
        this.gridLineX = null;
      }

      if (this.gridLineY != null){
        this.canvas.remove(this._this.gridLineY);
        this.gridLineY = null;
      }

      for (var lineEnd of this.canvas.getObjects('circle')){
        if ('linesX1' in lineEnd){
          lineEnd.set({fill: "#fff",stroke: "#666"});
        }
      }
    }

    toRadians(degrees) {
      return degrees * Math.PI / 180;
    };

    movePnt(point, angle, unit) {
      var x = point[0];
      var y = point[1];
      var rad = this.toRadians(angle % 360);

      x += unit*Math.sin(rad);
      y += unit*Math.cos(rad);

      return [x, y];
    }

    inside(point, vs) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

        var x = point[0], y = point[1];

        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i].x, yi = vs[i].y;
            var xj = vs[j].x, yj = vs[j].y;

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    updateMeasurementsLine(measurement, line) {
        var textref = this.getObjByName(line.measurementText);

        var textLeft = (line.x2 + line.x1) / 2;
        var textTop = (line.y2 + line.y1) / 2;

        var anglex2 = line.x2 - line.x1;
        var angley2 = line.y2 - line.y1;
        
        var angle = Math.atan2(angley2, anglex2) / Math.PI * 180;

        var dist = Math.sqrt(anglex2 * anglex2 + angley2 * angley2);

        angle = angle + 180;

        var textAngle = angle > 90 && angle < 270 ? angle - 180 : angle;

        var testPnt = this.movePnt([textLeft, textTop], angle, 100);
        var testFabricPnt = new fabric.Point(testPnt[0], testPnt[1]);

        //var textAngle = angle >= 180 && angle < 360 ? angle - 180 : angle;
        //var textAngle = angle;
        //console.log(angle);
        //var textAngle = angle >= 360 ? angle - 180 : angle;

        if (textref != null){

          if ('wallGroup' in line){
            var groupPoints = [];
                //GET ALL WALL POINTS
                for (var wallSegment of line.wallGroup._objects){
                  var pntOne = {x:wallSegment.x1, y: wallSegment.y1};
                  var pntTwo = {x:wallSegment.x2, y: wallSegment.y2};
                  if (groupPoints.indexOf(pntOne) == -1){
                    groupPoints.push(pntOne);
                  }
                  if (groupPoints.indexOf(pntTwo) == -1){
                    groupPoints.push(pntTwo);
                  }
                  
                }

            if (line.wallGroup.floor != null && line.wallGroup.floor[0] != null){
              groupPoints = line.wallGroup.floor[0].points;
            }

            if (this.inside([testFabricPnt.x, testFabricPnt.y], groupPoints)){

              var posTextPnt = this.movePnt([textLeft, textTop], angle, -40);
              var posTextFabPnt = new fabric.Point(posTextPnt[0], posTextPnt[1]);

              textref.set({
                  left: posTextFabPnt.x,
                  top: posTextFabPnt.y,
                  angle: textAngle 
              });
              
            }
            else{
              //var oppang = angle + 180 > 360 ? angle - 180 : angle + 180;
              var negTextPnt = this.movePnt([textLeft, textTop], angle, 40);
              var negTextFabPnt = new fabric.Point(negTextPnt[0], negTextPnt[1]);

              textref.set({
                  left: negTextFabPnt.x,
                  top: negTextFabPnt.y,
                  angle: textAngle 
              });
            }
          }

          var imag_dist = dist / 24;

          var feet_meas = Math.floor(imag_dist);
          var decimal = imag_dist - feet_meas;

          var inches = decimal;

          var decminalMeasurement = decimal!= 0 ? (decimal*100).toString().substring(0,1) : 0;

          textref.text = feet_meas.toString() + "." + decminalMeasurement + ' ft';

          textref.setCoords();
        }
    }

    updateDrawMovement(){
      var points = this._this.currentShape;

      this._this.currentShape.set({
          x2: this._this.correctedMouseX,
          y2: this._this.correctedMouseY
      });

      this._this.currentShape.setCoords();

      this.canvas.renderAll();

      this._this.updateMeasurements(this._this.currentShape.measurementText, this._this.currentShape);

      this._this.updateAngleGizmo();

      this.canvas.renderAll();
    }

    angle(cx, cy, ex, ey) {
      var dy = ey - cy;
      var dx = ex - cx;
      var theta = Math.atan2(dy, dx); // range (-PI, PI]
      //console.log(theta);
      // theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
      return theta;
    }

    angle360(cx, cy, ex, ey, returnDeg) {
      var theta = this._this.angle(cx, cy, ex, ey); // range (-180, 180]
      if (returnDeg){
        theta *= 180 / Math.PI;
        if (theta < 0) theta = 360 + theta; // range [0, 360)
      }
      return theta;
    }

    radiansToDegrees(theta){
      if (theta < 0) theta = 360 + theta;
      return theta;
    }

    startLineDraw(){
      this._this.isDirty = true;
      var points = [
          this.correctedMouseX,
          this.correctedMouseY,
          this.correctedMouseX,
          this.correctedMouseY
      ];

      var measureName = this._this.makeid();

      var measurementText = new fabric.IText("0' " + ' 0"', {
          name: measureName,
          fontSize: 32,
          textBackgroundColor: "#fff",
          fontFamily: 'Helvetica',
          selectable: false,
          evented: false
      });

      var polygon = new fabric.Line(points, {
          strokeWidth: 10,
          stroke: "#595959",
          selectable: false,
          hasBorders:false,
          hasRotatingPoint:false,
          hasControls:false,
          lockUniScaling: true,
          wall: true,
          strokeLineCap: 'round',
          //perPixelTargetFind: true,
          targetFindTolerance: 35,
          measurementText: measureName,
          name: this._this.makeid(),

      });

      

      this._this.currentShape = polygon;

      if (this._this.activeGroup == null){
        let newWallGroup = new fabric.Group([this._this.currentShape]);
        this.canvas.add(newWallGroup);
        this._this.activeGroup = newWallGroup;
        this._this.currentShape.wallGroup = newWallGroup;
      }else{
        let currWallGroup = this._this.activeGroup;

        currWallGroup.add(this._this.currentShape);
        this._this.activeGroup.setCoords();
        this._this.currentShape.wallGroup = currWallGroup;
      }

      this._this.canvas.add(this._this.currentShape);
      polygon.setShadow({
          color: 'rgb(122, 122, 122, 0.4)',
          blur: 4,
          offsetX: 3,
          offsetY: 3,
          opacity:0.2,
      });
      polygon.shadow.affectStroke = true;
      this._this.canvas.add(measurementText);
      


      //Angle measurement
      if (this._this.currentShape.wallGroup._objects.length > 1){
        const lstLine = this._this.activeGroup._objects[this._this.activeGroup._objects.length-2];
        const newAngle = this.angle360(lstLine.x1, lstLine.y1, lstLine.x2, lstLine.y2);
        this._this.angleMeasurements = new fabric.Circle({
            radius: 70,
            left: this.correctedMouseX,
            top: this.correctedMouseY,
            startAngle: this.angle360(this._this.currentShape.x1, this._this.currentShape.y1, this._this.currentShape.x2, this._this.currentShape.y2),
            endAngle: newAngle,
            isMeasurement: true,
            stroke: 'rgba(13, 66, 210, 0)',
            strokeWidth: 4,
            fill: ''
        });
        this._this.angleText = new fabric.IText('', {
            fontSize: 30,
            left: this.correctedMouseX,
            editable: false,
            top: this.correctedMouseY,
            originX: 'center', 
            originY: 'center',
            color: 'rgba(13, 66, 210, 0)',
            selectable: false,
            evented: false,
        });

        this._this.angleText.setColor('rgba(13, 66, 210, 0)');
        this._this.canvas.add(this._this.angleMeasurements);
        this._this.canvas.add(this._this.angleText);
      }

      this._this.mode = "drawend";
    }

    endLineDraw(){
      this._this.isDirty = true;

      if (this._this.continuingControl != null){
        this._this.continuingControl = null;
      }

      this._this.canvas.remove(this._this.angleText);
      this._this.angleText = null;
      this._this.canvas.remove(this._this.angleMeasurements);
      this._this.angleMeasurements = null;

      this._this.currentShape.selectable = true;
      var points = this._this.currentShape.get("points");
      this._this.currentShape.set({
          x2: this._this.correctedMouseX,
          y2: this._this.correctedMouseY,
          selectable: true,
          hasBorders: false,
          hasControls:false,
          hasRotatingPoint:false,
      });

      this._this.currentShape.setCoords();

      // if (this._this.continuingControl != null){
      //   this._this.canvas.bringToFront(this._this.continuingControl);
      //   this._this.lineControls(this._this.currentShape, true);
      // }else{
      this._this.lineControls(this._this.currentShape, false);
      this._this.updateMeasurements(this._this.currentShape.measurementText, this._this.currentShape);
      //}
      
      //this._this.connectActiveWall();
      this._this.startLineDraw();
    }

    connectFinalWall(){
      this._this.canvas.remove(this._this.angleText);
      this._this.angleText = null;
      this._this.canvas.remove(this._this.angleMeasurements);
      this._this.angleMeasurements = null;

      this._this.createdFloor = true;
      this._this.currentShape.selectable = true;
      //this._this.mode = 'select';
      this._this.isDirty = true;
      var points = this._this.currentShape.get("points");
      this._this.currentShape.set({
          x2: this.correctedMouseX,
          y2: this.correctedMouseY
      });
      this._this.currentShape.setCoords();
      
      const group = this._this.activeGroup;
      this._this.lastCreateArea = this._this.currentShape.wallGroup;
      this._this.activeGroup = null;
      this._this.createPolyFloor(this._this.currentShape.wallGroup);

      
      this._this.intersectingWall.set('fill' , "#fff");
      if (this._this.continuingControl != null){
        this._this.lineControls(this._this.currentShape, true);
        this._this.continuingControl= true;
      }else{
        this._this.lineControls(this._this.currentShape);
      }
      
      this._this.canvas.bringToFront(this._this.intersectingWall);

      this._this.currentShape.editControlsX2 = [this._this.intersectingWall.get('name')];

      //INTERESTING
      this._this.intersectingWall.linesX2.push(this._this.currentShape);

      //console.log(group._objects);
      //this._this.findClosedRooms(group);
      
      this._this.intersectingWall = null;
      this.mode = "select";
      this.canvas.defaultCursor = 'pointer';
      this.mainCursor.visible = false;

      this._this.endCheckGridlines();
      //this._this.moveLineGroup(this._this.currentShape, 2,2);
      for (var lineSeg of this._this.currentShape.wallGroup._objects){
        this._this.updateMeasurementsLine(lineSeg.measurementText, lineSeg, true);
      }
      this._this.currentShape = null;
      window.dispatchEvent(this._this.completeFloorEvent);
      
    }

    connectActiveWall(){
      
      //
      this._this.currentShape.hasControls = false;

      this._this.currentShape = null;
    }

    calcPolygonArea(vertices) {
        var total = 0;

        for (var i = 0, l = vertices.length; i < l; i++) {
          var addX = vertices[i].x;
          var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
          var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
          var subY = vertices[i].y;

          total += (addX * addY * 0.5);
          total -= (subX * subY * 0.5);
        }

        return Math.round((Math.abs(total)/24)/24);
    }

    removePolyFloor(wallGroup){
      this.canvas.remove(wallGroup.floor[0].areaText);
      this.canvas.remove(wallGroup.floor[0]);
      wallGroup.floor=null;
      this.canvas.renderAll();
    }

    get_polygon_centroid(pts) {
       var first = pts[0], last = pts[pts.length-1];
       if (first.x != last.x || first.y != last.y) pts.push(first);
       var twicearea=0,
       x=0, y=0,
       nPts = pts.length,
       p1, p2, f;
       for ( var i=0, j=nPts-1 ; i<nPts ; j=i++ ) {
          p1 = pts[i]; p2 = pts[j];
          f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
          twicearea += f;
          x += (p1.x + p2.x - 2 * first.x) * f;
          y += (p1.y + p2.y - 2 * first.y) * f;
       }
       f = twicearea * 3;
       return { x:x/f + first.x, y:y/f + first.y };
    }

    equals(a, b) {
        if (a.length !== b.length) {
            return false;
        }

        var seen = {};
        a.forEach(function(v) {
            var key = (typeof v) + v;
            if (!seen[key]) {
                seen[key] = 0;
            }
            seen[key] += 1;
        });

        return b.every(function(v) {
            var key = (typeof v) + v;
            if (seen[key]) {
                seen[key] -= 1;
                return true;
            }
            // not (anymore) in the map? Wrong count, we can stop here
        });
    }

    movePolyFloor(lineGroup, xMov, yMov){
      var polyPnts = [];
      var newPolyPnts = [];
      for (var point of lineGroup.floor[0].points){
        polyPnts.push(point);
      }
      for (var point of polyPnts){
        newPolyPnts.push({x:point.x - xMov, y:point.y - yMov});
      }
      // lineGroup.floor[0].set({points: newPolyPnts});
      lineGroup.floor[0].areaText.set({top:lineGroup.floor[0].areaText.top - yMov, left:lineGroup.floor[0].areaText.left - xMov});
    }

    createPolyFloor(lineGroup, isMoving){

      if (isMoving && lineGroup.floor == null){
        return true;
      }

      if ('floor' in lineGroup && lineGroup.floor != null && lineGroup.floor[0] != null){
        this.canvas.remove(lineGroup.floor[0].areaText);
        this.canvas.remove(lineGroup.floor[0]);
        lineGroup.floor = null;
      }

      //Here we can pull off the last text object, find the X/Y delta between new floor and old floor and then apply to text

      var polyPoints = [];
      var lefts = [];
      var tops = [];
      var groupPoints = [];

      var groupEditControls = [];

      for (var wallSegment of lineGroup._objects){
        if ('editControlsX1' in wallSegment && wallSegment.editControlsX1[0] != null){
          if (groupEditControls.indexOf(this.getObjByName(wallSegment.editControlsX1[0])) == -1){
            groupEditControls.push(this.getObjByName(wallSegment.editControlsX1[0]));
          }
        }
        if ('editControlsX2' in wallSegment && wallSegment.editControlsX2[0] != null){
          if (groupEditControls.indexOf(this.getObjByName(wallSegment.editControlsX2[0])) == -1){
            groupEditControls.push(this.getObjByName(wallSegment.editControlsX2[0]));
          }
        }
      }
      
      for (var edControl of groupEditControls){
        var pntOne = {x:edControl.left, y: edControl.top};
        if (groupPoints.indexOf(pntOne) == -1){
          lefts.push(edControl.left);
          tops.push(edControl.top);
          groupPoints.push(pntOne);
          polyPoints.push([edControl.left, edControl.top]);
        }
      }
      

      var newTop = ((Math.max(...tops) - Math.min(...tops))/2)+Math.abs(Math.min(...tops));
      var newLeft = ((Math.max(...lefts) - Math.min(...lefts))/2)+Math.abs(Math.min(...lefts));

      var newCenter = this.get_polygon_centroid(groupPoints);

      var polyCenter = polylabel([polyPoints]);

      var polyFloor = new fabric.Polygon(groupPoints, {
        top:newTop,
        left:newLeft,
        originX: 'center', 
        originY: 'center',
        wallGroup: lineGroup,
        areaType: '',
        selectable: true,
        evented:true,
        hasBorders:false,
        hasControls:false,
        hasRotatingPoint:false,
      });

      var polyArea = this.calcPolygonArea(groupPoints);

      lineGroup.polyArea = polyArea;
      lineGroup.floor = [polyFloor];
      
      var areaText = new fabric.IText(lineGroup.areaType+'\n'+polyArea.toString()+' sq. ft.', {
            fontSize: 32,
            color:'rgba(0,0,0,0.50)',
            fontFamily: 'Helvetica',
            left: polyCenter[0],
            editable: false,
            top: polyCenter[1],
            originX: 'center', 
            originY: 'center',
            selectable: false,
            hasBorders:false,
            hasControls:false,
            hasRotatingPoint:false,
            evented: false,
        });

      polyFloor.areaText = areaText;
      polyFloor.wallGroup = lineGroup;

      this.canvas.add(areaText);
      this.canvas.add(polyFloor);


      polyFloor.setGradient('fill', {
          type: 'linear',
          x1: 0,
          y1: -(polyFloor.aCoords.br.y-polyFloor.aCoords.tr.y)/2,
          x2: 0,
          y2: (polyFloor.aCoords.br.y-polyFloor.aCoords.tr.y)/2,
          colorStops: {
              0: 'rgb(204, 204, 204, 0.3)',
              1: 'rgb(114, 114, 114, 0.3)'
          }
      });

      this.canvas.sendToBack(polyFloor);
      //this.canvas.sendToBack(grid);
      //polyFloor.evented = false;
      polyFloor.setCoords();
      this.canvas.renderAll();
    }


    moveLineGroup(wall, xMov, yMov){
      //if (wall.wallGroup.floor == null){
        
      // }
      // else{
      //   this._this.movePolyFloor(wall.wallGroup, xMov, yMov);
      // }

      var editconX1 = [];
      //console.log('WALL OBJS', wall.wallGroup._objects);
      for (let lineSegment of wall.wallGroup._objects){

        if (lineSegment.type == 'path'){
          lineSegment.set({
              left: lineSegment.left - xMov/2,
              top: lineSegment.top - yMov/2,
          });
          continue;
        }
        //if (lineSegment == wall){continue;}
        var editconX2 = [];

        for (var control of lineSegment.editControlsX1){
          editconX1.push(control);
        }
        for (var control of lineSegment.editControlsX2){
          editconX1.push(control);
        }

        lineSegment.set({x1: lineSegment.x1 - xMov,
              x2: lineSegment.x2 - xMov,
              y1: lineSegment.y1 - yMov,
              y2: lineSegment.y2 - yMov,
          });

        lineSegment.setCoords();

        var editcontrolsmain = [...new Set([...editconX1, ...editconX2])];

        this._this.updateMeasurementsLine(lineSegment.measurementText, lineSegment, true);
      }

      for (var edControls of [...new Set(editconX1)]){

          var edControlObj = this._this.getObjByName(edControls);
          edControlObj.set({
                left: edControlObj.left - xMov,
                top: edControlObj.top - yMov
                //left: p.x1,
                //top: p.y1,
            });

          edControlObj.setCoords();
        }
this._this.createPolyFloor(wall.wallGroup, true);
      
      



    }

    copy(){
        var activeObj = this._this.canvas.getActiveObject();
        if (activeObj){
          if ('_objects' in activeObj){
            const clipboardGroup = activeObj._objects[0].wallGroup;
            this._this._clipboard = clipboardGroup;
          }else{
            const clipboardGroup =this._this.canvas.getActiveObject().wallGroup;
            this._this._clipboard = clipboardGroup;
          }
          
        }

    }

    paste(){
      if (this._this._clipboard == null){
        return;
      }
      const clipBoardObjs = this._this._clipboard._objects;
      this._this.canvas.deactivateAll();

      let clonedObjectOffset = 40;

      let newEditControlIds = {};
      let newLineIds = {};
      let clonedObjects = {};
      let oldObjects = {};

      let newWallGroup = new fabric.Group();
      this._this.canvas.add(newWallGroup);

      //CLONE LINES
      for (var lineSegment of clipBoardObjs){

        var newLineSegment;

        lineSegment.clone((clonedObject)=>{
          this._this.canvas.add(clonedObject);
          clonedObject.name = this._this.makeid();
          clonedObjects[lineSegment.name] = clonedObject;
          oldObjects[lineSegment.name] = lineSegment;
        });
        
      }

      //CLONE EDIT CONTROLS
      for (var lineSegment of clipBoardObjs){

        if (Object.keys(clonedObjects).indexOf(lineSegment.editControlsX1[0]) == -1){
          this._this.getObjByName(lineSegment.editControlsX1[0]).clone((clonedObject)=>{
            console.log('Cloned circle');
            this._this.canvas.add(clonedObject);
            clonedObject.name = this._this.makeid();
            clonedObjects[lineSegment.editControlsX1[0]] = clonedObject;
            oldObjects[lineSegment.editControlsX1[0]] = this._this.getObjByName(lineSegment.editControlsX1[0]);
          });
        }

        if (Object.keys(clonedObjects).indexOf(lineSegment.editControlsX2[0]) == -1){
          this._this.getObjByName(lineSegment.editControlsX2[0]).clone((clonedObject)=>{
            console.log('Cloned circle');
            this._this.canvas.add(clonedObject);
            clonedObject.name = this._this.makeid();
            clonedObjects[lineSegment.editControlsX2[0]] = clonedObject;
            oldObjects[lineSegment.editControlsX2[0]] = this._this.getObjByName(lineSegment.editControlsX2[0]);
          });
        }

        if (!(lineSegment.measurementText in Object.keys(clonedObjects))){
          this._this.getObjByName(lineSegment.measurementText).clone((clonedObject)=>{
            this._this.canvas.add(clonedObject);
            clonedObject.name = this._this.makeid();
            clonedObjects[lineSegment.measurementText] = clonedObject;
            oldObjects[lineSegment.measurementText] = this._this.getObjByName(lineSegment.measurementText);
          });
        }
        
      }


      for (var newObj of Object.keys(clonedObjects)){

          

        if (clonedObjects[newObj].type == 'circle'){
          clonedObjects[newObj].linesX1 = [clonedObjects[oldObjects[newObj].linesX1[0].name]];
          clonedObjects[newObj].linesX2 = [clonedObjects[oldObjects[newObj].linesX2[0].name]];

          clonedObjects[newObj].set({top:oldObjects[newObj].top, left:oldObjects[newObj].left});
          clonedObjects[newObj].setCoords();
        }
        if (clonedObjects[newObj].type == 'line'){
          clonedObjects[newObj].measurementText = clonedObjects[oldObjects[newObj].measurementText].name;

          clonedObjects[newObj].editControlsX1 = [clonedObjects[oldObjects[newObj].editControlsX1].name];
          clonedObjects[newObj].editControlsX2 = [clonedObjects[oldObjects[newObj].editControlsX2].name];

          clonedObjects[newObj].set({x1:oldObjects[newObj].x1, x2:oldObjects[newObj].x2, y1:oldObjects[newObj].y1, y2:oldObjects[newObj].y2});
          clonedObjects[newObj].setCoords();
        }
        clonedObjects[newObj].set({hasBorders:false, hasControls: false});
        clonedObjects[newObj].setCoords();
      }

      for (var newObj of Object.keys(clonedObjects)){
        // clonedObjects[newObj].top + clonedObjectOffset;
        // clonedObjects[newObj].left + clonedObjectOffset;
        
        if (clonedObjects[newObj].type == 'line'){
          newWallGroup.add(clonedObjects[newObj]);
          clonedObjects[newObj].wallGroup = newWallGroup;
          var newLine = clonedObjects[newObj];
          clonedObjects[newObj].wall = true;
          clonedObjects[newObj].set({x1:newLine.x1+300, x2:newLine.x2+300, y1:newLine.y1+300, y2:newLine.y2+300});

          newLine.setCoords();
          var newX1 = this._this.getObjByName(clonedObjects[newObj].editControlsX1[0]);
          newX1.set({top:newLine.y1,left:newLine.x1});
          newX1.setCoords();

          var newX2 = this._this.getObjByName(clonedObjects[newObj].editControlsX2[0]);
          newX2.set({top:newLine.y2,left:newLine.x2});
          newX2.setCoords();

          this._this.updateMeasurementsLine(newLine.measurementText, newLine, true);
        }
        

      }
      this._this.createdFloor = true;
      this._this.lastCreateArea = newWallGroup;

      this._this.createPolyFloor(newWallGroup);

      

      this._this._clipboard = null;



      this._this.canvas.renderAll();
      window.dispatchEvent(this._this.completeFloorEvent);
    

    }

    checkSwitchMode(){
      if (this._this.mode == 'drawend' && this._this.currentShape != null){
        this._this.lineControls(this._this.currentShape);
        this._this.deleteWall(this._this.currentShape);

        this._this.canvas.remove(this._this.angleText);
        this._this.angleText = null;
        this._this.canvas.remove(this._this.angleMeasurements);
        this._this.angleMeasurements = null;
        
        this._this.activeGroup = null;
        this._this.currentShape = null;
        this._this.intersectingWall = null;
        this._this.mode = "select";
        this._this.canvas.defaultCursor = 'pointer';
        this._this.mainCursor.visible = false;

        this._this.endCheckGridlines();
      } 
    }

    moveLine(p, xMov, yMov, otherGroupObjects){

      var editconX1 = [];
      var editconX2 = [];
      for (var control of p.editControlsX1){
        editconX1.push(this._this.getObjByName(control));
      }
      for (var control of p.editControlsX2){
        editconX2.push(this._this.getObjByName(control));
      }

        p.set({x1: p.x1 - xMov,
              x2: p.x2 - xMov,
              y1: p.y1 - yMov,
              y2: p.y2 - yMov,
          });
        p.setCoords();

      this._this.updateMeasurements(p.measurementText, p, false);

      for (var edControls of editconX1){
        if (p.type == 'path'){
          edControls.set({
              left: p.path[0][1],
              top: p.path[0][2]
              //left: p.x1,
              //top: p.y1,
          });
        }
        else{

        edControls.set({
              left: edControls.left - xMov,
              top: edControls.top - yMov
              //left: p.x1,
              //top: p.y1,
          });
        }

        
      }
      edControls.setCoords();

      for (var edControls of editconX2){
        edControls.set({
              left: edControls.left - xMov,
              top: edControls.top - yMov
              //left: p.x2,
              //top: p.y2,
          });
        edControls.setCoords();
      }

      for (var conLine of editconX1[0].linesX2){
        if (conLine != undefined && conLine != null){
          conLine.set({
              x2: conLine.x2 - xMov,
              y2: conLine.y2 - yMov
          });
          conLine.setCoords();
          this._this.updateMeasurementsLine(conLine.measurementText, conLine, true);
        }
      }

      for (var conLine of editconX2[0].linesX1){
        if (conLine != undefined && conLine != null){
          conLine.set({
              x1: conLine.x1 - xMov,
              y1: conLine.y1 - yMov
          });
          conLine.setCoords();
          this._this.updateMeasurementsLine(conLine.measurementText, conLine, false);
        }
      }
      
      this._this.createPolyFloor(p.wallGroup);
      this._this.canvas.renderAll();
    }

    init(canvasId, sizeX, sizeY) {
        this.canvas = new fabric.Canvas(canvasId, {
            selection: false,
            height: window.innerHeight-80,
            width: window.innerWidth-350
        });
        this.canvas.preserveObjectStacking = true;
        this._this = this;
        this.canvas.defaultCursor = 'none';
        this.canvas.skipOffscreen = true;
        this.canvas.selection = false;

        

        fabric.Object.prototype.originX = fabric.Object.prototype.originY =
            "center";

        fabric.Group.prototype.lockScalingX = true;
        fabric.Group.prototype.lockScalingY = true;

        fabric.Group.prototype.lockUniScaling = true;
        fabric.Group.prototype.hasControls = false;
        fabric.Group.prototype.hasBorders = false;

        fabric.util.addListener(this.canvas.upperCanvasEl, 'dblclick', (e) => {
          if (this.canvas.findTarget(e)){
            var foundObj = this.canvas.findTarget(e);
            if (foundObj != null && 'points' in foundObj){
              this.createdFloor = true;
              this.lastCreateArea = foundObj.wallGroup._objects[0].wallGroup;
            }
          }
        });


        var grid = 24;
        this.createPen();

        // create grid
        for (var i = 0; i < 6000 / grid; i++) {
          if (i == 125){
            this.canvas.add(
                  new fabric.Line([i * grid, 0, i * grid, 6000], {
                      stroke: "red",
                      strokeWidth: 1,
                      selectable: false,
                      isGrid: true,
                      evented: false
                  })
              );
              this.canvas.add(
                  new fabric.Line([0, i * grid, 6000, i * grid], {
                      stroke: "green",
                      strokeWidth: 1,
                      selectable: false,
                      evented: false,
                      isGrid: true
                  })
              );

              var midX = 3000-this.canvas.width*1.4;
              var midY = 3000-this.canvas.height*1.5;
              var startVpt = new fabric.Point(midX, midY);
              this.canvas.absolutePan(startVpt);
              this.canvas.setZoom(this.canvas.getZoom() / 3);
          }
          else{
            if (i % 10 === 0){
              this.canvas.add(
                  new fabric.Line([i * grid, 0, i * grid, 6000], {
                      stroke: "#ccc",
                      strokeWidth: 2,
                      selectable: false,
                      isGrid: true,
                      evented: false
                  })
              );
              this.canvas.add(
                  new fabric.Line([0, i * grid, 6000, i * grid], {
                      stroke: "#ccc",
                      strokeWidth: 2,
                      selectable: false,
                      evented: false,
                      isGrid: true
                  })
              );

            }else{
              this.canvas.add(
                  new fabric.Line([i * grid, 0, i * grid, 6000], {
                      stroke: "#ccc",
                      selectable: false,
                      isGrid: true,
                      evented: false
                  })
              );
              this.canvas.add(
                  new fabric.Line([0, i * grid, 6000, i * grid], {
                      stroke: "#ccc",
                      selectable: false,
                      evented: false,
                      isGrid: true
                  })
              );
            }
          }
      }

        //WALL FUNCTIONS

        this.canvas.perPixelTargetFind = true;
        this.canvas.targetFindTolerance = 4;

        document.getElementById("drawWalls").addEventListener("click", () => {
            this.drawWalls();
            this.mainCursor.visible = true;
        });

        document.getElementById("delWalls").addEventListener("click", () => {
            this.checkSwitchMode();
            this.deleteMode();
            this.canvas.defaultCursor = 'pointer';
            this.mainCursor.visible = false;
        });

        document.getElementById("curveWalls").addEventListener("click", () => {
            this.checkSwitchMode();
            this.curveMode();
        });

        document.getElementById("selectMode").addEventListener("click", () => {
            this.checkSwitchMode();
            this.mode = "select";
            this.canvas.defaultCursor = 'default';
            this.mainCursor.visible = false;
        });

        document.getElementById("panMode").addEventListener("click", () => {
            this.checkSwitchMode();
            this.mode = "panning";
            this.canvas.defaultCursor = 'pointer';
            this.mainCursor.visible = false;
        });

        document.getElementById("sketch-zoom-out").addEventListener("click", () => {

            this.canvas.setZoom(this.canvas.getZoom() / 1.25);
        });

        document.getElementById("sketch-zoom").addEventListener("click", () => {
            this.canvas.setZoom(this.canvas.getZoom() * 1.25);
        });

        document.getElementById("addLabel").addEventListener("click", () => {
            this.checkSwitchMode();
            this.Addtext();
        });

        /*document.getElementById("saveFP").addEventListener("click", () => {
            this.saveCanvas();
        });*/

        this.canvas.on("before:selection:cleared", function(e){
          this._this.singleLineSelect = e.target;
          if (e.target != null){
            if ('_objects' in e.target){
                for (var selectedObj of e.target._objects){
                  if (!('wall' in selectedObj)){
                  }else{
                    selectedObj.set("stroke", "#595959");
                    this._this.canvas.renderAll();
                  }
                }
            }
            else if (e.target.type == 'line'){
              e.target.set("stroke", "#595959");
              for (var selectedObj of e.target.wallGroup._objects){
                    selectedObj.set("stroke", "#595959");
                    this._this.canvas.renderAll();
              }
            }
          }
        });

        this.canvas.on("object:selected", function(e) {
            this._this.isDirty = true;
            var objType = e.target.get("type");

            if (objType == "line") {
                this._this.singleLineSelect = e.target;
                if(this._this.mode == "select" && e.target != null && 'wallGroup' in e.target){
                  for (var wallSegment of e.target.wallGroup._objects){
                    wallSegment.set("stroke", "rgba(0,0,255,0.6)");
                  }
                  this._this.canvas.setActiveObject(e.target.wallGroup);
                } 
                this.renderAll();
            }
            if ('points' in e.target){
                if(this._this.mode == "select" && e.target != null && 'group' in e.target){
                  for (var wallSegment of e.target.wallGroup._objects){
                    wallSegment.set("stroke", "rgba(0,0,255,0.6)");
                  }
                  this._this.canvas.setActiveObject(e.target.wallGroup._objects[0].wallGroup);
                } 
                this.renderAll();
            }
        });

        this.canvas.on('selection:created',function(ev){
            ev.target.set({
                lockScalingX: true,
                lockScalingY: true
            });
        });

        this.canvas.on("object:modified", function(e) {
            this._this.isDirty = true;
            var objType = e.target.get("type");
            
            if (objType == "circle") {
              //console.log(e.target, e.target.lines);
              //console.log('Has',e.target.lines.length, 'lines');
              for (var wall of e.target.linesX2){
                if (wall != undefined && wall != null){
                  wall.set('stroke', '#595959');
                }
              }
              for (var wall of e.target.linesX1){
                if (wall != undefined && wall != null){
                  wall.set('stroke', '#595959');
                }
              }
            }
        });

        this.canvas.on("object:scaling", function(e) {
            this._this.isDirty = true;
            $(".deleteBtn").remove();
        });

        this.canvas.on("object:moving", function(e) {
            this._this.isDirty = true;
            $(".deleteBtn").remove();

            

            if ('points' in e.target){
              console.log('MOVING polygon');
              this._this.moveLineGroup(e.target.wallGroup._objects[0], this._this.canvasMousePosXDelta*3, this._this.canvasMousePosYDelta*3);
            }
            else if (e.target.type == "line" || e.target.type == "path") {
                console.log('moving line group');
                

                this._this.moveLineGroup(e.target, this._this.canvasMousePosXDelta*3, this._this.canvasMousePosYDelta*3);
                  
            }
            else{
              var p = e.target;
              var objType = p.get("type");
              if (objType == "circle" && e.target.curvePoint == null) {
                //console.log(e.target);
                  var wallGroup = null;
                      for (var line of p.linesX1){
                        if (line != undefined && line != null){
                            wallGroup = line.wallGroup;
                            //line.set('stroke', 'green');
                            
                            line.set({
                                x1: p.left,
                                y1: p.top
                            });
                            
                            this._this.updateMeasurements(line.measurementText, line, true);
                        }
                          line.setCoords();
                      }
                      for (var line of p.linesX2){
                        if (line != undefined && line != null){
                            wallGroup = line.wallGroup;
                            //line.set('stroke', 'red');
                            line.set({
                                x2: p.left,
                                y2: p.top
                            });
                            this._this.updateMeasurements(line.measurementText, line, false);
                            line.setCoords();
                        }
                          
                      }

                  if (wallGroup != null && 'floor' in wallGroup && wallGroup.floor != null){
                    this._this.createPolyFloor(wallGroup);
                  }
                  this.renderAll();

              } 
          }
    
        });
        document.removeEventListener("keydown", function(event) {}, true);

        var thisRef = this._this;

        document.addEventListener("keydown", (event) => {
            this._this.isDirty = true;

            //Starting to line draw
            if (event.key == 'Enter') {
              switch(this._this.mode){
                case "drawstart":
                  this._this.startLineDraw();
                  break;
                case "drawend":
                  if (this._this.intersectingWall != null){
                    var line_group_ref = 'linesX1' in this._this.intersectingWall && this._this.intersectingWall.linesX1.length > 0 ? this._this.intersectingWall.linesX1 : this._this.intersectingWall.linesX2;
                    if (line_group_ref[0].wallGroup == this._this.activeGroup){
                      this._this.connectFinalWall();
                    }
                  }
                  else{
                    this._this.endLineDraw();
                  }
                  break;
              }
            }
            else{

              //COPY AND PASTE
              if (event.keyCode == 67) {
                this._this.copy();
              }

              if (event.keyCode == 86) {
                this._this.paste();
              }

              if (this._this.mode == "drawend" && this._this.currentShape != null){      
                    if (event.key == 'Escape'){
                        this._this.lineControls(this._this.currentShape);
                        this._this.deleteWall(this._this.currentShape);

                        this._this.canvas.remove(this._this.angleText);
                        this._this.angleText = null;
                        this._this.canvas.remove(this._this.angleMeasurements);
                        this._this.angleMeasurements = null;
                        
                        this._this.activeGroup = null;
                        this._this.currentShape = null;
                        this._this.intersectingWall = null;
                        this._this.mode = "select";
                        this._this.canvas.defaultCursor = 'pointer';
                        this._this.mainCursor.visible = false;

                        this._this.endCheckGridlines();
                    }
              }

              if (event.key == 'Backspace') {
                  if (this._this.mode == 'select'){

                    if (this._this.singleLineSelect != null){
                      this._this.deleteWall(this._this.singleLineSelect);
                      this._this.singleLineSelect = null;
                    }
                    
                    try{
                      const activeObjects = this._this.canvas.getActiveGroup().getObjects();
                      this._this.canvas.deactivateAll().renderAll();
                      for (var groupObjs of activeObjects){
                        if ('wall' in groupObjs){
                          this._this.deleteWall(groupObjs);
                        }
                      }
                    }
                    catch(e){
                      if (this._this.canvas.getActiveObject()){

                        if ('wall' in this._this.canvas.getActiveObject()){
                          console.log(1);
                          this._this.deleteWall(this._this.canvas.getActiveObject());
                        }
                        else if ('wallGroup' in this._this.canvas.getActiveObject()){
                          for (var wall in this._this.canvas.getActiveObject().wallGroup._objects){
                            this._this.deleteWall(wall, false, true);
                          }
                          this._this.removePolyFloor(this._this.canvas.getActiveObject());
                        }

                        else{
                          console.log(3);
                          if (this._this.canvas.getActiveObject().isEditing == null || this._this.canvas.getActiveObject().isEditing == false){
                            this._this.canvas.remove(this._this.canvas.getActiveObject());
                          }
                        }

                      }
                    }
                    
                  }

              }

              if (this._this.mode == "drawstart" || this._this.mode == "drawend") {
                  const isNumber = isFinite(event.key);
                  let hotkeyLength = 24;
                  if(isNumber){
                    if (this._this.drawNumberInches){
                      this._this.drawInches = parseInt(event.key.toString());
                      console.log(this._this.drawNumberKey, '.'+this._this.drawInches.toString());
                    }
                    else{
                      if (this._this.drawNumberKey == null) {
                          this._this.drawNumberKey = parseInt(event.key);
                          console.log(this._this.drawNumberKey);
                      }else {
                          this._this.drawNumberKey = parseInt(this._this.drawNumberKey.toString() + event.key.toString());
                          console.log(this._this.drawNumberKey);
                      }
                    }
                    
                  }

                  if(event.key == '.'){
                    this._this.drawNumberInches = true;
                  }

                  switch (event.keyCode) {
                      case 37:
                          //drawDirection = 'left';
                          //Left
                          hotkeyLength = this._this.drawNumberKey == null ? 24 : this._this.drawNumberKey*24;
                          var inchesLength = this._this.drawInches == null ? 0 : this._this.drawInches*2;
                          if (this._this.drawInches != null && hotkeyLength == 24 && this._this.drawNumberKey == null){
                            hotkeyLength = 0;
                          }

                          this._this.correctedMouseX = this._this.correctedMouseX - hotkeyLength - inchesLength;
                          this._this.updatePen();
                          this._this.drawInches = null;
                          this._this.drawNumberInches = false;
                          break;
                      case 38:
                          //drawDirection = 'up';
                          hotkeyLength = this._this.drawNumberKey == null ? 24 : this._this.drawNumberKey*24;
                          var inchesLength = this._this.drawInches == null ? 0 : this._this.drawInches*2;
                          if (this._this.drawInches != null && hotkeyLength == 24 && this._this.drawNumberKey == null){
                            hotkeyLength = 0;
                          }

                          this._this.correctedMouseY = this._this.correctedMouseY - hotkeyLength - inchesLength;
                          this._this.updatePen();
                          this._this.drawInches = null;
                          this._this.drawNumberInches = false;
                          //this._this.updateDrawMovement();
                          break;
                      case 39:
                          //drawDirection = 'right';
                          hotkeyLength = this._this.drawNumberKey == null ? 24 : this._this.drawNumberKey*24;
                          var inchesLength = this._this.drawInches == null ? 0 : this._this.drawInches*2;
                          if (this._this.drawInches != null && hotkeyLength == 24 && this._this.drawNumberKey == null){
                            hotkeyLength = 0;
                          }

                          this._this.correctedMouseX = this._this.correctedMouseX + hotkeyLength + inchesLength;
                          this._this.updatePen();
                          this._this.drawInches = null;
                          this._this.drawNumberInches = false;
                          //this._this.updateDrawMovement();
                          break;
                      case 40:
                          //drawDirection = 'down';
                          hotkeyLength = this._this.drawNumberKey == null ? 24 : this._this.drawNumberKey*24;
                          var inchesLength = this._this.drawInches == null ? 0 : this._this.drawInches*2;
                          if (this._this.drawInches != null && hotkeyLength == 24 && this._this.drawNumberKey == null){
                            hotkeyLength = 0;
                          }

                          this._this.correctedMouseY = this._this.correctedMouseY + hotkeyLength + inchesLength;
                          this._this.updatePen();
                          this._this.drawInches = null;
                          this._this.drawNumberInches = false;
                          //this._this.updateDrawMovement();
                          break;
                  }
                  if (this._this.currentShape != null){
                    this._this.mode = 'drawend';
                    console.log('Updating draw movement');
                    this._this.updateDrawMovement();
                  }
              }
            }

        });

        this.canvas._this = this;

        this.canvas.on("object:rotating", function(e) {
            $(".deleteBtn").remove();
        });

        this.canvas.on("mouse:over", function(e) {
            if(this._this.mode == "select" && e.target != null && 'points' in e.target){
              for (var wallSegment of e.target.wallGroup._objects){
                wallSegment.set("stroke", "rgba(0,0,255,0.6)");
              }
              e.target.set({opacity:0.8});
            } 

            //Curve Mode
            if (e.target != null && e.target.wall == true && this._this.mode == 'curve') {
              e.target.set("stroke", "rgba(0,0,255,0.6)");
              e.target.set("strokeDashArray", [10, 10]);
            }

            if (e.target != null && e.target.wall == true) {
                if (this._this.mode == "delete") {
                    // currentObj = e.target;
                    e.target.set("stroke", "red");
                }

                if (this._this.mode == "select") {
                    // currentObj = e.target;
                    e.target.set("stroke", "rgba(0,0,255,0.6)");
                }
            } else if (e.target != null && e.target.type == "image") {
                if (this._this.mode == "delete") {
                    $("body").css("cursor", "no-drop");
                }
            } else {
                $("body").css("cursor", "default");
            }

            if (e.target != null){
              if (this._this.mode == 'drawstart' && e.target.type =='circle'){
               e.target.set("fill", "green");
              }
            }

            if(this._this.mode == "select" && e.target != null && 'wallGroup' in e.target){
              for (var wallSegment of e.target.wallGroup._objects){
                wallSegment.set("stroke", "rgba(0,0,255,0.6)");
              }
            } 

            this.renderAll();
        });

        this.canvas.on("mouse:out", function(e) {
          
            if (e.target != null){
              if ('wallGroup' in e.target){
                if (this._this.canvas.getActiveObject() != null){
                  if (e.target.wallGroup != this._this.canvas.getActiveObject()){
                    for (var wallSegment of e.target.wallGroup._objects){
                      wallSegment.set("stroke", "#595959");
                    }
                  }
                }
                else{
                  for (var wallSegment of e.target.wallGroup._objects){
                    wallSegment.set("stroke", "#595959");
                  }
                }
              }
              else{

              }
            }

            if (e.target != null && e.target.wall == true && this._this.mode == 'curve') {
              e.target.set("stroke", "#595959");
              e.target.set("strokeDashArray", null);
            }

            if(this._this.mode == "select" && e.target != null && e.target.type == 'polygon'){
              for (var wallSegment of e.target.wallGroup._objects){
                wallSegment.set("stroke", "#595959");
              }
              e.target.set({opacity:1});
            }

            

            this.renderAll();
        });

        this.canvas.on("mouse:move", function(event) {


            if (this._this.canvasMousePosX == null){
              this._this.canvasMousePosX = event.e.clientX;
              this._this.canvasMousePosY = event.e.clientY;

            }

            //This is a group and we need to only select the walls
            this._this.canvasMousePosXDelta = this._this.canvasMousePosX - event.e.clientX;
            this._this.canvasMousePosYDelta = this._this.canvasMousePosY - event.e.clientY;


            
            var pos = this.getPointer(event.e);
            this._this.globmousePos = pos;

            var gridspace = 24;
            // assume mouseX, mouseY are mouse coords.
            this._this.MouseoffsetX = this._this.globmousePos.x % gridspace;
            this._this.MouseoffsetY = this._this.globmousePos.y % gridspace;

            if (this._this.mainCursor != null){
              this._this.correctedMouseX = this._this.globmousePos.x-this._this.MouseoffsetX;
              this._this.correctedMouseY = this._this.globmousePos.y-this._this.MouseoffsetY;

              this._this.mainCursor.set({top:this._this.correctedMouseY, left:this._this.correctedMouseX});
              this._this.mainCursor.setCoords();
              this._this.canvas.bringToFront(this._this.mainCursor)
            }
            this.renderAll();

            if (this._this.mode == 'panning' && this._this.panning && event && event.e) {
                var units = 10;
                var delta = new fabric.Point(event.e.movementX, event.e.movementY);
                this._this.canvas.relativePan(delta);
            }

            if (this._this.mode == "drawstart"){
              this._this.snapToPoint();
              this._this.checkIntersection();
              this._this.checkGridlines();
              this._this.checkCursorIsOnScreen();
            }

            if (this._this.mode === "drawend" && this._this.currentShape) {
              this._this.snapToPoint();
                var points = this._this.currentShape;
                this._this.checkCursorIsOnScreen();

                this._this.currentShape.set({
                    x2: this._this.correctedMouseX,
                    y2: this._this.correctedMouseY
                });


                this._this.currentShape.setCoords();

                this._this.checkIntersection();

                let measurement = this._this.currentShape.measurementText;
                this._this.updateMeasurements(measurement, this._this.currentShape);

                this._this.updateAngleGizmo();
                
                this._this.checkGridlines();
                this.renderAll();
            }

            if (this._this.mode === "editcurve"){
              this._this.convertToCurved(
                    this._this.currentCurve,
                    this._this.correctedMouseX,
                    this._this.correctedMouseY,
                    null
                );
          }

          this._this.canvasMousePosX = event.e.clientX;
          this._this.canvasMousePosY = event.e.clientY;

        });


        this.canvas.on("mouse:up", function(event) {
            if (this._this.panning == true){
              var canvasobj = this._this.canvas.getObjects();
              for (var i = 0, len = canvasobj.length; i < len; i++) {
              if(canvasobj[i].type == 'line'){
                canvasobj[i].setCoords();
              }}
            }
            this._this.panning = false;
        });

        let x = null;

        this.canvas.on("mouse:down", function(event) {
            // console.log("called", this, this._this)

            

            if (this._this.mode == "panning") {
              
                if (event.target == null) {
                    //this._this.deselectAll();
                    this._this.panning = true;
                } else {
                    /*this._this.currentObj = event.target;
                    if (this._this.currentObj.line1) {
                        this._this.currentObj = this._this.currentObj.line1;
                    }*/
                }
            }

            if (this._this.mode == "delete") {
                if (event.target != undefined) {
                    this._this.isDirty = true;
                    if (event.target.wall == true) {
                        this._this.deleteWall(event.target);
                    } else if (
                        event.target != null &&
                        (event.target.type == "image" ||
                            event.target.type == "text" ||
                            event.target.type == "i-text")
                    ) {
                        this.remove(event.target);
                    }
                }
            }

            if (this._this.mode == "editcurve") {
                this._this.mode = "select";
                this._this.canvas.defaultCursor = 'pointer';
                this._this.mainCursor.visible = false;
            }

            if (this._this.mode == "curve") {
                if (event.target != undefined) {
                    if (event.target.wall == true) {
                        this._this.isDirty = true;
                        event.target.set({selectable:true});
                        this._this.convertToCurved(event.target, null, null, null);
                    }
                }
            }

            

            /*if (!this.getActiveObject()) {
                $(".deleteBtn").remove();
            }*/

            if (this._this.mode === "drawstart") {

                if (this._this.intersectingWall != null && this._this.intersectingWall.type == 'circle'){

                  this._this.activeGroup = this._this.getControlGroup(this._this.intersectingWall);
                  this._this.continuingControl = this._this.intersectingWall;
                  console.log('CONTINUING');
                  //this._this.continuingCircle = this._this.intersectingWall;
                  this._this.startLineDraw();
                }else{
                  this._this.startLineDraw();
                }
                
                
            } else if (
                this._this.mode === "drawend" &&
                this._this.currentShape &&
                this._this.currentShape.type === "line"
            ) {
                
                
                if (this._this.intersectingWall != null){

                  var line_group_ref = 'linesX1' in this._this.intersectingWall && this._this.intersectingWall.linesX1.length > 0 ? this._this.intersectingWall.linesX1 : this._this.intersectingWall.linesX2;
                  if (line_group_ref[0].wallGroup == this._this.activeGroup){
                    this._this.connectFinalWall();
                    // this.canvas.bringToFront(this.getObjByName(this._this.intersectingWall.editControlsX1[0]));
                    // this.canvas.bringToFront(this.getObjByName(this._this.intersectingWall.editControlsX2[0]));
                  }
                }else{

                  this._this.endLineDraw();
                }
                
            }
        });
    }
}