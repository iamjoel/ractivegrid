(function(Ractive, $) {
	var headTemplate = 
		'<thead><tr>'
	    	+ '{{#columns}}'
	    		+ '<th>{{label}}</th>'
    		+ '{{/columns}}'
		+ '</tr></thead>';
	var bodyTemplate =
		'<tbody>'
		+ '{{#data:i}}'
			+ '<tr>'
			+ '{{#columns}}'
					+ '{{# isFunction(fromRaw) }}'
		    			+ '<td>{{fromRaw(data[i][name], data[i])}}</td>'
		    		+ '{{/isFunction}}'
		    		+ '{{^isFunction(fromRaw) }}'
		    			+ '<td>{{data[i][name]}}</td>'
		    		+ '{{/isFunction}}'
			+ '{{/columns}}'
    		+ '</tr>'
		+ '{{/data}}'
		+ '</tbody>'
    var template = 
    	'<table>'
	    	+ headTemplate
	    	+ bodyTemplate
		+ '</table>';
    var undef = undefined;
    var Ractivegrid = function(param) {
        var validMsg = validParam(param);
        var self = this;
        this.param = param;
        if (validMsg !== true) {
            console.error(validMsg);
        }
        var isAysn = _.isUndefined(param.url) !== true;

        var renderData = isAysn ? [] : param.data;
        if(!_.isUndefined(param.format) && _.isFunction(param.format)){
        	renderData = param.format(renderData);
        }
        if(!_.isArray(renderData)){
            console.error('data should be array!');
            return;
        }
        this.grid = new Ractive({
            el: param.el,
            template: template,
            data: {
            	data : renderData,
            	columns : param.columns,
            	isFunction :function(fun){
            		return _.isFunction(fun);
            	}
            }
        });


    };

    Ractivegrid.prototype.render = function() {
        this.grid.update();
    };

    Ractivegrid.prototype.fetch = function() {
        var param = this.param;
        var url = param.url;
        var self = this;
        if (_.isUndefined(url)) {
            console.warn('fetch not work for lacking url!');
            return false;
        }
        $.ajax({
            url: param.url
        }).done(function(data) {
            if(!_.isUndefined(param.format) && _.isFunction(param.format)){
            	data = param.format(data);
            }
            if(!_.isArray(data)){
            	console.error('data should be array!');
            	return;
            }
            self.grid.set('data', data);
        }).fail(function(error){
        	console.error('error happed: %s', error);
        });
    };

    function validParam(param) {
        if (!_.isObject(param)) {
            return 'param should be object';
        }
        if (_.isUndefined(param.columns) || !_.isArray(param.columns)) {
            return 'invalid columns';
        }
        if (_.isUndefined(param.el)) {
            return 'invalid el'
        }
        if (_.isUndefined(param.url) && _.isUndefined(param.data)) {
            return 'url or data needed';
        }
        return true;
    };
    window.Ractivegrid = Ractivegrid;
})(Ractive, jQuery, _);
