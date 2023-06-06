var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/* eslint-disable no-debugger */
import _ from 'lodash';
import { isMatchKeyValue } from '.';
export var SelectMode;
(function (SelectMode) {
    /** 只会选中单个节点 */
    SelectMode[SelectMode["SINGLE"] = 0] = "SINGLE";
    /** 会选中当前节点以及同组件其他节点 */
    SelectMode[SelectMode["NORMAL"] = 1] = "NORMAL";
    SelectMode[SelectMode["MUL_NORMAL"] = 2] = "MUL_NORMAL";
    SelectMode[SelectMode["MULTI"] = 3] = "MULTI";
    SelectMode[SelectMode["RIGHT_NORMAL"] = 4] = "RIGHT_NORMAL";
    /** 框选 */
    SelectMode[SelectMode["BOX_SELECTION"] = 5] = "BOX_SELECTION";
})(SelectMode || (SelectMode = {}));
function getChildren(parent, lines) {
    return lines.map(function (item) {
        var _parent = item.start.split('-')[0];
        if (_parent === parent) {
            return item.end;
        }
        return null;
    }).filter(function (item) { return item !== null; });
}
/** 取消选中节点 */
function cancelSelect(params) {
    var selectedData = params.selectedData, mode = params.mode, node = params.node, nodeList = params.nodeList;
    if (mode === SelectMode.NORMAL) {
        return { nodes: [], lines: [] };
    }
    var currNodeIdSet = new Set(node.id);
    nodeList.forEach(function (n) { return currNodeIdSet.add(n.id); });
    var lines = selectedData.lines.filter(function (item) {
        if (currNodeIdSet.has(item.end)) {
            return false;
        }
        if (currNodeIdSet.has(item.start.split('-')[0])) {
            return false;
        }
        return true;
    });
    var nodes;
    if (mode === SelectMode.MUL_NORMAL || mode === SelectMode.BOX_SELECTION) {
        nodes = selectedData.nodes.filter(function (item) { return !currNodeIdSet.has(item.id); });
    }
    else {
        var filterArray_1 = __spreadArray(__spreadArray([], getChildren(node.id, selectedData.lines), true), nodeList.map(function (n) { return n.id; }), true);
        nodes = selectedData.nodes.filter(function (item) { return filterArray_1.indexOf(item.id) === -1; });
    }
    return { nodes: nodes, lines: lines };
}
export var getLinesFromNode = function (allLines, nodes) {
    if (nodes.length === 0) {
        return [];
    }
    var set = new Set(nodes.map(function (n) { return n.id; }));
    return allLines.filter(function (line) { return set.has(line.start.split('-')[0]) && set.has(line.end.split('-')[0]); });
};
var getCombineNodes = function (data, combineId) {
    if (!combineId) {
        return [];
    }
    return data.nodes.filter(function (item) { return item.combineId === combineId; });
};
/**
 * 选中规则：
 * 1. CTRL/COMMAND: 选中当前节点，并同时选中在已选节点中与当前节点呈父子关系的连线
 * 2. CTRL/COMMAND + SHIFT: 选中当前节点，并同时选中子节点及同子节点的连线
 */
var selectNodes = function (_a) {
    var data = _a.data, selectedData = _a.selectedData;
    function hasSelected(node) {
        return selectedData.nodes.find(function (item) { return item.id === node.id; }) !== undefined;
    }
    return function (_a) {
        var node = _a.node, mode = _a.mode;
        if (mode === SelectMode.SINGLE) {
            return { nodes: [node], lines: [] };
        }
        var currWillSelectNodeList = getCombineNodes(data, node.combineId); // 当前节点的合并节点
        var hasCombineNode = currWillSelectNodeList.length > 0;
        if (!hasCombineNode) {
            currWillSelectNodeList.push(node);
        }
        // 选中的组件中是否有拖拽子节点的组件
        var hasChildNodeList = currWillSelectNodeList.filter(function (n) { return n.dragChild || isMatchKeyValue(n, 'dragChild', true); });
        var shouldSelectNodeSet = new Set(currWillSelectNodeList.map(function (item) { return item.id; }));
        // 原先已经选择了的节点
        var didSelectedNodesId = selectedData.nodes.map(function (item) { return item.id; });
        var didSelectedNodeIdSet = new Set(didSelectedNodesId);
        // 子节点数组
        var childNodeList = [];
        hasChildNodeList.forEach(function (curNode) {
            var childIds = data.lines.filter(function (n) { return n.start.split('-')[0] === curNode.id; }).map(function (n) { return n.end; });
            var childNodes = data.nodes.filter(function (n) { return !shouldSelectNodeSet.has(n.id) && childIds.indexOf(n.id) > -1; });
            childNodeList.push.apply(childNodeList, childNodes);
        });
        // eslint-disable-next-line no-shadow
        childNodeList.forEach(function (node) {
            if (shouldSelectNodeSet.has(node.id)) {
                return;
            }
            currWillSelectNodeList.push(node);
            shouldSelectNodeSet.add(node.id);
        });
        if (hasSelected(node)) {
            return cancelSelect({
                selectedData: selectedData,
                mode: mode,
                node: node,
                nodeList: __spreadArray([], currWillSelectNodeList, true),
                data: data
            });
        }
        var children = getChildren(node.id, data.lines);
        var selectedChildren = _.intersection(children, didSelectedNodesId);
        var shouldSelectedLines = getLinesFromNode(data.lines, currWillSelectNodeList);
        if (mode === SelectMode.NORMAL || mode === SelectMode.RIGHT_NORMAL) {
            return {
                nodes: currWillSelectNodeList,
                lines: shouldSelectedLines,
            };
        }
        if (mode === SelectMode.MUL_NORMAL || mode === SelectMode.BOX_SELECTION) {
            var resNodes_1 = data.nodes.filter(function (item) { return shouldSelectNodeSet.has(item.id) || didSelectedNodeIdSet.has(item.id); });
            return {
                nodes: resNodes_1,
                lines: getLinesFromNode(data.lines, resNodes_1),
            };
        }
        // 复选模式下选中节点同时选中节点的子节点及关系线段
        var unSelectedChildren = _.difference(children, selectedChildren);
        // eslint-disable-next-line array-callback-return
        data.nodes.filter(function (item) {
            if (unSelectedChildren.indexOf(item.id) > -1) {
                didSelectedNodeIdSet.add(item.id);
            }
        });
        var resNodes = data.nodes.filter(function (item) { return shouldSelectNodeSet.has(item.id) || didSelectedNodeIdSet.has(item.id); });
        return {
            nodes: resNodes,
            lines: getLinesFromNode(data.lines, resNodes),
        };
    };
};
export default selectNodes;
//# sourceMappingURL=selectNodes.js.map