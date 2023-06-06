var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import _ from 'lodash';
export default function deleteSelectedData(data, selectedData) {
    var deleteNodes = selectedData.nodes;
    var deleteNodesIdMap = deleteNodes
        .map(function (item) { return item.id; })
        .reduce(function (pre, cur) {
        var _a;
        return (__assign(__assign({}, pre), (_a = {}, _a[cur] = cur, _a)));
    }, {});
    var shouldDeleteLines = data.lines.filter(function (item) {
        var parent = item.start.split('-')[0];
        var child = item.end;
        if (deleteNodesIdMap[parent] || deleteNodesIdMap[child]) {
            return true;
        }
        return false;
    });
    var deleteLines = _.uniqWith(__spreadArray(__spreadArray([], shouldDeleteLines, true), selectedData.lines, true), _.isEqual);
    return {
        nodes: _.differenceBy(data.nodes, deleteNodes, 'id'),
        lines: _.differenceWith(data.lines, deleteLines, _.isEqual),
    };
}
//# sourceMappingURL=deleteSelectedData.js.map