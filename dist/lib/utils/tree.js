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
import { createHashFromObjectArray } from '.';
/** 只含有单个root节点 */
export var onlyOneRoot = function (data) {
    var lines = data.lines, nodes = data.nodes;
    if (nodes.length <= 1) {
        return true;
    }
    var lineHashByEnd = lines.reduce(function (pre, cur) {
        var _a;
        return (__assign(__assign({}, pre), (_a = {}, _a[cur.end] = cur, _a)));
    }, {});
    return nodes.filter(function (item) { return !lineHashByEnd[item.id]; }).length === 1;
};
/** 单个父节点 */
export var onlyOneParent = function (data) {
    var lines = data.lines;
    var lineEndHash = {};
    for (var i = 0; i < lines.length; i += 1) {
        var _a = lines[i], start = _a.start, end = _a.end;
        var parent_1 = start.split('-')[0];
        if (!lineEndHash[end]) {
            lineEndHash[end] = parent_1;
        }
        else if (lineEndHash[end] !== parent_1) {
            return false;
        }
    }
    return true;
};
/** 判断树是否有环 */
export var hasRing = function (data) {
    var flagHash = {};
    var findRing = function (node) {
        var id = "".concat(node.id);
        if (!flagHash[id]) {
            flagHash[id] = node;
            if (Array.isArray(node.childrenList)) {
                for (var i = 0; i < node.childrenList.length; i += 1) {
                    if (findRing(node.childrenList[i])) {
                        return true;
                    }
                }
                return false;
            }
            return false;
        }
        return true;
    };
    return findRing(data);
};
export var processTree = function (root, process) {
    if (Array.isArray(root.childrenList)) {
        // eslint-disable-next-line no-param-reassign
        root.childrenList = root.childrenList.map(function (children) { return processTree(children, process); });
    }
    return process(root);
};
/** 将数据转化为树结构 */
export var convertToTree = function (_a, process) {
    var nodes = _a.nodes, lines = _a.lines;
    var nodeHash = createHashFromObjectArray(nodes, 'id');
    var lineEndHash = createHashFromObjectArray(lines, 'end');
    var relationShipHash = lines.reduce(function (pre, cur) {
        var _a, _b;
        var relationHash = pre.relationHash, childrenListHash = pre.childrenListHash;
        var _c = cur.start.split('-'), parent = _c[0], anchor = _c[1];
        if (!Array.isArray(childrenListHash[parent])) {
            childrenListHash[parent] = [];
        }
        if (!relationHash[cur.end]) {
            relationHash[cur.end] = { parent: parent, anchors: [] };
        }
        var relation = __assign(__assign({}, relationHash[cur.end]), { anchors: __spreadArray(__spreadArray([], relationHash[cur.end].anchors, true), [anchor], false) });
        var childrenList = _.uniq(__spreadArray(__spreadArray([], childrenListHash[parent], true), [cur.end], false));
        return {
            relationHash: __assign(__assign({}, relationHash), (_a = {}, _a[cur.end] = relation, _a)),
            childrenListHash: __assign(__assign({}, childrenListHash), (_b = {}, _b[parent] = childrenList, _b)),
        };
    }, { relationHash: {}, childrenListHash: {} });
    nodes.forEach(function (item) {
        var childrenListHash = relationShipHash.childrenListHash, relationHash = relationShipHash.relationHash;
        if (Array.isArray(childrenListHash["".concat(item.id)])) {
            // eslint-disable-next-line no-param-reassign
            item.childrenList = childrenListHash["".concat(item.id)].map(function (nodeId) {
                nodeHash[nodeId].anchors = relationHash[nodeId].anchors;
                nodeHash[nodeId].parent = relationHash[nodeId].parent;
                return nodeHash[nodeId];
            });
        }
    });
    var root = nodes.find(function (item) { return !lineEndHash["".concat(item.id)]; });
    if (!root) {
        return null;
    }
    if (process) {
        root = processTree(root, process);
    }
    return root;
};
//# sourceMappingURL=tree.js.map