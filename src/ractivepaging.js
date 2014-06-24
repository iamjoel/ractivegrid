(function(Ractive, $, _) {
	var defaultParam = {
		pageLimit : 10,
		pageAt: 1,
		pageNum: 0
	};

	var template =
		'{{#pageNum >= 1}}' +
			'<ul class="ra-paging">'
				+ '<li class="{{getPrevStatus(pageAt)}}">'
					+ '<a on-click="prevPage" href="javascript:void(0);">上一页</a>'
				+'</li>'
			+ '{{#pageArray:i}}'
				+ '<li class="{{getStatus(., pageAt)}}">'
				+ '<a on-click="changePage" href="javascript:void(0);" data-index="{{.}}">{{.}}</a>'
				+ '</li>'
			+ '{{/pageArray}}'
				+ '<li class="{{getNextStatus(pageAt, pageArray.length)}}">'
					+ '<a on-click="nextPage" href="javascript:void(0);">下一页</a>'
				+'</li>'
			+ '</ul>'
		+ '{{/pageNum}}';
	function Paging(param){
		var self = this;
		this.isPaging = true;
		this.param = _.extend({}, defaultParam, param);
		param = this.param;

        var validMsg = validParam(param);
		if(validMsg !== true){
			console.error(validMsg);
			return;
		}

		this.paging = new Ractive({
            el: param.el,
            template: template,
            data:{
            	pageAt: param.pageAt,
            	getStatus: function(index, pageAt){
            		return index === pageAt ? 'active' : '';
            	},
            	getPrevStatus: function(pageAt){
            		return pageAt <= 1 ? 'disabled' : '';
            	},
            	getNextStatus: function(pageAt, pageNum){
            		return pageAt >= pageNum ? 'disabled' : '';
            	}
            }
        });

        this.paging.on('changePage', function(event){
        	var pageAt = parseInt($(event.node).text(), 10);
        	changPage(pageAt);
        });

        this.paging.on('prevPage', function(event){
        	var pageAt = this.get('pageAt') - 1;
        	if(pageAt >= 1){
        		changPage(pageAt);
        	}
        });

        this.paging.on('nextPage', function(event){
        	var pageAt = this.get('pageAt');
        	if(pageAt <= param.pageNum){
        		changPage(pageAt);
        	}
        });

        function changPage(pageAt){
        	self.paging.set('pageAt', pageAt);
        	if(_.isFunction(param.pageChange)){
        		param.pageChange(pageAt);
        	}
        }

	}

	Paging.prototype.setPageNum = function(pageNum){
		this.paging.set('pageNum', pageNum);
		this.paging.set('pageArray', makePageArray(pageNum));
	};

	Paging.prototype.getPageLimit = function(first_argument) {
		return this.param.pageLimit;
	};

	Paging.prototype.addListener = function(type, callback){
		switch(type){
			case 'onPageChange':
				this.param.pageChange = callback;
				break;
			default:
				console.error('not support event type');
		}
	};

	function makePageArray(number){
		var array = [];
		for(var i = 0; i < number; i++){
			array.push(i + 1);
		}
		return array;
	}
	function validParam(param) {
        if (!_.isObject(param)) {
            return 'param should be object';
        }
        if (_.isUndefined(param.el)) {
            return 'invalid el'
        }
        return true;
    };

	window.Ractivepaging = Paging;
})(Ractive, jQuery, _);