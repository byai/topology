/* eslint-disable no-debugger */
import _ from 'lodash';
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
    // BOX_SELECTION
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
}) {
    const {
        selectedData,
        mode,
        node,
    } = params;
    if (mode === SelectMode.NORMAL) {
        return { nodes: [], lines: [] };
    }
    const lines = selectedData.lines.filter((item) => {
        if (item.end === node.id) {
            return false;
        }
        if (item.start.split('-')[0] === node.id) {
            return false;
        }
        return true;
    });
    let nodes;
    if (mode === SelectMode.MUL_NORMAL) {
        nodes = selectedData.nodes.filter(item => item.id !== node.id);
    } else {
        const filterArray = [...getChildren(node.id, selectedData.lines), node.id];
        nodes = selectedData.nodes.filter(item => filterArray.indexOf(item.id) === -1);
    }
    return { nodes, lines };
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
        if (hasSelected(node)) {
            return cancelSelect({ selectedData, mode, node });
        }
        const children = getChildren(node.id, data.lines);
        const parents = getParents(node.id, data.lines);
        const selectNodesId = selectedData.nodes.map(item => item.id);
        const selectedChildren = _.intersection(children, selectNodesId);
        const selectedParents = _.intersection(parents, selectNodesId);
        // const isCombined = !!node.combineId;
        // const combinedNodeList = isCombined ? data.nodes.filter(n => n.combineId === node.combineId) : [];
        // const combinedLineList = isCombined ? data.lines.filter(n => n.combineId === node.combineId) : [];

        if (mode === SelectMode.NORMAL || mode === SelectMode.RIGHT_NORMAL) {
            return {
                nodes: [node],
                lines: [],
            };
        }
        if (mode === SelectMode.MUL_NORMAL) {
            const selectlines = data.lines.filter((item) => {
                const [parent] = item.start.split('-');
                // 当前节点为父节点，并且子节点为已选择状态，则选中当前线段
                if (parent === node.id && selectedChildren.indexOf(item.end) > -1) {
                    return true;
                }
                // 当前节点为子节点，并且父节点为已选择状态，则选中当前线段
                if (item.end === node.id && selectedParents.indexOf(parent) > -1) {
                    return true;
                }
                return false;
            });
            return {
                nodes: [...selectedData.nodes, node],
                lines: [...selectedData.lines, ...selectlines],
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
            if (item.end === node.id && selectedParents.indexOf(parent) > -1) {
                return true;
            }
            if (parent === node.id && unSelectedChildren.indexOf(item.end) > -1) {
                return true;
            }
            return false;
        });
        const nodes = data.nodes.filter(item => unSelectedChildren.indexOf(item.id) > -1);
        return {
            nodes: [
                ...selectedData.nodes,
                node,
                ...nodes,
            ],
            lines: [...selectedData.lines, ...lines],
        };
    };
};

export default selectNodes;
