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
    
    this.rect = canvas.rect(Table._tableRectXOffset, Table._tableRectYOffset, Table._tableRectDefWidth, Table._tableRectDefHeight);
    this.rect.attr("fill", Table._tableRectDefColour);
    this.rect.attr("stroke", Table._tableRectDefStrokeColour);
    this.rect.attr("stroke-width", Table._tableRectDefStrokeWidth);

    this.headerRect = canvas.rect(0, 5, Table._tableRectDefWidth-5, Table._tableRectDefHeight, 3);
    this.headerRect.attr("fill", Table._headerRectDefBackground);
    this.headerRect.attr("stroke", Table._headerRectDefStrokeColour);
    this.headerRect.attr("stroke-width", Table._headerRectDefStrokeWidth);

    this.rect.click(function(){
      if (interactivityMode == "relations" && !isdragging) {
        if (typeof activeTable == "undefined" || activeTable == null) 
          activeTable = this.parent;
        else {
          var r = new Relation(relations[0], this.parent, activeTable);
          r.reposition();
          r.repositionTexts();
          activeTable = null;
        }
      }
    });

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

    
    this.headerRect.dblclick(function(){
      var el = this.parent.getParamsElement();
      dialog.empty();
      dialog.dialog("option", "title", "Table params");
      dialog.append(el);
      dialog.dialog("open");
    });
    this.rect.dblclick(function(){
      var el = this.parent.getParamsElement();
      dialog.empty();
      dialog.dialog("option", "title", "Table params");
      dialog.append(el);
      dialog.dialog("open");
    });
    this.text.dblclick(function(){
      var el = this.parent.getParamsElement();
      dialog.empty();
      dialog.dialog("option", "title", "Table params");
      dialog.append(el);
      dialog.dialog("open");
    });
    
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
    }
    
    this.remove();
  },
  hoverCursor: function(){this.attr("cursor", "pointer")},
  autoCursor: function(){this.attr("cursor", "auto")},
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
        this.rect.attr("x") + Table._componentXOffset, 
        0, name + " : " + component.getName() );
    text.attr("fill", Table._componentDefColour);
    text.attr("font-family", Table._componentDefFontFamily);
    text.attr("font-size", Table._componentDefFontSize);
    text.attr("text-anchor", "start");
    
    this.texts.push(text);
    var bbox = this.texts[this.texts.length-1].getBBox();
    var y = titlebbox.y + titlebbox.height  + this.texts.length * bbox.height;
    text.attr("y", y);

    
    var hh = Table._componentYOffset + bbox.height * this.texts.length + titlebbox.height + Table._tableTextYOffset;
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
    
    text.component = component;
    text.parent = this;
    
    text.click(function(){
      activeComp = this.component;
	    var el = this.component.getElement();
	
	    dialog.empty();
	    dialog.dialog("option", "title", "Component params: " + this.component.title);
	    dialog.append(el);
	    dialog.dialog("open");
    });
    text.hover(this.hoverCursor, this.autoCursor)
    
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
      this.texts[i].attr("x", this.rect.attr("x") + Table._componentXOffset);
      y +=  bbox.height ; 
      this.texts[i].attr("y", y);
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
  },
  _drag: function(dx, dy){
    if (!isdragging)
      return;
    var scale = $("#ezd-slide").slider("value");
    // move will be called with dx and dy
    this.parent.setPosition( this.ox + dx*getZoom() , this.oy + dy*getZoom() - 10);
    for (var i = 0; i < this.parent.relations.length; i++) {
      this.parent.relations[i].reposition();
    }
  },
  _dragstop: function(){
    if (!isdragging)
      return;
    isdragging = false;
    for (var i = 0; i < this.parent.relations.length; i++) {
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

