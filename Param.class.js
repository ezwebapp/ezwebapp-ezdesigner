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

var Param = Class.extend({
  init: function(paramDescription) {
    this.__class__ = "Param";

    this.desc = {name: paramDescription.name, type: paramDescription.type};
    if (paramDescription.type == "list") {
      this.desc.value = [];
      for (var i = 0; i < paramDescription.value.length; i++) {
        this.desc.value.push(paramDescription.value[i]);
      }
    }
    else {
      this.desc.value = paramDescription.value;
    }
  },
  getName: function() {
    return this.desc.name;
  },
  setName: function(name) {
    this.desc.name = name;
  },
  getValue: function() {
    return this.desc.value;
  },
  setValue: function(value) {
    this.desc.value = value;
    this.getElement().val(value);
  },
  getElement: function() {
    return $("<input>");
  },
  toJSON: function() {
    return {  id: this.__id__, name: this.getName(), type: this.getType(), value: this.getValue() };
  }
});

var StringParam = Param.extend({
  init: function(paramDescription) {
    this._super(paramDescription);
    this.__class__ = "StringParam";
  },
  getElement: function() {
//    if (this.el == null) {
      this.el = $("<div>" + this.getName() + ": <input value='" + this.getValue() + "'></div>");
      this.el.attr("id", this.__id__);
      this.el.find("input").change(function(){
        var id = $(this).closest("div").attr("id");
        var obj =  __objects[id];
        obj.setValue($(this).val());
      });
//    }
    this.el.find("input").val(this.getValue());
    return this.el;
  },
  getType: function(){ return "string"; }
});

var NumberParam = Param.extend({
  init: function(paramDescription) {
    this._super(paramDescription);
    this.__class__ = "NumberParam";
  },
  getElement: function() {
//    if (this.el == null) {
      this.el = $("<div>" + this.getName() + ": <input value='" + this.getValue() + "'></div>")
      this.el.attr("id", this.__id__);
      this.el.find("input").change(function(){
        var id = $(this).closest("div").attr("id");
        var obj =  __objects[id];
        obj.setValue($(this).val());
      });
//    }
    this.el.find("input").val(this.getValue());
    return this.el;
  },
  getType: function(){ return "number"; }
});

var ListParam = Param.extend({
  init: function(paramDescription) {
    this._super(paramDescription);
    this.__class__ = "ListParam";
    this.val = this.desc.value[0];
  },
  getElement: function() {
    //if (this.el == null) {
  	  var s = $("<div>" + this.desc.name + ": <select></select></div>");
      s.attr("id", this.__id__);
  	  for (var i = 0; i < this.desc.value.length; i++) {
  		  s.find("select").append($("<option>" + this.desc.value[i] + "</option>"));
  	  }
      s.find("select").change(function(){
        var id = $(this).closest("div").attr("id");
        var obj =  __objects[id];
      });
      this.el = s;
    //}
  	return this.el;
  },
  setValue: function(val) {
    this.val = val;
    var el = this.getElement();
    if (typeof this.desc.value == "string")
      var ind = this.desc.value.indexOf(val);
    else
      var ind = 0;
    var options = el.find("select").find("option");
    for (var i = 0; i < options.length; i++) {
      if ($(options[i]).html() == val)
        ind = i;
    }
    el.find("select").find("option").eq(ind).attr("selected", "true");
  },
  getValue: function() {
    return this.val;//$(this.getElement()).find("select").val();
  },
  getType: function(){ return "list"; },
  toJSON: function() {
    return {name: this.getName(), type: this.getType(), selectedValue: this.getValue(), value: this.desc.value};
  }

});

var RelationshipParam = Param.extend({
  init: function(paramDescription) {
    this._super(paramDescription);
    this.__class__ = "RelationshipParam";
    this.val = this.desc.value[0];
  },
  getElement: function() {
	  var s = $("<div>" + this.desc.name + ": <select></select></div>");
    s.attr("id", this.__id__);
	  for (var i = 0; i < this.desc.value.length; i++) {
		  s.find("select").append($("<option>" + this.desc.value[i] + "</option>"));
	  }
    this.el = s;
    this.el.find("select").change(function(){
      var id = $(this).closest("div").attr("id");
      var obj =  __objects[id];
      obj.relation.params[0].setValue($(this).val());
    });
    var options = this.el.find("select").find("option");
    for (var i = 0; i < options.length; i++) {
      if ($(options[i]).html() == this.val)
        ind = i;
    }
    this.el.find("select").find("option").eq(ind).attr("selected", "true");
    return this.el;
  },
  setValue: function(val) {
    this.val = val;
    var el = this.getElement();
    if (typeof this.desc.value == "string")
      var ind = this.desc.value.indexOf(val);
    else
      var ind = 0;
    var options = el.find("select").find("option");
    for (var i = 0; i < options.length; i++) {
      if ($(options[i]).html() == val)
        ind = i;
    }
    el.find("select").find("option").eq(ind).attr("selected", "true");
    var id = el.closest("div").attr("id");
    var obj =  __objects[id];
    obj.relation.srcText.attr("text", obj.getSrcText());
    obj.relation.dstText.attr("text", obj.getDstText());

  },
  getSrcText: function() {
    if (this.getValue() == "1:1") {
      return "1";
    }
    else if (this.getValue() == "1:n") {
      return "1";
    }
    else if (this.getValue() == "n:1") {
      return "n";
    }
    else if (this.getValue() == "n:n") {
      return "n";
    }
  },
  getDstText: function() {
    if (this.getValue() == "1:1") {
      return "1";
    }
    else if (this.getValue() == "1:n") {
      return "n";
    }
    else if (this.getValue() == "n:1") {
      return "1";
    }
    else if (this.getValue() == "n:n") {
      return "n";
    }
  },
  getValue: function() {
    return this.val;// $(this.getElement()).find("select").val();
  },
  getType: function(){ return "list"; },
  toJSON: function() {
    return {name: this.getName(), type: this.getType(), selectedValue: this.getValue(), value: this.desc.value};
  }

});

function PF(paramDescription, params) {
  var name = paramDescription.type.charAt(0).toUpperCase() + paramDescription.type.slice(1);
  return eval("new " + name + "Param(paramDescription);");
}
