/* eslint-disable no-debugger */
/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { onlyOneParent, onlyOneRoot, convertToTree, } from './tree';
import { getNodeSize } from '.';
import config from '../config';
function computeClientRect(node) {
    node.clientRect = getNodeSize(node.id);
    return node;
}
function getTreeNode(data) {
    if (data.nodes.length <= 0) {
        return null;
    }
    // 不满足树的条件
    if (!onlyOneParent(data) || !onlyOneRoot(data)) {
        return null;
    }
    // 将数组转为树结构，并获取节点的dom大小
    return convertToTree(data, computeClientRect);
}
function computeContainerSize(node) {
    var children = node.childrenList;
    if (Array.isArray(node.childrenList)) {
        var childrenSize = children.map(computeContainerSize);
        var horizontalSpacing = (childrenSize.length - 1) * config.autoLayout.horizontalSpacing;
        var childrenWidth = _.sumBy(childrenSize, 'width');
        var childrenHeight = _.maxBy(childrenSize, 'height').height;
        node.containerRect = {
            width: Math.max(node.clientRect.width, childrenWidth + horizontalSpacing),
            height: node.clientRect.height + childrenHeight + config.autoLayout.verticalSpacing,
        };
    }
    else {
        node.containerRect = {
            width: node.clientRect.width,
            height: node.clientRect.height,
        };
    }
    return _.cloneDeep(node.containerRect);
}
function computePosition(node, containerPosition, sortChildren) {
    var containerRect = node.containerRect;
    var nodeWidth = node.clientRect.width;
    var nodeHeight = node.clientRect.height;
    node.position = {
        // 把节点移动到容器框的中间位置
        x: containerPosition.x + (containerRect.width - nodeWidth) / 2,
        y: containerPosition.y,
    };
    if (Array.isArray(node.childrenList)) {
        if (sortChildren) {
            node.childrenList = sortChildren(node, node.childrenList);
        }
        var childrenWidth = node.childrenList.reduce(function (pre, cur) { return pre + cur.containerRect.width; }, (node.childrenList.length - 1) * config.autoLayout.horizontalSpacing);
        var childrenPositionY = node.position.y + nodeHeight + config.autoLayout.verticalSpacing;
        var childrenPositionX = containerPosition.x + (containerRect.width - childrenWidth) / 2;
        for (var i = 0; i < node.childrenList.length; i += 1) {
            var chlid = node.childrenList[i];
            computePosition(chlid, { x: childrenPositionX, y: childrenPositionY }, sortChildren);
            childrenPositionX += (chlid.containerRect.width + config.autoLayout.horizontalSpacing);
        }
    }
}
function convertTreeToArray(treeNode) {
    var nodes = [treeNode];
    for (var i = 0; i < nodes.length; i += 1) {
        var childrenList = nodes[i].childrenList;
        // 删除为计算布局添加的额外属性
        delete nodes[i].childrenList;
        delete nodes[i].clientRect;
        delete nodes[i].containerRect;
        if (Array.isArray(childrenList)) {
            childrenList.forEach(function (item) { return nodes.push(item); });
        }
    }
    return nodes;
}
function computeLayout(data, options) {
    var tree = getTreeNode(data);
    if (!tree) {
        return data.nodes;
    }
    var containerSize = computeContainerSize(tree);
    var position = {
        x: (config.canvas.width - containerSize.width) / 2,
        y: (config.canvas.height - containerSize.height) / 2,
    };
    computePosition(tree, position, options ? options.sortChildren : undefined);
    return convertTreeToArray(tree);
}
export default computeLayout;
//# sourceMappingURL=computeLayout.js.map