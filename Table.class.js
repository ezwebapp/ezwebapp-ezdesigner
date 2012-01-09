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

var Table = Class.extend({
  init: function(canvas) {
    this.__class__ = "Table";
    this.params = [];
    for (var i = 0; i < tableParams.length; i++) {
      this.params.push(PF(tableParams[i]));
    }
    this.params[0].table = this;
    this.params[0].setValue = function(val) {
      this.desc.value = val;
      this.table.text.attr("text", val);
    }
    tables.push(this);
    this.helper = canvas.rect(0,0,1,1).attr("fill", "grey").attr("opacity", 0.8).hide();
    this.rect = canvas.rect(Table._tableRectXOffset, Table._tableRectYOffset, Table._tableRectDefWidth, Table._tableRectDefHeight);
    this.rect.attr("fill", Table._tableRectDefColour);
    this.rect.attr("stroke", Table._tableRectDefStrokeColour);
    this.rect.attr("stroke-width", Table._tableRectDefStrokeWidth);

    this.headerRect = canvas.rect(0, 5, Table._tableRectDefWidth-5, Table._tableRectDefHeight, 3);
    this.headerRect.attr("fill", Table._headerRectDefBackground);
    this.headerRect.attr("stroke", Table._headerRectDefStrokeColour);
    this.headerRect.attr("stroke-width", Table._headerRectDefStrokeWidth);


    var clickInRelationshipMode = function(table){
      if (interactivityMode == "relations" && !isdragging) {
        if (typeof activeTable == "undefined" || activeTable == null) {
          activeTable = table;
          activeTable.rect.attr("stroke-width", 3);
        }
        else {
          var r = new Relation(relations[0], table, activeTable);
          toggleMode();
          r.reposition();
          r.repositionTexts();
          activeTable = null;
        }
      }
    };

    this.rect.click(function(){clickInRelationshipMode(this.parent)});
    this.headerRect.click(function(){clickInRelationshipMode(this.parent)});

    this.closeX = canvas.path("");
    this.closeX.attr({"stroke": Table._closeXStrokeColour, "stroke-width": Table._closeXStrokeWidth, "fill": "none"});
    this.closeX.click(this.remove);
    this.closeX.parent = this;

    this.text = canvas.text(Table._tableTextXOffset, Table._tableTextYOffset, this.getTitle());
    this.text.attr("fill", Table._tableTextDefColour);
    this.text.attr("font-family", Table._tableTextDefFontFamily);
    this.text.attr("font-size", Table._tableTextDefFontSize);
    this.text.attr("font-weight", Table._tableTextDefFontWeight);
    this.text.attr("text-anchor", "start");
    this.text.parent = this;
    this.rect.parent = this;
    this.headerRect.parent = this;
    this.texts = [];
    this.relations = [];

    Table._rightOffset = 50;
    this.headerRect.attr("height", this.text.getBBox().height + Table._headerRectYOffset);
    if (4*Table._tableTextXOffset + this.text.getBBox().width + Table._rightOffset > Table._tableRectDefWidth) {
      this.rect.attr("width", this.text.getBBox().width + 4*Table._tableTextXOffset + Table._rightOffset);
      this.headerRect.attr("width", this.rect.attr("width") - 10);
    }

    this.drag(this._drag, this._dragstart, this._dragstop);


    var generatePropertiesDialog = function(table) {
      var el = table.getParamsElement();
      dialog.empty();
      dialog.dialog("option", "title", "Table params");
      dialog.dialog("option", "buttons", {OK: function(){dialog.dialog("close")}, Cancel: function() {
        var id = dialog.data("id");
        var params = dialog.data("params");
        var table = getTable(id);
        for (var i = 0; i < table.params.length; i++) {
          table.params[i].setValue(params[i].value);
        }
        dialog.dialog("close");
      }});
      dialog.append(el);
      dialog.find("input").eq(0).focus();

      dialog.dialog("open");
      var params = [];
      for (var i = 0; i < table.params.length; i++) {
        params.push(table.params[i].toJSON());
      }
      dialog.data("params", params);
      dialog.data("id", table.__id__);
    }

    this.headerRect.dblclick(function(){generatePropertiesDialog(this.parent)});
    this.rect.dblclick(function(){generatePropertiesDialog(this.parent)});
    this.text.dblclick(function(){generatePropertiesDialog(this.parent)});

    this.rect.hover(this.hoverCursor, this.autoCursor)
    this.headerRect.hover(this.hoverCursor, this.autoCursor)
    this.text.hover(this.hoverCursor, this.autoCursor)
  },
  remove: function() {
    this.parent.rect.remove();
    this.parent.headerRect.remove();
    this.parent.text.remove();
    for (var i = 0; i < this.parent.texts.length; i++) {
      this.parent.texts[i].remove();
    }
    for (var i = 0; i < this.parent.relations.length; i++) {
      this.parent.relations[i].remove();
      gRelations.splice(gRelations.indexOf(this.parent.relations[i], 1));
    }

    this.remove();
    tables.splice(tables.indexOf(this), 1);
  },
  hoverCursor: function(){
    this.attr("cursor", "pointer");
    if (interactivityMode == "relations" && (activeTable != null || typeof activeTable != "undefined")) {
      this.parent.rect.attr("stroke-width", 3);
    }
  },
  autoCursor: function(){
    this.attr("cursor", "auto");
    if (interactivityMode == "relations" && (activeTable != null || typeof activeTable != "undefined")) {
      this.parent.rect.attr("stroke-width", 1);
      activeTable.rect.attr("stroke-width", 3);
    }
  },
  toJSON: function(){
    var obj = {};
    obj.id = this.__id__;
    obj.x = this.rect.attr("x");
    obj.y = this.rect.attr("y");
    obj.params = [];
    for (var i = 0; i < this.params.length; i++) {
      obj.params.push(this.params[i].toJSON());
    }
    obj.components = [];
    for (var i = 0; i < this.texts.length; i++) {
      obj.components.push(this.texts[i].component.toJSON());
    }
    return obj;
  },
  getTitle: function(){
    for (var i = 0; i < tableParams.length; i++) {
      if ("title" == tableParams[i].name)
        return tableParams[i].value;
    }
    return null;
  },
  setTitle: function(title){
    for (var i = 0; i < tableParams.length; i++) {
      if ("title" == tableParams[i].name)
        tableParams[i].setValue(title);
    }
    return null;
  },
  getParamsElement: function(){
    var d = $("<div>");
    for (var i = 0; i < tableParams.length; i++) {
      d.append(this.params[i].getElement());
    }
    return d;
  },
  addComponent: function(component, name){
    component.title = name;
    var titlebbox = this.text.getBBox();

    var text = canvas.text(
        this.rect.attr("x") + Table._componentXOffset*2,
        0, name + " : " + component.getName() );
    text.attr("fill", Table._componentDefColour);
    text.attr("font-family", Table._componentDefFontFamily);
    text.attr("font-size", Table._componentDefFontSize);
    text.attr("text-anchor", "start");

    this.texts.push(text);
    var bbox = this.texts[this.texts.length-1].getBBox();
    var y = titlebbox.y + titlebbox.height  + this.texts.length * bbox.height;
    text.attr("y", y);
    var close = canvas.text(text.attr("x")-7, text.attr("y"), "x").attr("font-size", Table._componentDefFontSize-3);
    // double reference, attention when removing
    close.text = text;
    text.close = close;
    close.hover(
      function() {
        this.attr("cursor", "pointer");
        this.attr("font-size", Table._componentDefFontSize*1.2);
        this.attr("font-weight", "bold");
        this.attr("fill", Table._headerRectDefBackground);
      },
      function() {
        this.attr("cursor", "auto");
        this.attr("font-size", Table._componentDefFontSize);
        this.attr("font-weight", "normal");
        this.attr("fill", "black");
      }
    );
    close.click(function(){
      var table = this.text.parent;
      table.texts.splice(table.texts.indexOf(this.text), 1);
      table.resizeToComp(text);
      this.text.remove();
      this.text.close = null;
      delete this.text;
      this.remove();
    });

    text.component = component;
    text.parent = this;

    text.click(function(){
      activeComp = this.component;
	    var el = this.component.getElement();

	    dialog.empty();
	    dialog.dialog("option", "title", "Component params: " + this.component.title);
	    dialog.dialog("option", "buttons", {});
      dialog.dialog("option", "buttons", {OK: function(){dialog.dialog("close")}, Cancel: function() {
        var id = dialog.data("id");
        var params = dialog.data("params");
        for (var i = 0; i < activeComp.params.length; i++) {
c(params[i].selectedValue)
          if(params[i].type == "list")
            activeComp.params[i].setValue(params[i].selectedValue);
          else
            activeComp.params[i].setValue(params[i].value);
        }
        dialog.dialog("close");
      }});
	    dialog.append(el);
      dialog.find("input").eq(0).focus();

      var params = [];
      for (var i = 0; i < activeComp.params.length; i++) {
        params.push(activeComp.params[i].toJSON());
      }
      dialog.data("params", params);
      dialog.data("id", activeComp.__id__);

	    dialog.dialog("open");
    });
    text.hover(this.hoverCursor, this.autoCursor)

    this.resizeToComp(text);
  },
  resizeToComp: function(text) {
    if(this.texts.length == 0)
      var bbox = {width: 0, height: 0};
    else
      var bbox = this.texts[this.texts.length-1].getBBox();

    var titlebbox = this.text.getBBox();
    var hh = Table._componentYOffset + bbox.height * this.texts.length + titlebbox.height + Table._tableTextYOffset*3;
    if (hh < Table._tableRectDefHeight)
      hh = Table._tableRectDefHeight;
    this.rect.attr("height", hh);

    if (4*Table._tableTextXOffset + text.getBBox().width > this.rect.getBBox().width) {
      this.rect.attr("width", text.getBBox().width + 4*Table._tableTextXOffset);
      this.headerRect.attr("width", this.rect.attr("width") - 10);
    }
    else {
      this.rect.attr("width", this.rect.getBBox().width);
      this.headerRect.attr("width", this.rect.getBBox().width - 10);
    }

    this.positionCloseX();

    if (this.texts.length == 0)
      return;

    var titlebbox = this.text.getBBox();
    var bbox = this.texts[this.texts.length-1].getBBox();
    var y = titlebbox.y + titlebbox.height ;
    for (var i = 0; i < this.texts.length; i++) {
      this.texts[i].attr("x", this.rect.attr("x") + Table._componentXOffset*2);
      y +=  bbox.height ;
      this.texts[i].attr("y", y);
      this.texts[i].close.attr({x: this.texts[i].attr("x")-7, y: this.texts[i].attr("y") })
    }

    for (var i = 0; i < this.relations.length; i++) {
      this.relations[i].reposition();
    }

  },
  positionCloseX: function() {
    var cx = this.headerRect.attr("x") + this.headerRect.attr("width") - 15;
    var cy = this.headerRect.attr("y") + 11;
    var cw = 7;
    var ch = 7;
    var cx2 = cx + cw;
    var cy2 = cy+ch;
    this.closeX.attr("path", "M" + cx + "," + cy + " L" + cx2 + "," + cy2 + " M" + cx + "," + cy2 + " L" + cx2 + "," + cy);
  },
  setPosition: function(x, y){
    var scale = $("#ezd-slide").slider("value");
    this.rect.attr("x", x + Table._tableRectXOffset);
    this.rect.attr("y", y + Table._tableRectYOffset);
    this.headerRect.attr("x", x + 5 + Table._tableRectXOffset);
    this.headerRect.attr("y", y + 5 + Table._tableRectYOffset);

    this.positionCloseX();

    this.text.attr("x", x + 5 + 1 + Table._tableTextXOffset);
    this.text.attr("y", y + 5 + 1 + this.text.getBBox().height + Table._tableTextYOffset);

    if (this.texts.length == 0)
      return;

    var titlebbox = this.text.getBBox();
    var bbox = this.texts[this.texts.length-1].getBBox();
    var y = titlebbox.y + titlebbox.height ;
    for (var i = 0; i < this.texts.length; i++) {
      this.texts[i].attr("x", this.rect.attr("x") + Table._componentXOffset*2);
      y +=  bbox.height ;
      this.texts[i].attr("y", y);
      this.texts[i].close.attr({x: this.texts[i].attr("x")-7, y: this.texts[i].attr("y") })
    }
  },
  dblclick: function(f1){
    this.text.dblclick(f1);
    this.rect.dblclick(f1);
  },
  drag: function(f1, f2, f3){
    this.isDraggable = true;
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;
    this.text.drag(f1, f2, f3);
    this.rect.drag(f1, f2, f3);
    this.headerRect.drag(f1, f2, f3);
  },
  contains: function(x, y){
    var scale = $("#ezd-slide").slider("value");
    //x = x / getZoom();
    //y = y / getZoom();
    var bb = this.rect.getBBox();
    if (bb.x < x && bb.x+bb.width > x
        && bb.y < y && bb.y+bb.height > y) {
      return true;
    }
    else {
      return false;
    }
  },
  _dragstart: function(){
    if (interactivityMode != "normal")
      return;
    isdragging = true;

    // storing original coordinates
    this.ox = this.attr("x");
    this.oy = this.attr("y");
    for (var i = 0; i < this.parent.relations.length; i++) {
      this.parent.relations[i].srcTextBackground.hide();
      this.parent.relations[i].dstTextBackground.hide();
      this.parent.relations[i].srcText.hide();
      this.parent.relations[i].dstText.hide();
    }

    if (this == this.parent.headerRect) {
      this.ox -= 5;
      this.oy -= 5;
    }
    if (this == this.parent.text) {
      this.ox -= Table._tableTextXOffset + 6;
      this.oy -= Table._tableTextYOffset + 14;
    }
    this.parent.helper.attr({x: this.ox, y: this.oy});
    this.parent.helper.attr({width: this.parent.rect.attr("width"), height: this.parent.rect.attr("height")});
  },
  _drag: function(dx, dy){
    if (!isdragging)
      return;
    this.parent.rect.attr("stroke-width", 3);
    this.parent.helper.show().toFront();
    // move will be called with dx and dy
    xx = this.ox + dx*getZoom();
    yy = this.oy + dy*getZoom();
    this.parent.helper.attr({x: xx, y: yy});
    //this.parent.setPosition(xx, yy);
    for (var i = 0; i < this.parent.relations.length; i++) {
      //this.parent.relations[i].reposition();
    }
  },
  _dragstop: function(e){
    if (!isdragging)
      return;
    this.parent.helper.hide();
    this.parent.setPosition(this.parent.helper.attr("x"), this.parent.helper.attr("y") - 10);
    this.parent.rect.attr("stroke-width", 1);
    isdragging = false;
    for (var i = 0; i < this.parent.relations.length; i++) {
      this.parent.relations[i].reposition();
      this.parent.relations[i].repositionTexts();
    }
  },
  scale: function (val) {
    this.rect.scale(val);
    this.headerRect.scale(val);
    this.text.scale(val);
    for (var i = 0; i < this.texts.length; i++) {
      this.texts[i].scale(val);
    }
  }
});
var activetable = null;

