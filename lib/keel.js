define([], function() {

    function State(SyntaxTree){
        this.SyntaxTree = SyntaxTree;
        this.data = {};
        this.history = [];
        this.exps = {};
        this.update_rules = [];
        this.after_update = [];
        //this.updates = [];
    }
    State.prototype.set = function(name, val){
        this.data[name] = val;
    };
    State.prototype.get = function(name, prev_val){
        if (prev_val){
           return this.history[this.history.length-1][name];
        } else {
            return this.data[name];
        }
    };
    State.prototype.has = function(name){
        return this.data.hasOwnProperty(name);
    }
    State.prototype.exp = function(key, str){
        if (typeof str === "function"){
            this.exps[key] = {interpret: str};
        } else {
            this.exps[key] = new this.SyntaxTree(str, this);
        }
    };
    State.prototype.hasExp = function(key){
        return this.exps.hasOwnProperty(key);
    };
    State.prototype.getExp = function(key){
        return this.exps[key];
    }
    State.prototype.rule = function(str){
        this.update_rules.push(new this.SyntaxTree(str, this));
    };
    State.prototype.on = function (str, handler, props){
        if (this.has(str)){
            if (typeof props == "undefined"){
                props = [str];
            }
            str = str + " has changed";
        }
        var exp = this.hasExp(str)? this.getExp(str) : new this.SyntaxTree(str, this);
        this.after_update.push({exp:exp, handler:handler, props:props});
    }
    State.prototype.update = function(obj){
        var self = this;
        this.history.push(copy(this.data));
        transfer(obj, this.data);
        this.update_rules.forEach(function(exp){
            exp.interpret(self);
        });
        var triggered =  this.after_update.filter(function(trigger){
            return trigger.exp.interpret(self);
        })
        triggered.forEach(function(trigger){
            var props = trigger.props;
            var handler = trigger.handler;
            if (props){
                if (props.length == 1){
                    handler(self.get(props[0]));
                } else {
                    var data = {};
                    props.forEach(function(prop){
                        data[prop] = self.get(prop);
                    });
                    handler(data);
                }
            } else {
                handler();
            }
        });
    }
    return State;

    function copy(obj){
       return JSON.parse(JSON.stringify(obj));
    }
    function transfer(from, to){
         for (var prop in from){
            to[prop] = from[prop];
        }
    }
});
