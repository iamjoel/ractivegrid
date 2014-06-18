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
			+ '{{#columns:j}}'
                + '<td on-dblclick="edit" data-row-index="{{i}}"  data-col-index="{{j}}">'
                +  '{{# data[i][j].isEdit}}'
                    + '<input on-blur="blur" value="{{getCellContent(data, columns, i, j, fromRaw, toRaw)}}"/>'
                +  '{{/ data[i][j].isEdit}}'
                +  '{{^ data[i][j].isEdit}}'
                    + '{{{getCellContent(data, columns, i, j, fromRaw, toRaw)}}}'
                +  '{{/ data[i][j].isEdit}}'

                + '</td>'
			+ '{{/columns}}'
    		+ '</tr>'
		+ '{{/data}}'
		+ '</tbody>';
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
                getCellContent: function(data, columns, rowIndex, colIndex, fromRaw, toRaw){
                    var cellData = data[rowIndex][columns[colIndex].name];
                    var rowData = data[rowIndex];
                    var isEdit = (rowData && rowData[colIndex]) ?  rowData[colIndex].isEdit : false;

                    if(_.isFunction(fromRaw)){
                        cellData = fromRaw(cellData,rowData);
                    }
                    return cellData;
                },

            }
        });

        this.grid.on('edit', function(event){
            var canEdit = this.get(event.keypath + '.editable');
            if(!canEdit){
                return;
            }
            var $td = $(event.node).closest('td');
            var rowIndex =  $td.data('row-index');
            var colIndex =  $td.data('col-index');
            this.set('data.' + rowIndex + '.' + colIndex + '.isEdit', true);
        });

        this.grid.on('blur', function(event){
            var $input = $(event.node);
            var $td = $input.closest('td');
            var rowIndex =  $td.data('row-index');
            var colIndex =  $td.data('col-index');
            var columnName = this.get(event.keypath + '.name');
            var inputData = $input.val();
            var toRaw = this.get(event.keypath + '.toRaw');
            this.set('data.' + rowIndex + '.' + colIndex + '.isEdit', false);
            if(_.isFunction(toRaw)){
                inputData = toRaw(inputData);
            }
            this.set('data.' + rowIndex + '.' + columnName, inputData);
        });

        if(isAysn){
        	this.dfd = $.Deferred();
        	this.fetch();
        }


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
            self.dfd.resolve();
        }).fail(function(error){
            self.dfd.reject();
        	console.error('error happed: %s', error);
        });
    };

	Ractivegrid.prototype.getData = function(){
		return this.grid.get('data');
    };

    Ractivegrid.prototype.setData = function(data){
		this.grid.set('data', data);
    };

    Ractivegrid.prototype.appendData = function(appendData){
    	var data = this.getData('data');
    	data.push(appendData);
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
