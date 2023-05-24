/* eslint-disable no-debugger */
import _ from 'lodash';
import { isMatchKeyValue } from '.';
import { ITopologyData, ITopologyNode, ITopologyLine } from '../declare';

interface PremiseParams {
    data: ITopologyData;
    selectedData: ITopologyData;
}

export enum SelectMode {
    /** 只会选中单个节点 */
    SINGLE,
    /** 会选中当前节点以及同组件其他节点 */
    NORMAL,
    MUL_NORMAL,
    MULTI,
    RIGHT_NORMAL,
    /** 框选 */
    BOX_SELECTION
}

export interface ProduceselectedDataFunc {
    (params: {
        node: ITopologyNode;
        mode: SelectMode;
    }): ITopologyData;
}

interface SelectNodesFunc {
    (param: PremiseParams): ProduceselectedDataFunc;
}

function getChildren(parent: string, lines: ITopologyLine[]) {
    return lines.map((item) => {
        const [_parent] = item.start.split('-');
        if (_parent === parent) {
            return item.end;
        }
        return null;
    }).filter(item => item !== null);
}

function getParents(child: string, lines: ITopologyLine[]) {
    return lines.map((item) => {
        const [parent] = item.start.split('-');
        if (item.end === child) {
            return parent;
        }
        return null;
    }).filter(item => item !== null);
}

/** 取消选中节点 */
function cancelSelect(params: {
    selectedData: ITopologyData;
    mode: SelectMode;
    node: ITopologyNode;
    nodeList: ITopologyNode[];
    data: ITopologyData;
}) {
    const {
        selectedData,
        mode,
        node,
        nodeList,
    } = params;
    if (mode === SelectMode.NORMAL) {
        return { nodes: [], lines: [] };
    }
    const currNodeIdSet = new Set(node.id);
    nodeList.forEach(n => currNodeIdSet.add(n.id));
    const lines = selectedData.lines.filter((item) => {
        if (currNodeIdSet.has(item.end)) {
            return false;
        }
        if (currNodeIdSet.has(item.start.split('-')[0])) {
            return false;
        }
        return true;
    });
    let nodes;
    if (mode === SelectMode.MUL_NORMAL || mode === SelectMode.BOX_SELECTION) {
        nodes = selectedData.nodes.filter(item => !currNodeIdSet.has(item.id));
    } else {
        const filterArray = [...getChildren(node.id, selectedData.lines), ...nodeList.map(n => n.id)];
        nodes = selectedData.nodes.filter(item => filterArray.indexOf(item.id) === -1);
    }
    return { nodes, lines };
}

export const getLinesFromNode = (allLines: ITopologyLine[], nodes: ITopologyNode[]) => {
    if (nodes.length === 0) {
        return [];
    }
    const set = new Set(nodes.map(n => n.id));
    return allLines.filter(line => set.has(line.start.split('-')[0]) && set.has(line.end.split('-')[0]));
}

const getCombineNodes = (data: ITopologyData, combineId: string) => {
    if (!combineId) {
        return [];
    }
    return data.nodes.filter(item => item.combineId === combineId);
}

/**
 * 选中规则：
 * 1. CTRL/COMMAND: 选中当前节点，并同时选中在已选节点中与当前节点呈父子关系的连线
 * 2. CTRL/COMMAND + SHIFT: 选中当前节点，并同时选中子节点及同子节点的连线
 */
