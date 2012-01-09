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

var Relation = Class.extend({
  init: function(relationDescription, t1, t2) {
    gRelations.push(this);
    this.line = canvas.path("");
    this.line.parent = this;
    this.desc = relationDescription;
    this.src = t1;
    this.dst = t2;
    t1.relations.push(this);
    t2.relations.push(this);
    this.params = [];
    for (var i = 0; i < relations.length; i++) {
      this.params.push(PF(relations[i]));
    }
    this.params[0].relation = this;

    this.srcText = canvas.text(0, 0, this.params[0].getSrcText());
    this.dstText = canvas.text(0, 0, this.params[0].getDstText());
    this.srcTextBackground = canvas.rect(0, 0, 0, 0);
    this.dstTextBackground = canvas.rect(0, 0, 0, 0);

    this.srcTextBackground.attr("fill", Relation._srcBackground);
    this.srcTextBackground.attr("stroke-width", Relation._srcStrokeWidth);
    this.srcText.attr("font-family", Relation._srcFontFamily);
    this.srcText.attr("font-size", Relation._srcFontSize);
    this.srcText.attr("font-weight", Relation._srcFontWeight);
    this.srcText.attr("color", Relation._srcFontColour);

    this.dstTextBackground.attr("fill", Relation._dstBackground);
    this.dstTextBackground.attr("stroke-width", Relation._dstStrokeWidth);
    this.dstText.attr("font-family", Relation._dstFontFamily);
    this.dstText.attr("font-size", Relation._dstFontSize);
    this.dstText.attr("font-weight", Relation._dstFontWeight);
    this.dstText.attr("color", Relation._dstFontColour);

    this.line.attr({"stroke": Relation._lineStroke, "stroke-width": Relation._lineStrokeWidth});

    this.line.hover(function(){
      this.attr({"stroke-width": Relation._lineStrokeWidthHover});
      this.attr({"stroke": Relation._lineStrokeHover});

      this.parent.srcTextBackground.attr("fill", Relation._srcBackgroundHover);
      this.parent.srcTextBackground.attr("stroke-width", Relation._srcStrokeWidthHover);
      this.parent.srcText.attr("font-family", Relation._srcFontFamilyHover);
      this.parent.srcText.attr("font-size", Relation._srcFontSizeHover);
      this.parent.srcText.attr("font-weight", Relation._srcFontWeightHover);
      this.parent.srcText.attr("color", Relation._srcFontColourHover);

      this.parent.dstTextBackground.attr("fill", Relation._dstBackgroundHover);
      this.parent.dstTextBackground.attr("stroke-width", Relation._dstStrokeWidthHover);
      this.parent.dstText.attr("font-family", Relation._dstFontFamilyHover);
      this.parent.dstText.attr("font-size", Relation._dstFontSizeHover);
      this.parent.dstText.attr("font-weight", Relation._dstFontWeightHover);
      this.parent.dstText.attr("color", Relation._dstFontColourHover);

      },
      function() {
        this.attr({"stroke-width": Relation._lineStrokeWidth});
        this.attr({"stroke": Relation._lineStroke});

        this.parent.srcTextBackground.attr("fill", Relation._srcBackground);
        this.parent.srcTextBackground.attr("stroke-width", Relation._srcStrokeWidth);
        this.parent.srcText.attr("font-family", Relation._srcFontFamily);
        this.parent.srcText.attr("font-size", Relation._srcFontSize);
        this.parent.srcText.attr("font-weight", Relation._srcFontWeight);
        this.parent.srcText.attr("color", Relation._srcFontColour);

        this.parent.dstTextBackground.attr("fill", Relation._dstBackground);
        this.parent.dstTextBackground.attr("stroke-width", Relation._dstStrokeWidth);
        this.parent.dstText.attr("font-family", Relation._dstFontFamily);
        this.parent.dstText.attr("font-size", Relation._dstFontSize);
        this.parent.dstText.attr("font-weight", Relation._dstFontWeight);
        this.parent.dstText.attr("color", Relation._dstFontColour);
    });
    this.line.click(function(){
      var relation = this.parent;
      var el = this.parent.getElement();
      dialog.empty();
      dialog.dialog("option", "title", "Table params");
      dialog.dialog("option", "buttons", {OK: function(){dialog.dialog("close")}, Cancel: function() {
        var id = dialog.data("id");
        var params = dialog.data("params");
        var relation = getRelation(id);
        for (var i = 0; i < relation.params.length; i++) {
          relation.params[i].setValue(params[i].selectedValue);
        }
        dialog.dialog("close");
      }});

      dialog.append(el);
      dialog.find("input").eq(0).focus();
      dialog.dialog("open");
      var params = [];
      for (var i = 0; i < relation.params.length; i++) {
        params.push(relation.params[i].toJSON());
      }
      dialog.data("params", params);
      dialog.data("id", this.parent.__id__);

    });
  },
  reposition: function() {
    var x1, y1, x2, y2 = 0;
    var rx1 = x1 = this.src.rect.attr("x");
    var rx2 = x2 = this.dst.rect.attr("x");
    var ry1 = y1 = this.src.rect.attr("y");
    var ry2 = y2 = this.dst.rect.attr("y");
    var rw1 = this.src.rect.attr("width");
    var rh1 = this.src.rect.attr("height");
    var rw2 = this.src.rect.attr("width");
    var rh2 = this.src.rect.attr("height");

    if (ry1 + rh1 < ry2) {
      y1 = ry1 + rh1;
      y2 = ry2;
      x1 = rx1 + rw1/2;
      x2 = rx2 + rw2/2;
    }
    else if (ry1 < ry2 + rh2) {
      y1 = ry1 + rh1/2;
      y2 = ry2 + rh2/2;
      if (rx1 + rw1 < rx2) {
        x1 = rx1 + rw1;
        x2 = rx2;
      }
      else if (rx1 < rx2 + rw2) {
        x1 = rx1 + rw1/2;
        x2 = rx2 + rw2/2;
      }
      else {
        x1 = rx1;
        x2 = rx2 + rw2;
      }
    }
    else {
      y1 = ry1;
      y2 = ry2 + rh2;
      x1 = rx1 + rw1/2;
      x2 = rx2 + rw2/2;
    }

    this.line.attr("path", "M" + x1 + "," + y1 + "L" + x2 + "," + y2);
  },
  repositionTexts: function() {
    var rw1 = this.src.rect.attr("width");
    var rh1 = this.src.rect.attr("height");
    var rw2 = this.src.rect.attr("width");
    var rh2 = this.src.rect.attr("height");
    var psrc = this.line.getPointAtLength(Math.sqrt(rw1*rw1+rh1*rh1)/2 + 10);
    this.srcText.attr({x: psrc.x , y: psrc.y });
    var pdst = this.line.getPointAtLength(this.line.getTotalLength() - Math.sqrt(rw2*rw2+rh2*rh2)/2 + 10);
    this.dstText.attr({x: pdst.x, y: pdst.y});

    var margin = 2;
    var bb1 = this.srcText.getBBox();
    this.srcTextBackground.attr({x: bb1.x-margin, y: bb1.y, width: bb1.width+margin*2, height: bb1.height});
    var bb1 = this.dstText.getBBox();
    this.dstTextBackground.attr({x: bb1.x-margin, y: bb1.y, width: bb1.width+margin*2, height: bb1.height});
    this.srcText.toBack();
    this.dstText.toBack();
    this.srcTextBackground.toBack();
    this.dstTextBackground.toBack();
    this.srcTextBackground.show();
    this.dstTextBackground.show();
    this.line.toBack();
//    backgroundRect.toBack();

    this.srcText.show();
    this.dstText.show();
  },
  remove: function() {
    for (var i = 0; i < this.src.relations.length; i++) {
      if (this == this.src.relations[i])
        this.src.relations.splice(i);
    }
    for (var i = 0; i < this.dst.relations.length; i++) {
      if (this == this.dst.relations[i])
        this.dst.relations.splice(i);
    }
    this.srcTextBackground.remove();
    this.dstTextBackground.remove();
    this.srcText.remove();
    this.dstText.remove();
    this.line.remove();
  },
  getElement: function() {
    return this.params[0].getElement();
  },
  getName: function() {return this.desc.name;},
  toJSON: function() {
    var obj = {};
    obj.id = this.__id__;
    obj.src = this.src.__id__;
    obj.dst = this.dst.__id__;
    obj.params = [];
    for (var i = 0; i < this.params.length; i++) {
      obj.params.push(this.params[i].toJSON());
    }
    return obj;
  }
});

Relation._srcBackground = "white";
Relation._srcStrokeWidth = 1;
Relation._srcFontFamily = "Arial";
Relation._srcFontSize = 10;
Relation._srcFontWeight = "normal";
Relation._srcFontColour = "black";

Relation._srcBackgroundHover = "white";
Relation._srcStrokeWidthHover = 3;
Relation._srcFontFamilyHover = "Arial";
Relation._srcFontSizeHover = 10;
Relation._srcFontWeightHover = "normal";
Relation._srcFontColourHover = "black";

Relation._dstBackground = "white";
Relation._dstBackgroundHover = "white";
Relation._dstStrokeWidth = 1;
Relation._dstStrokeWidthHover = 3;
Relation._dstFontFamily = "Arial";
Relation._dstFontSize = 10;
Relation._dstFontWeight = "normal";
Relation._dstFontColour = "black";
Relation._dstFontFamilyHover = "Arial";
Relation._dstFontSizeHover = 10;
Relation._dstFontWeightHover = "normal";
Relation._dstFontColourHover = "black";

Relation._lineStroke = "black";
Relation._lineStrokeHover = "black";
Relation._lineStrokeWidth = 1;
Relation._lineStrokeWidthHover = 5;
