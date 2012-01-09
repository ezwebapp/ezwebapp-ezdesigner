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

var Component = Class.extend({
  init: function(componentDescription) {
    this.__class__ = "Component";

    this.desc = {name: componentDescription.name, params: []};
    for (var i = 0; i < componentDescription.params.length; i++) {
      var paramDescription = componentDescription.params[i];
      var tmpdesc = {name: paramDescription.name, type: paramDescription.type};
      if (paramDescription.type == "list") {
        tmpdesc.value = [];
        for (var j = 0; j < paramDescription.value.length; j++) {
          tmpdesc.value.push(paramDescription.value[j]);
        }
      }
      else {
        tmpdesc.value = paramDescription.value;
      }
      this.desc.params.push(tmpdesc);
    }

    this.params = [];
    for (var i = 0; i < this.desc.params.length; i++) {
    	this.params.push(PF(this.desc.params[i]));
    }
  },
  getElement: function() {
    if (this.el == null) {
      var d = $("<div>");
      d.attr("id", this.__id__);
      for (var i = 0; i < this.params.length; i++) {
        d.append(this.params[i].getElement());
      }
      this.el = d;
    }
    return this.el;
  },
  getName: function() {return this.desc.name;},
  setName: function(name) {this.desc.name = name;},
  toJSON: function() {
    var obj = {};
    obj.id = this.__id__;
    obj.name = this.getName();
    obj.title = this.title;
    obj.params = [];
    for (var i = 0; i < this.params.length; i++) {
      obj.params.push(this.params[i].toJSON());
    }
    return obj;
  }
});

function CF(componentDescription, params) {
  var name = componentDescription.name.charAt(0).toUpperCase() + componentDescription.name.slice(1);
  try {
    return eval("new " + name + "Component(componentDescription);");
  }
  catch(ex) {
		return eval("new Component(componentDescription);");
  }
}