const selectNodes: SelectNodesFunc = ({ data, selectedData }) => {
    function hasSelected(node: ITopologyNode) {
        return selectedData.nodes.find(item => item.id === node.id) !== undefined;
    }

    return ({ node, mode }) => {
        if (mode === SelectMode.SINGLE) {
            return { nodes: [node], lines: [] };
        }


        const currWillSelectNodeList = getCombineNodes(data, node.combineId); // 当前节点的合并节点
        const hasCombineNode = currWillSelectNodeList.length > 0;

        // 选中的组件中是否有拖拽子节点的组件
        const hasChildNodeList = currWillSelectNodeList.filter(n => n.dragChild || isMatchKeyValue(n, 'dragChild', true));
        if (!hasCombineNode) {
            currWillSelectNodeList.push(node);
        }
        const shouldSelectNodeSet = new Set(currWillSelectNodeList.map(item => item.id));

        // 原先已经选择了的节点
        const didSelectedNodesId = selectedData.nodes.map(item => item.id);
        const didSelectedNodeIdSet = new Set(didSelectedNodesId);
        const childNodeList = [];
        hasChildNodeList.forEach(curNode => {
            const childIds = data.lines.filter(n => n.start.split('-')[0] === curNode.id).map(n => n.end);
            const childNodes = data.nodes.filter(n => !shouldSelectNodeSet.has(n.id) && childIds.indexOf(n.id) > -1);
            childNodeList.push(...childNodes);
        });
        childNodeList.forEach(node => {
            if (shouldSelectNodeSet.has(node.id)) {
                return;
            }
            currWillSelectNodeList.push(node);
            shouldSelectNodeSet.add(node.id);
        })
        if (hasSelected(node)) {
            return cancelSelect({ selectedData, mode, node, nodeList: [...currWillSelectNodeList], data });
        }
        const children = getChildren(node.id, data.lines);
        const parents = getParents(node.id, data.lines);
        const selectedChildren = _.intersection(children, didSelectedNodesId);
        const selectedParents = _.intersection(parents, didSelectedNodesId);
        const shouldSelectedLines = getLinesFromNode(data.lines, currWillSelectNodeList);

        if (mode === SelectMode.NORMAL || mode === SelectMode.RIGHT_NORMAL) {
            return {
                nodes: currWillSelectNodeList,
                lines: shouldSelectedLines,
            };
        }
        if (mode === SelectMode.MUL_NORMAL || mode === SelectMode.BOX_SELECTION) {
            const selectlines = data.lines.filter((item) => {
                const [parent] = item.start.split('-');
                // 当前节点为父节点，并且子节点为已选择状态，则选中当前线段
                if (didSelectedNodeIdSet.has(parent) && selectedChildren.indexOf(item.end) > -1) {
                    return true;
                }
                // 当前节点为子节点，并且父节点为已选择状态，则选中当前线段
                if (didSelectedNodeIdSet.has(item.end) && selectedParents.indexOf(parent) > -1) {
                    return true;
                }
                return false;
            });
            return {
                nodes: data.nodes.filter(item => shouldSelectNodeSet.has(item.id) || didSelectedNodeIdSet.has(item.id)),
                lines: [...selectedData.lines, ...shouldSelectedLines, ...selectlines],
            };
        }
        // 复选模式下选中节点同时选中节点的子节点及关系线段
        const unSelectedChildren = _.difference(children, selectedChildren);
        const lines = data.lines.filter((item) => {
            const [parent] = item.start.split('-');
            if (_.some(selectedData.lines, item)) {
                return false;
            }
            // 当前节点为子节点，并且父节点为已选择状态，则选中当前线段
            if (didSelectedNodeIdSet.has(item.end) && selectedParents.indexOf(parent) > -1) {
                return true;
            }
            if (didSelectedNodeIdSet.has(parent) && unSelectedChildren.indexOf(item.end) > -1) {
                return true;
            }
            return false;
        });
        data.nodes.filter(item => {
            if (unSelectedChildren.indexOf(item.id) > -1) {
                didSelectedNodeIdSet.add(item.id);
            }
        });
        return {
            nodes: data.nodes.filter(item => shouldSelectNodeSet.has(item.id) || didSelectedNodeIdSet.has(item.id)),
            lines: [...selectedData.lines, ...shouldSelectedLines, ...lines],
        };
    };
};

export default selectNodes;
