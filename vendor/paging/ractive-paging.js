define(['text!paging-template', 'css!paging-css'], function(template) {
    var config = {};
    var defaultParam = {
        'showPagingNavNum': 5,
        'pageAt': 1,
        'pageNum': 0
    };

    function Paging(param) {
        var self = this;
        this.isPaging = true;
        this.param = $.extend({}, defaultParam, param);
        param = this.param;

        var validMsg = validParam(param);
        if (validMsg !== true) {
            console.error(validMsg);
            return;
        }

        this.paging = new Ractive({
            el: param.el,
            template: template,
            data: {
                pageNum: param.pageNum,
                pageAt: param.pageAt,
                pageArray: makePageArray(param.pageAt, param.pageNum, param.showPagingNavNum),
                getStatus: function(index, pageAt) {
                    return index === pageAt ? 'active' : '';
                },
                getPrevStatus: function(pageAt) {
                    return pageAt <= 1 ? 'disabled' : '';
                },
                getNextStatus: function(pageAt, pageNum) {
                    return pageAt >= pageNum ? 'disabled' : '';
                }
            }
        });

        this.paging.on('changePage', function(event) {
            var pageAt = parseInt($(event.node).data('index'), 10);
            changPage(pageAt);
        });

        this.paging.on('prevPage', function(event) {
            var pageAt = this.get('pageAt') - 1;
            if (pageAt >= 1) {
                changPage(pageAt);
            }
        });

        this.paging.on('nextPage', function(event) {
            var pageAt = this.get('pageAt') + 1;
            if (pageAt <= self.paging.get('pageNum')) {
                changPage(pageAt);
            }
        });

        function changPage(pageAt) {
            self.paging.set('pageAt', pageAt);
            self.updatePageNav();
            if ($.isFunction(param.pageChange)) {
                param.pageChange(pageAt);
            }
        }

    }

    Paging.prototype.setPageNum = function(pageNum) {
        this.paging.set('pageNum', pageNum);
        this.updatePageNav();
    };

    Paging.prototype.updatePageNav = function() {
        var param = this.param;
        this.paging.set('pageArray', makePageArray(this.paging.get('pageAt'), this.paging.get('pageNum'), param.showPagingNavNum));
    };

    Paging.prototype.getPageLimit = function(first_argument) {
        return this.param.pageLimit;
    };

    Paging.prototype.addListener = function(type, callback) {
        switch (type) {
            case 'onPageChange':
                this.param.pageChange = callback;
                break;
            default:
                console.error('not support event type');
        }
    };

    function makePageArray(pageAt, pageNum, showPagingNavNum) {
        var array = [];
        var start;
        var end;
        if (pageNum <= showPagingNavNum) { // 全部显示
            start = 1;
            end = pageNum + 1;// 因为不包括end
        } else {
            if (pageAt - parseInt(showPagingNavNum / 2, 10) <= 0) {
                start = 1;
            } else if (pageAt + parseInt(showPagingNavNum / 2, 10) > pageNum) {
                start = pageNum - showPagingNavNum + 1;
            } else {
                start = pageAt - parseInt(showPagingNavNum / 2, 10);
            }
            end = start + showPagingNavNum;
            if (end >= pageNum + 1) {
                end = pageNum + 1;
            }
        }

        for (var i = start; i < end; i++) {
            array.push(i);
        }
        return array;
    }

    function validParam(param) {
        if (typeof param !== 'object') {
            return 'param should be object';
        }
        if (param.el === undefined) {
            return 'invalid el'
        }
        return true;
    };

    return Paging;
});
