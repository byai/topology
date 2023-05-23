/* eslint-disable no-debugger */
import _ from 'lodash';
import { isMatchKeyValue } from '.';
import { ITopologyData, ITopologyNode, ITopologyLine } from '../declare';

interface PremiseParams {
    data: ITopologyData;
    selectedData: ITopologyData;
}

export enum SelectMode {
    NORMAL,
    MUL_NORMAL,
    MULTI,
    RIGHT_NORMAL,
    // /** 框选 */
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
        const combineNodeList = getCombineNodes(data, node.combineId);
        const hasCombineNode = combineNodeList.length > 0;
        if (!hasCombineNode) {
            combineNodeList.push(node);
        }
        const hasChildNodeList = combineNodeList.filter(n => n.dragChild || isMatchKeyValue(n, 'dragChild', true));
        hasChildNodeList.forEach(curNode => {
            const childIds = data.lines.filter(n => n.start.split('-')[0] === curNode.id).map(n => n.end);
            const childNodes = data.nodes.filter(n => childIds.indexOf(n.id) > -1);

            combineNodeList.push(...childNodes);
        });
        if (hasSelected(node)) {
            return cancelSelect({ selectedData, mode, node, nodeList: [...combineNodeList], data });
        }
        const children = getChildren(node.id, data.lines);
        const parents = getParents(node.id, data.lines);
        const selectNodesId = selectedData.nodes.map(item => item.id);
        const selectedChildren = _.intersection(children, selectNodesId);
        const selectedParents = _.intersection(parents, selectNodesId);
        const currNodeIdSet = new Set(node.id);
        combineNodeList.forEach(n => currNodeIdSet.add(n.id));
        const shouldSelectedLines = getLinesFromNode(data.lines, combineNodeList);

        // const isCombined = !!node.combineId;
        // const combinedNodeList = isCombined ? data.nodes.filter(n => n.combineId === node.combineId) : [];
        // const combinedLineList = isCombined ? data.lines.filter(n => n.combineId === node.combineId) : [];

        if (mode === SelectMode.NORMAL || mode === SelectMode.RIGHT_NORMAL) {

            return {
                nodes: combineNodeList,
                lines: shouldSelectedLines,
            };
        }
        if (mode === SelectMode.MUL_NORMAL || mode === SelectMode.BOX_SELECTION) {
            const selectlines = data.lines.filter((item) => {
                const [parent] = item.start.split('-');
                // 当前节点为父节点，并且子节点为已选择状态，则选中当前线段
                if (currNodeIdSet.has(parent) && selectedChildren.indexOf(item.end) > -1) {
                    return true;
                }
                // 当前节点为子节点，并且父节点为已选择状态，则选中当前线段
                if (currNodeIdSet.has(item.end) && selectedParents.indexOf(parent) > -1) {
                    return true;
                }
                return false;
            });
            return {
                nodes: [...selectedData.nodes, ...combineNodeList],
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
            if (currNodeIdSet.has(item.end) && selectedParents.indexOf(parent) > -1) {
                return true;
            }
            if (currNodeIdSet.has(parent) && unSelectedChildren.indexOf(item.end) > -1) {
                return true;
            }
            return false;
        });
        const nodes = data.nodes.filter(item => unSelectedChildren.indexOf(item.id) > -1);
        return {
            nodes: [
                ...selectedData.nodes,
                ...combineNodeList,
                ...nodes,
            ],
            lines: [...selectedData.lines, ...shouldSelectedLines, ...lines],
        };
    };
};

export default selectNodes;
