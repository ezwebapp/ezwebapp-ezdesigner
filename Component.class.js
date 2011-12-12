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
