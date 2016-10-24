const SyntaxTree = require("./syntaxTree.js")

function State(){
  this.history = [];
  this.handlers = [];
}

State.prototype.init = function(config){
   let {fields, exps, rules} = config
   this.data = fields
   this.proxy = new Proxy(this.data, {
      set: function(ob, prop, value){
         //console.log("CAN SET " + prop +  " Please use the update function")
         throw new Error("CANNOT SET PROPS ON DATA. PLEASE USE UPDATE")
      }
   })
   this.history.push(this.data);
   this.exps = Object.keys(exps).reduce((ob, key) => {
      ob[key] = new SyntaxTree(exps[key], this.data, ob)
      return ob
   }, {})
   this.rules = rules.map(str => new SyntaxTree(str, this.data, this.exps))
}

State.prototype.get = function(name, prev_val){
  if (prev_val){
     return this.history[this.history.length-1][name];
  } else {
      return this.data[name];
  }
};

State.prototype.set = function(name, val){
 this.data[name] = val;
};

State.prototype.on = function (str, handler){
  if (this.data[str]){
      str = str + " has changed";
  }
  console.log("ON", str)
  var exp = this.exps[str] ? this.exps[str] : new SyntaxTree(str, this.data, this.exps);
  console.log("EXP", exp)
  this.handlers.push({exp:exp, handler:handler});
}
State.prototype.update = function(obj){
  var self = this;
  this.history.push(copy(this.data));
  transfer(obj, this.data);
  this.rules.forEach(function(exp){
      exp.interpret(self);
      console.log("apply rule", exp)
  });
  console.log("HANDLERS", this.handlers)
  var triggered =  this.handlers.filter(function(trigger){
      console.log("Filter FuNC", trigger.exp.interpret.toString())
     console.log("filter result", trigger.exp.interpret(self))
      return trigger.exp.interpret(self);
  })
  console.log("TRIGEGERE", triggered)
  triggered.forEach(trigger => {
     console.log("HANLDER", trigger)
      trigger.handler(this.proxy)//proxy
  });
}

function copy(obj){
 return JSON.parse(JSON.stringify(obj));
}
function transfer(from, to){
   for (var prop in from){
      to[prop] = from[prop];
  }
}

module.exports = State
