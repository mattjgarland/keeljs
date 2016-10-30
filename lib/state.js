/*
A state takes a data object, expression strings, and rules for init. 
    1. The data object has all the state members and default values.
    2. Expression strings are transformed into interpetable syntax trees that yield values when state is passe in: topNode.interpret(thisState). Expressions can be used in other expressions and rules.
    3. Rules are also string-turned interpetable nodes and are executed seriatim when the state is updated.

LINK How to use. 

State changes are propagated to listeners like this: state.on("myField", listener).
When "on" is called:
1. A handler object is created and stored in handlers.
2. A handler has a trigger, which takes the "myField" string and turns it into an interpretable node. 
    a. Regular data fields have "has changed" appended before being converted to interpetable nodes.
    b. Exp tokens are found in state.exps by the syntax tree. 
3. The handler also stores a listener.

When state.update is called:
    1. Current state data is copied into history.
    2. Updates are merged into state data. 
    3. Each rule expression is executed: ruleTopNode.interpret(thisState).
    4. The trigger for each handler is executed. If it returns false, the listener is invokes and pass state data.
    5. The data is proxied so it cannot be changed. (It can only be changed via state.set and state.update)
*/

const makeSyntaxTree = require("./syntax-tree.js").makeSyntaxTree

function State(){
  this.history = [];
  this.handlers = [];
}

State.prototype.init = function(config){
   let {data, expressions = {}, rules = []} = config

   this.data = data
   this.dataProxy = new Proxy(data, {
      set: function(ob, prop, value){
         throw new Error("Please use State::update to update state.")
      }
   })

   this.exps = Object.keys(expressions).reduce((exps, key) => {
      exps[key] = makeSyntaxTree(expressions[key], data, exps)
      return exps
   }, {})

   this.rules = rules.map(str => this.makeTree(str))
}

State.prototype.makeTree = function(str){
    return makeSyntaxTree(str, this.data, this.exps)
}

State.prototype.get = function(name, getPrevVal){
  if (getPrevVal){
     return this.history[this.history.length-1][name];
  } else {
      return this.data[name];
  }
};

State.prototype.set = function(name, val){
    this.data[name] = val;
};

State.prototype.on = function (str, listener){
  if (this.data[str]){
      str = str + " has changed"
  } 

  if (this.exps[str]){
      trigger = this.exps[str]
  } else {
      trigger = this.makeTree(str)
      this.exps[str] = trigger
  }

  this.handlers.push({trigger, listener})
}

State.prototype.update = function(updates){
  this.history.push(Object.assign({}, this.data));
  Object.assign(this.data, updates)

  this.rules.forEach(exp => {
      exp.interpret(this);
  });

  this.handlers.filter(handler => {
      return handler.trigger.interpret(this);
  }).forEach(handler => {
      handler.listener(this.dataProxy)
  });
}

module.exports = State