Table.fromJSON = function(obj) {
  var t = new Table(canvas);
  t.__id__ = obj.id;
  t.setPosition(obj.x, obj.y);
  for (var j = 0; j < obj.params.length; j++) {
    if (obj.params[j].type == "list")
      t.params[j].setValue(obj.params[j].selectedValue);
    else
      t.params[j].setValue(obj.params[j].value);
  }

  for (var i = 0; i < obj.components.length; i++) {
    t.addComponent(CF(obj.components[i]), obj.components[i].title);
    for (var j = 0; j < obj.components[i].params.length; j++) {
      if (obj.components[i].params[j].type == "list" )
        t.texts[i].component.params[j].setValue(obj.components[i].params[j].selectedValue);
      else
        t.texts[i].component.params[j].setValue(obj.components[i].params[j].value);
    }
  }

  return t;
}

Table._tableRectXOffset = 0;
Table._tableRectYOffset = 10;
Table._tableRectDefWidth = 80;
Table._tableRectDefHeight = 80;
Table._tableRectDefColour = "#dedede";
Table._tableRectDefStrokeColour = "black";
Table._tableRectDefStrokeWidth = 1;

Table._tableTextXOffset = 5;
Table._tableTextYOffset = 5;
Table._tableTextDefColour = "white";
Table._tableTextDefFontSize = 14;
Table._tableTextDefFontFamily = "Tahoma";
Table._tableTextDefFontWeight = "bold";

Table._componentXOffset = 10;
Table._componentYOffset = 10;

Table._componentDefColour = "black";
Table._componentDefFontSize = 12;
Table._componentDefFontFamily = "Tahoma";

Table._headerRectDefBackground = "orange";
Table._headerRectYOffset = 10;
Table._headerRectDefStrokeColour = "none";
Table._headerRectDefStrokeWidth = 0;

Table._closeXStrokeColour = "white";
Table._closeXStrokeWidth = 3;

