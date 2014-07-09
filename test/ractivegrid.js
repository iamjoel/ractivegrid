describe("ractivegrid.js", function() {
    // http://jasmine.github.io/2.0/introduction.html
    var columns = [{
        name: 'name', // 数据中的值
        label: '姓名', // 列名
        'className': 'name-class' // 元素上加类名
    }, {
        name: 'sex',
        label: '性别',
        fromRaw: function(cellData, rawData) {
            if (parseInt(cellData) === 1) {
                return '男';
            } else {
                return '女';
            }
        }
    }, {
        name: 'other.age', // 层级 {other.age}
        label: '年龄'
    }];

    var userData = {
        success: 1,
        data: [{
            name: 'joel',
            sex: 1,
            "other": {
                "age": 17
            }
        }, {
            name: 'lili',
            sex: 0,
            "other": {
                "age": 15
            }
        }]
    };

    var userGrid;
    var $output;
    var $table;

    beforeEach(function() {
        userGrid = new Ractivegrid({
            data: userData,
            columns: columns, // 列名
            el: '#output',
            format: function(data) {
                if (data.success === 1) {
                    return data.data;
                } else {
                    return [];
                }
            }
        });
        $output = $('#output');
        $table = $output.find('table');
    });

    it("should render the output", function() {
        expect($table.length).toEqual(1);
    });

    it("should add the class name to the cell", function() {
        expect($output.find('.name-class').length > 0).toEqual(true);
        expect($output.find('.name-class').is('td')).toEqual(true);
    });
});
