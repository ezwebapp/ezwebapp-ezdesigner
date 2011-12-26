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
    if (this.el == null) {
      this.el = $("<div><b>Param</b> " + this.getName() + ": <input value='" + this.getValue() + "'></div>");
      this.el.attr("id", this.__id__);
      this.el.find("input").change(function(){
        var id = $(this).closest("div").attr("id");
        var obj =  __objects[id];
        obj.setValue($(this).val());
      });
    }
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
    if (this.el == null) {
      this.el = $("<div><b>Param</b> " + this.getName() + ": <input value='" + this.getValue() + "'></div>")
      this.el.attr("id", this.__id__);
      this.el.find("input").change(function(){
        var id = $(this).closest("div").attr("id");
        var obj =  __objects[id];
        obj.setValue($(this).val());
      });
    }
    this.el.find("input").val(this.getValue());
    return this.el;
  },
  getType: function(){ return "number"; }
});

var ListParam = Param.extend({
  init: function(paramDescription) {
    this._super(paramDescription);
    this.__class__ = "ListParam";
  },
  getElement: function() {
    //if (this.el == null) { 
  	  var s = $("<div><b>Param</b> " + this.desc.name + "<select></select></div>");
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
    var el = this.getElement();
    if (typeof this.desc.value == "string")
      var ind = this.desc.value.indexOf(val);
    else
      var ind = 0;
    el.find("select").find("option").eq(ind).attr("selected", "true");
  },
  getValue: function() {
    return $(this.getElement()).find("select").val();
  },
  getType: function(){ return "list"; },
  toJSON: function() {
    return {name: this.getName(), type: this.getType(), selectedValue: this.getValue(), value: this.desc.value};
  }

});

var RelationshipParam = ListParam.extend({
  init: function(paramDescription) {
    this._super(paramDescription);
    this.__class__ = "RelationshipParam";
  },
  getElement: function() {
      if (this.el != null)
        return this.el;
      this._super();
      this.el.find("select").change(function(){
        var id = $(this).closest("div").attr("id");
        var obj =  __objects[id];
        obj.relation.srcText.attr("text", obj.getSrcText());
        obj.relation.dstText.attr("text", obj.getDstText());
      });
      return this.el;
  },
  setValue: function(val) {
    var el = this.getElement();
    if (typeof this.desc.value == "string")
      var ind = this.desc.value.indexOf(val);
    else
      var ind = 0;
    el.find("select").find("option").eq(ind).attr("selected", "true");
  },
  getSrcText: function() {
    if (this.getValue() == "1:1") {
      return "1";
    }
    else if (this.getValue() == "1:n") {
      return "1";
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
    else if (this.getValue() == "n:n") {
      return "n";
    }
  }
});

function PF(paramDescription, params) {
  var name = paramDescription.type.charAt(0).toUpperCase() + paramDescription.type.slice(1);
  return eval("new " + name + "Param(paramDescription);");
}
