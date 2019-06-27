/* eslint-disable no-debugger */
/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { ITopologyData, ITopologyNode, IPosition } from '../declare';
import {
    onlyOneParent,
    onlyOneRoot,
    convertToTree,
} from './tree';
import { getNodeSize } from '.';
import config from '../config';

type SortChilren = (parent: ITopologyNode, childrenList: ITopologyNode[]) => ITopologyNode[];

interface LayoutOptions {
    sortChildren?: SortChilren;
}

interface RectSize {
    width: number;
    height: number;
}

interface ContainerRect extends RectSize {
    position?: IPosition;
}

interface TreeNode extends ITopologyNode {
    clientRect?: ClientRect;
    containerRect?: ContainerRect;
    childrenList?: ITopologyNode[];
}

function computeClientRect(node: TreeNode) {
    node.clientRect = getNodeSize(node.id);
    return node;
}

function getTreeNode(data: ITopologyData): TreeNode | null {
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

function computeContainerSize(node: TreeNode): RectSize {
    const children = node.childrenList;

    if (Array.isArray(node.childrenList)) {
        const childrenSize = children.map(computeContainerSize);
        const horizontalSpacing = (childrenSize.length - 1) * config.autoLayout.horizontalSpacing;
        const childrenWidth = _.sumBy(childrenSize, 'width');
        const childrenHeight = _.maxBy(childrenSize, 'height').height;

        node.containerRect = {
            width: Math.max(node.clientRect.width, childrenWidth + horizontalSpacing),
            height: node.clientRect.height + childrenHeight + config.autoLayout.verticalSpacing,
        };
    } else {
        node.containerRect = {
            width: node.clientRect.width,
            height: node.clientRect.height,
        };
    }
    return _.cloneDeep(node.containerRect);
}

function computePosition(node: TreeNode, containerPosition: IPosition, sortChildren?: SortChilren) {
    const { containerRect } = node;
    const nodeWidth = node.clientRect.width;
    const nodeHeight = node.clientRect.height;

    node.position = {
        // 把节点移动到容器框的中间位置
        x: containerPosition.x + (containerRect.width - nodeWidth) / 2,
        y: containerPosition.y,
    };
    if (Array.isArray(node.childrenList)) {
        if (sortChildren) {
            node.childrenList = sortChildren(node, node.childrenList);
        }
        const childrenWidth = node.childrenList.reduce(
            (pre, cur) => pre + cur.containerRect.width,
            (node.childrenList.length - 1) * config.autoLayout.horizontalSpacing,
        );
        const childrenPositionY = node.position.y + nodeHeight + config.autoLayout.verticalSpacing;
        let childrenPositionX = containerPosition.x + (containerRect.width - childrenWidth) / 2;
        for (let i = 0; i < node.childrenList.length; i += 1) {
            const chlid = node.childrenList[i];
            computePosition(
                chlid,
                { x: childrenPositionX, y: childrenPositionY },
                sortChildren,
            );
            childrenPositionX += (chlid.containerRect.width + config.autoLayout.horizontalSpacing);
        }
    }
}

function convertTreeToArray(treeNode: TreeNode): ITopologyNode[] {
    const nodes: ITopologyNode[] = [treeNode];
    for (let i = 0; i < nodes.length; i += 1) {
        const { childrenList } = nodes[i];
        // 删除为计算布局添加的额外属性
        delete nodes[i].childrenList;
        delete nodes[i].clientRect;
        delete nodes[i].containerRect;
        if (Array.isArray(childrenList)) {
            childrenList.forEach(item => nodes.push(item));
        }
    }
    return nodes;
}

function computeLayout(data: ITopologyData, options: LayoutOptions) {
    const tree = getTreeNode(data);
    if (!tree) {
        return data.nodes;
    }
    const containerSize = computeContainerSize(tree);
    const position = {
        x: (config.canvas.width - containerSize.width) / 2,
        y: (config.canvas.height - containerSize.height) / 2,
    };
    computePosition(tree, position, options ? options.sortChildren : undefined);
    return convertTreeToArray(tree);
}

export default computeLayout;
