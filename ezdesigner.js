var activeTable;
var activeComp;
var canvas;
var dialog;
var tables = [];
var gRelations = [];
var gx, gy;
var canvasWidth = 10000;
var canvasHeight = 10000;
var vbx = vby = 0;
var backgroundRect;

  var orig_x,orig_y,orig_width,orig_height;
  var curorig_x,curorig_y,curorig_width,curorig_height;
  var midx, midy;
  var zoomfactor = 1.25;
  var zoom = 1;


    $(document).ready(function(){
      var guiheight = $("#ezd-gui").height();

      $("#ezd-graph").dblclick(Reset);
      $("#ezd-graph").draggable({helper: function() {return $("<div>");},
        start: function(){
          panx = curorig_x;
          pany = curorig_y;
        }, 
        drag: function(e, ui) {
          if (isdragging) return;
          var dx = ui.position.left - ui.originalPosition.left;
          var dy = ui.position.top - ui.originalPosition.top;
          curorig_x = panx - dx*getZoom();
          curorig_y = pany - dy*getZoom();
          canvas.setViewBox(curorig_x, curorig_y, curorig_width, curorig_height);
        },
        stop: function(){
          CalcMidPoint();
        }, 

      });

      $("#ezd-graph").bind("mousewheel", function(event){
        event.preventDefault();
        var delta = event.wheelDelta > 0 ? 1 : -1;
        if (delta == 1) ZoomIn(); else ZoomOut();
      });

      dialog = $("#ezd-dialog");
      $("#ezd-dialog").dialog();
      $("#ezd-dialog").dialog("close");

      buildComponents();
      var w = $(".component").length * $(".component").eq(0).outerWidth(true);
      $("#ezd-components > div").width(w);

    	$("#ezd-slide").slider({
        min: 0.2,
        max: 3,
        step: 0.1,
        value: 1,
        start:function(){},
        stop:function(){},
        slide: function(event, ui) {
          if ($(this).slider("option","value") > ui.value) 
            ZoomOut();
          else
            ZoomIn();
        }
    	});
      canvas = new Raphael("ezd-graph");
      canvas.setViewBox(0, 0, $("#ezd-graph").width(), $("#ezd-graph").height());
      curorig_x = orig_x = 0;
      curorig_y = orig_y = 0;
      curorig_width = orig_width = $("#ezd-graph").width();
      curorig_height = orig_height = $("#ezd-graph").height();
      CalcMidPoint();

      $(".todrop").draggable({
        revert: true,
        helper: "clone", 
        opacity: 0.5
      });
      $("#ezd-graph-container").droppable({
        drop: function(event, ui) {
          var xx = (event.pageX - $("#ezd-graph").offset().left)*getZoom() + curorig_x;
          var yy = (event.pageY - $("#ezd-graph").offset().top)*getZoom() + curorig_y;
          if (ui.draggable.hasClass("table")) {
            var t = new Table(canvas);
            t.setPosition(xx, yy);
          }
          else if (ui.draggable.hasClass("component")) {
            for (var i = 0; i < tables.length; i++) {
              if(tables[i].contains(xx, yy)) {
                var compName = ui.draggable.attr("data-component");
                var comp = getComponentDescription(compName);
                var compObject = CF(comp);
  	            activeComp = compObject;
  	            var table = tables[i];
  	            activeTable = table;
  	            
  	            dialog.empty();
  	            dialog.dialog("open");
  	            dialog.dialog("option", "title", "Add new component");
  	            dialog.dialog("option", "buttons", {OK: addComp, Cancel: function() {dialog.dialog("close")}});
  	            dialog.append("<span>Component name: <input id='table-name'></span>");
              }
            }
          }
        }
      });
  
//      $("#ezd-graph").draggable({        drag: function(){c(222)}      });

      $("#ezd-load").click(function(){
        var jsontext = $("#ezd-json").val();
        var obj = $.parseJSON(jsontext);
        load(obj);
      });
      $("#ezd-save").click(function(){
        var saveddata = {tables: [], relations: []};
        for (var i = 0; i < tables.length; i++) {
          saveddata.tables.push(tables[i].toJSON());
        }
        for (var i = 0; i < gRelations.length; i++) {
          saveddata.relations.push(gRelations[i].toJSON());
        }
        $("#ezd-json").html(JSON.stringify(saveddata, null, 2));
      });
      $("#ezd-json").html(JSON.stringify(loadjson, null, 2));

    });


    function load(json) {
      kkk = 0;
      canvas.clear();
      //initBackgroundRect();
      tables = [];
      gRelations = [];
      for (var i = 0; i < json.tables.length; i++) {
        var table = json.tables[i];
        Table.fromJSON(table);
      }
      for (var i = 0; i < json.relations.length; i++) {
        var r = new Relation(json.relations[i], getTable(json.relations[i].src), getTable(json.relations[i].dst));
        r.reposition();
        r.repositionTexts();
        for (var j = 0; j < json.relations[i].params.length; j++) {
          if (json.relations[i].params[j].type == "list" || json.relations[i].params[j].type == "relationship") 
            r.params[j].setValue(json.relations[i].params[j].selectedValue);
          else 
            r.params[j].setValue(json.relations[i].params[j].value);
        }
      }
    }

    function getTable(id) {
      for (var i = 0; i < tables.length; i++) {
        if (tables[i].__id__ == id)
          return tables[i];
      }
    }

    function addComp() {
      activeTable.addComponent(activeComp, $("#ezd-table-name").val());
      activeTable = null;
      activeComp = null;
      dialog.dialog("close");
      dialog.dialog("option", "buttons", {});
    }

    function getComponentDescription(name) {
      for (var i = 0; i < components.length; i++) {
        if (components[i].name == name)
          return components[i];
      }
      return null;
    }

    function buildComponents() {
      var t = $('<div class="todrop table">New Table</div>');
      $("#ezd-new-table").append(t);

      for (var i = 0; i < components.length; i++) {
        var t = $('<div class="todrop component" data-component="' + components[i].name + '"><img src="' + components[i].url + '" class="component-icon">' + components[i].name + '</div>');
        $("#ezd-components > div").append(t);
      }
    }











    var isdragging = false;
    var panx = pany = 0;
    var difx = dify = 0;

    function getZoom() {
      return zoom;
    }
    function CalcMidPoint() {
      midx = curorig_x+(curorig_width/2);
      midy = curorig_y+(curorig_height/2);
    }
    function ZoomIn() {
      zoom /= zoomfactor;
      curorig_width/=zoomfactor;
      curorig_height/=zoomfactor;
      curorig_x = midx - (curorig_width/2);
      curorig_y = midy - (curorig_height/2);
      canvas.setViewBox(curorig_x, curorig_y, curorig_width, curorig_height);
    }
    function ZoomOut() {
      zoom *= zoomfactor;
      curorig_width*=zoomfactor;
      curorig_height*=zoomfactor;
      curorig_x = midx - (curorig_width/2);
      curorig_y = midy - (curorig_height/2);
      canvas.setViewBox(curorig_x, curorig_y, curorig_width, curorig_height);
      CalcMidPoint();
    }
    function Reset() {
      curorig_x = orig_x;
      curorig_y = orig_y;
      curorig_width = orig_width;
      curorig_height = orig_height;
      zoom = 1;
      canvas.setViewBox(curorig_x, curorig_y, curorig_width, curorig_height);
      CalcMidPoint();
    }

