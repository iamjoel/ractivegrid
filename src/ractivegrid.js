define(['text!ractivegrid-template', 'css!ractivegrid-css'], function(template) {
    // IE8/IE9要先按F12打开IE Dev Tools才能使用console，否则会报错
    if (!window.console) {
        var emptyFn = function() {};
        window.console = {
            log: emptyFn,
            error: emptyFn,
            warn: emptyFn,
            info: emptyFn
        }
    }
    var undef = undefined;
    var defaultPageParam = {
        pageLimit: 10,
        pageSizeParamName: 'pageSize',
        enableSelectRow: false
    }
    var Ractivegrid = function(param) {
        var validMsg = validParam(param);
        var self = this;
        this.param = param;
        if (validMsg !== true) {
            console.error(validMsg);
        }

        var isAysn = param.url !== undef;

        var startIndex = 0;
        var endIndex = Infinity;

        var paging = null;
        if (param.paging !== undef && param.paging.isPaging) {
            paging = param.paging;
            param.pageParam = $.extend({}, defaultPageParam, param.pageParam);
            endIndex = param.pageParam.pageLimit;
            if (!isAysn) {
                var allDataLen = this.getRendData(param.data, 0, Infinity, param.format).length;
                param.paging.setPageNum(self.calPageNum(allDataLen, param.pageParam.pageLimit)); // 异步的是给外部来算的
            }
        }

        var renderData = isAysn ? [] : this.getRendData(param.data, startIndex, endIndex, param.format);


        this.grid = new Ractive({
            el: param.el,
            template: template,
            data: {
                data: renderData,
                columns: param.columns,
                enableSelectRow: param.enableSelectRow,
                getCellContent: function(data, columns, rowIndex, colIndex, fromRaw, toRaw) {
                    var rowData = data[rowIndex];
                    var cellData = rowData;
                    var nameArr = columns[colIndex].name.split('.');
                    $.each(nameArr, function(index, each) {
                        cellData = cellData[each];
                    });

                    var isEdit = (rowData && rowData[colIndex]) ? rowData[colIndex].isEdit : false;

                    if (typeof fromRaw === 'function') {
                        cellData = fromRaw(cellData, rowData);
                    }
                    return cellData;
                },
                getClass: function(data, columns, rowIndex, colIndex) {
                    var classNameArr = [];
                    if (data[rowIndex] && data[rowIndex][colIndex] && data[rowIndex][colIndex].isEdit) {
                        classNameArr.push('editing');
                    }
                    if (columns[colIndex].className) {
                        classNameArr.push(columns[colIndex].className);
                    }
                    return classNameArr.join(' ');
                }
            }
        });

        this.grid.on('edit', function(event) {
            var canEdit = this.get(event.keypath + '.editable');
            if (!canEdit) {
                return;
            }
            var $td = $(event.node).closest('td');
            var cellInfo = getCellInfo(event, this);
            var rowIndex = cellInfo.rowIndex;
            var colIndex = cellInfo.colIndex;
            this.set('data.' + rowIndex + '.' + colIndex + '.isEdit', true);
            this.set('editing', [rowIndex, colIndex]);
            $td.find(':text').focus();
        });

        this.grid.on('blur', function(event) {
            var $input = $(event.node);
            var cellInfo = getCellInfo(event, this);
            var rowIndex = cellInfo.rowIndex;
            var colIndex = cellInfo.colIndex;
            var columnName = cellInfo.columnName;
            var inputData = $input.val();
            var toRaw = this.get(event.keypath + '.toRaw');
            this.set('data.' + rowIndex + '.' + colIndex + '.isEdit', false);
            if (typeof toRaw === 'function') {
                inputData = toRaw(inputData);
            }
            this.set('data.' + rowIndex + '.' + columnName, inputData);
            var rowData = this.get('data.' + rowIndex);
            if (typeof param.onContentChange === 'function') {
                param.onContentChange(inputData, rowData, this.get('data'));
            }
        });



        // 修复ie，Firefox光标在输入框前面的bug
        this.grid.observe('editing', function(newValue, oldValue, keypath) {
            var rowIndex = newValue[0];
            var colIndex = newValue[1];
            var $input = $('[data-row-index=' + rowIndex + '][data-col-index=' + colIndex + ']').find(':text');
            $input.focus();
            var input = $input[0];
            var value = $input.val();
            var endPlace = value.length;
            if (input.setSelectionRange) { //ie9+,firefox,chrome
                input.setSelectionRange(endPlace, endPlace);
            } else {
                var range = input.createTextRange();
                range.moveEnd("character", endPlace);
                range.moveStart("character", endPlace);
            }
        });

        // 全选按钮
        this.$table = null;
        this.grid.on('all-checked', function(event) {
            var $checkbox = $(event.node);
            if (!self.$table) {
                self.$table = $checkbox.closest('table');
            }
            var $checkboxs = self.$table.find('tbody tr td:first-child :checkbox');
            $checkboxs.prop('checked', $checkbox.prop('checked'));
        });

        this.bindCellEvent();


        if (paging) {
            // todo add callback
            paging.addListener('onPageChange', function(pageAt) {
                if (isAysn) {
                    self.fetch(pageAt);
                } else {
                    var pageLimit = param.pageParam.pageLimit;
                    var start = (pageAt - 1) * pageLimit;
                    var end = start + pageLimit;
                    var renderData = self.getRendData(param.data, start, end, param.format);
                    self.grid.set('data', renderData);
                }
            });
        }

        if (isAysn) {
            this.dfd = $.Deferred();
            this.fetch(1); // 向服务器取数据
            this.dfd.done(function(data) {
                if ($.isFunction(param.success)) {
                    param.success(data.data, data.rawData);
                }
            });
        }


    };



    /*
     * 给单元格绑用户自定义事件
     */
    Ractivegrid.prototype.bindCellEvent = function() {
        var self = this;
        // 暂时只支持click
        this.grid.on('click', function(event) {
            self.clickHandler(self, event);
        });
    };

    Ractivegrid.prototype.clickHandler = function(ctx, event) {
        var parma = ctx.param;
        var cellInfo = getCellInfo(event, this.grid);
        var columnName = cellInfo.columnName;
        var rowIndex = cellInfo.rowIndex;
        var colIndex = cellInfo.colIndex;
        var eventInfo = getEventInfo(parma, colIndex, 'click');
        var rowdata = ctx.grid.get('data.' + rowIndex);
        var cellData = ctx.grid.get('data.' + rowIndex + '.' + columnName);
        var target = event.original.originalTarget || event.original.srcElement;// firefox chrome 元素不太一样
        var $parent = $(event.node);
        if (eventInfo) {
            eventInfo.forEach(function(each) {
                var canExcute = true;
                if (each.el) { // 判断点击的el，是否为目标el todo 有问题
                    if ($parent.find(each.el).length === 0 || $parent.find(each.el)[0] !== target) {
                        canExcute = false;
                    }
                }
                if (canExcute) {
                    each.fn(event.original, cellData, rowdata);
                }
            });
        }
    };

    Ractivegrid.prototype.getSelectRowsInfo = function(){
        var self = this;
        if(!this.$table){
            this.$table = $(this.param.el).find('table');
        }
        var $SelectChecked = this.$table.find('tbody tr td:first-child :checkbox:checked');
        var info = [];
        $SelectChecked.each(function(){
            var $checkbox = $(this);
            var rowIndex = $checkbox.data('row-index');
            info.push(self.grid.get('data.' + rowIndex));

        });
        return info;
    }


    function getEventInfo(param, colIndex, type) {
        var columns = param.columns;
        var cellParm = columns[colIndex];
        var events = cellParm.event;
        if (!events) {
            return false;
        }
        var eventInfo = []; // {'click':..,'click btn':...}
        var eventsReg = /^(click|hover)(?: (.*))?$/;
        for (var key in events) {
            var regRes = eventsReg.exec(key);
            if (regRes && regRes[1] === type) {
                eventInfo.push({
                    el: regRes[2],
                    fn: events[key]
                });
            }
        }
        return eventInfo;
    }

    /*
     * 包含 startIndx，不包含endIndex
     */
    Ractivegrid.prototype.getRendData = function(data, startIndex, endIndex, format) {
        var renderData = data;
        if (format !== undefined && $.isFunction(format)) {
            renderData = format(renderData);
        }
        if (!$.isArray(renderData)) {
            console.error('data should be array!');
            return;
        }

        return renderData.slice(startIndex, endIndex);
    }

    Ractivegrid.prototype.fetch = function(pageAt) {
        var param = this.param;
        var url = param.url;
        var self = this;
        if (url === undefined) {
            console.warn('fetch not work for lacking url!');
            return false;
        }
        if ($.isFunction(url)) {
            url = url(pageAt);
        }

        $.ajax({
            url: url,
            dataType: 'json'
        }).done(function(rawData) {
            var data = self.getRendData(rawData, 0, Infinity, param.format);
            if (!$.isArray(data)) {
                console.error('data should be array!');
                return;
            }
            self.grid.set('data', data);
            self.dfd.resolve({
                data: cloneArray(data),
                rawData: rawData
            });
        }).fail(function(error) {
            self.dfd.reject();
            console.error('error happed: %s', error);
        });
    };

    Ractivegrid.prototype.getData = function() {
        return this.grid.get('data');
    };

    Ractivegrid.prototype.setData = function(data) {
        this.grid.set('data', cloneArray(data)); // 为了不影响外部的data
    };

    Ractivegrid.prototype.appendData = function(appendData) {
        var data = this.getData('data');
        data.push(appendData);
        this.grid.set('data', data);
    };

    Ractivegrid.prototype.calPageNum = function(dataLenth, pageLimit) {
        var pageSize = parseInt(dataLenth / pageLimit, 10) + 1;
        if (dataLenth % pageLimit === 0) {
            pageSize -= 1;
        }
        return pageSize;
    };

    function getCellInfo(event, grid) {
        var info = {};
        var $input = $(event.node);
        var $td = $input.closest('td');
        info.rowIndex = $td.data('row-index');
        info.colIndex = $td.data('col-index');
        info.columnName = grid.get(event.keypath + '.name');
        return info;
    }

    function validParam(param) {
        if (typeof param !== 'object') {
            return 'param should be object';
        }
        if (param.columns === undefined || !$.isArray(param.columns)) {
            return 'invalid columns';
        }
        if (param.el === undefined) {
            return 'invalid el'
        }
        if (param.url === undefined && param.data === undefined) {
            return 'url or data needed';
        }
        return true;
    };

    function cloneArray(srcArr) {
        var tarArr = [];
        srcArr.forEach(function(each) {
            tarArr.push(each);
        });
        return tarArr;
    }

    return Ractivegrid;
});
