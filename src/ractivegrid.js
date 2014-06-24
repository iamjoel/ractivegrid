(function(Ractive, $, _) {
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
                + '<td class="{{getClass(data[i][j].isEdit)}}" on-dblclick="edit" data-row-index="{{i}}"  data-col-index="{{j}}">'
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
    	'<table class="ractivegrid table-striped table-bordered table-hover">'
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

        var startIndex = 0;
        var endIndex = Infinity;

        var paging = null;
        if(!_.isUndefined(param.paging) && param.paging.isPaging){
            paging = param.paging;
            endIndex = paging.getPageLimit();
        }

        var renderData = isAysn ? [] : this.getRendData(param.data, startIndex, endIndex, param.format);

        if(paging && !isAysn){
            var pageNum = parseInt(param.data.length / paging.getPageLimit(), 10) + 1;
            if(param.data.length % paging.getPageLimit() === 0){
                pageNum -= 1;
            }
            paging.setPageNum(pageNum);
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
                getClass : function(isEdit){
                    return isEdit ? 'editing' : '';
                }

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
            $td.find(':text').focus();
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
            var rowData = this.get('data.' + rowIndex);
            if(_.isFunction(param.onContentChange)){
                param.onContentChange(rowData, this.get('data'));
            }
        });

        if(paging){
            paging.addListener('onPageChange', function(pageAt){
                if(isAysn){
                    self.fetch(pageAt);
                } else{
                    var pageLimit = paging.getPageLimit();
                    var start = (pageAt - 1) * pageLimit;
                    var end = start + pageLimit;
                    self.grid.set('data', self.getRendData(param.data, start, end, param.format))
                }
            });
        }

        if(isAysn){
        	this.dfd = $.Deferred();
        	this.fetch(1);  // 向服务器取数据
            this.dfd.done(function(data){
                if(_.isFunction(param.success)){
                    param.success(data);
                }
            })
        }


    };

    /*
    * 包含 startIndx，不包含endIndex
    */
    Ractivegrid.prototype.getRendData = function(data, startIndex, endIndex, format){
        var renderData = data;
        if(!_.isUndefined(format) && _.isFunction(format)){
            renderData = format(renderData);
        }
        if(!_.isArray(renderData)){
            console.error('data should be array!');
            return;
        }

        return renderData.slice(startIndex, endIndex);
    }

    Ractivegrid.prototype.fetch = function(pageAt) {
        var param = this.param;
        var url = param.url;
        var self = this;
        if (_.isUndefined(url)) {
            console.warn('fetch not work for lacking url!');
            return false;
        }
        if(_.isFunction(url)){
            url = url(pageAt);
        }

        $.ajax({
            url: url
        }).done(function(data) {
            self.dfd.resolve(_.clone(data));
            data = self.getRendData(data, 0, Infinity, param.format);
            if(!_.isArray(data)){
            	console.error('data should be array!');
            	return;
            }
            self.grid.set('data', data);
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
