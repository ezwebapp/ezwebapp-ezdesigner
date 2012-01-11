/*
 * EZDesigner - A jQuery & Raphael database designer for EZWebapp
 * Copyright (C) 2011-2012  EZWebapp.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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

var interactivityMode = "normal"; // "relations"

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
          activeTable = null;
        },

      });

      $("#ezd-graph").bind("mousewheel", function(event){
        event.preventDefault();
        var delta = event.originalEvent.wheelDelta > 0 ? 1 : -1;
        if (delta == 1) ZoomIn(); else ZoomOut();
      });

      dialog = $("#ezd-dialog");
      dialog.keyup(function(e){
        if (e.keyCode == 13) {
          $(this).closest(".ui-dialog").find("button").each(function(){
            if($(this).find(".ui-button-text").html() == "OK") {
              $(this).click();
            }
          });
        }
      });
      $("#ezd-dialog").dialog();
      dialog.dialog("option", "buttons", {OK: addComp, Cancel: function() {dialog.dialog("close")}});
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
          var xx = (event.originalEvent.pageX - $("#ezd-graph").offset().left)*getZoom() + curorig_x;
          var yy = (event.originalEvent.pageY - $("#ezd-graph").offset().top)*getZoom() + curorig_y;
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
                dialog.dialog("option", "title", "Component params: " + activeComp.title);
                dialog.dialog("option", "buttons", {});
                dialog.dialog("option", "buttons", {OK: function() {
                  activeTable.addComponent(activeComp);
                  activeTable = null;
                  activeComp = null;
                  dialog.dialog("close");
                }, Cancel: function(){dialog.dialog("close")}});
                dialog.append(activeComp.getElement());
                dialog.find("input").eq(0).focus();
  	            dialog.dialog("open");
              }
            }
          }
        }
      });

      $("#ezd-load").click(function(){
	$.ajax({ type: 'POST', url: '/webapp/loadSchema', data: ({ id: $(this).attr('rel') }), success: load });
        //var jsontext = $("#ezd-json").val();
        //var obj = $.parseJSON(jsontext);
        //load(obj);
      });
      $("#ezd-save").click(function(){
        var saveddata = {tables: [], relations: []};
        for (var i = 0; i < tables.length; i++) {
          saveddata.tables.push(tables[i].toJSON());
        }
        for (var i = 0; i < gRelations.length; i++) {
          saveddata.relations.push(gRelations[i].toJSON());
        }
	$.ajax({ type: 'POST', url: '/webapp/saveSchema', data: ({ id: $(this).attr('rel'), schema: JSON.stringify(saveddata, null, 2) }), success: function() { alert('Schéma sauvegardé avec succès'); } });
        //$("#ezd-json").html(JSON.stringify(saveddata, null, 2));
      });
      $.ajax({ type: 'POST', url: '/webapp/loadSchema', data: ({ id: $("#ezd-load").attr('rel') }), success: load });
      //$("#ezd-json").html(JSON.stringify(loadjson, null, 2));
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
    function getRelation(id) {
      for (var i = 0; i < gRelations.length; i++) {
        if (gRelations[i].__id__ == id)
          return gRelations[i];
      }
    }

    function addComp() {
      activeTable.addComponent(activeComp, $("#ezd-table-name").val());
      activeTable = null;
      activeComp = null;
      dialog.dialog("close");
    }

    function getComponentDescription(name) {
      for (var i = 0; i < components.length; i++) {
        if (components[i].name == name)
          return components[i];
      }
      return null;
    }

    function buildComponents() {
      var t = $('<div class="todrop table component"><img src="/images/table.png" class="component-icon" /><span>New table</span></div>');
      $("#ezd-new-table").append(t);
      var r = $('<div class="todrop ezd-relationship component"><img src="/images/relation.png" class="component-icon" /><span>New relation</span></div>');
      $("#ezd-relationship").append(r);
      r.click(function(){
        toggleMode();
      });

      for (var i = 0; i < components.length; i++) {
        var t = $('<div class="todrop component" data-component="' + components[i].name + '"><img src="' + components[i].url + '" class="component-icon"><span>' + components[i].name + '</span></div>');
        $("#ezd-components > div").append(t);
      }
    }

    function toggleMode() {
      interactivityMode = interactivityMode == "normal" ? "relations" : "normal";
      $("#ezd-relationship .ezd-relationship").toggleClass("active");
      for (var i = 0; i < tables.length; i++) {
        tables[i].rect.attr("stroke-width", Table._tableRectDefStrokeWidth);
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
