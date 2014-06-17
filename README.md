# ractivegrid
将异步/本地数据填入表格中。    

依赖 [ractive](http://www.ractivejs.org/),jQuery

## 例子
```
var columns = [
	{
		name: 'name', // 数据中的值
		label: '姓名', // 列名
		editable: true
	},
	{
		name: 'sex',
		label: '性别',
		fromRaw: function(data){
			if(data.sex === 1){
				return '男';
			} else {
				return '女';
			}

		},
		toRaw: function(cellData, rowData){
			if(data.sex === 1){
				return '男';
			} else {
				return '女';
			}

		}
	}
];

var userData = {
	success : 1,
	data : [
		{
			name: 'joel',
			sex: 1
		},
		{
			name: 'jack',
			sex: 1
		}
	]
};

var userGrid = new Ractivegrid({
	data : userData,
	columns: columns,// 列名
	el : '#output',
	format : function(data){
		if(data.success === 1){
			return data.data;
		} else {
			return [];
		}
	}
});

userGrid.render();

var ajaxUserGrid = new ractivegrid({
	url : '/user/',
	columns: columns,
	el : '#output',
	updateUrl : function(rowData){}//更新某一列
});

ajaxUserGrid.fetch();// 向服务器端取数据
ajaxUserGrid.render();

```