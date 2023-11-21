import _ from 'lodash';
import { ITopologyNode, ITopologyData, ITopologyLine } from '../declare';
import { createHashFromObjectArray } from '.';

/** 只含有单个root节点 */
export const onlyOneRoot = (data: ITopologyData) => {
    const { lines, nodes } = data;
    if (nodes.length <= 1) {
        return true;
    }
    const lineHashByEnd = lines.reduce((pre, cur) => ({ ...pre, [cur.end]: cur }), {}) as { [id: string]: ITopologyLine };
    return nodes.filter(item => !lineHashByEnd[item.id]).length === 1;
};

/**
 * 判断是否是孤立节点
 * @param lines
 * @param id
 * @returns
 */
export const isolatedNode = (data, id): boolean => {
    const { lines } = data;
    const lineHash = lines.reduce((pre, cur) => {
        const { start, end } = cur;
        const [parent] = start.split('-');
        return { ...pre, [parent]: true, [end]: true };
    }, {});
    return !lineHash[id];
};

/** 单个父节点 */
export const onlyOneParent = (data: ITopologyData) => {
    const { lines } = data;
    const lineEndHash = {} as { [id: string]: string };
    for (let i = 0; i < lines.length; i += 1) {
        const { start, end } = lines[i];
        const parent = start.split('-')[0];
        if (!lineEndHash[end]) {
            lineEndHash[end] = parent;
        } else if (lineEndHash[end] !== parent) {
            return false;
        }
    }
    return true;
};

/** 判断树是否有环 */
export const hasRing = (data: ITopologyNode) => {
    const flagHash = {} as { [id: string]: ITopologyNode };
    const findRing = (node: ITopologyNode) => {
        const id = `${node.id}`;
        if (!flagHash[id]) {
            flagHash[id] = node;
            if (Array.isArray(node.childrenList)) {
                for (let i = 0; i < node.childrenList.length; i += 1) {
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

export const processTree = (root: ITopologyNode, process: (dataF: ITopologyNode) => ITopologyNode) => {
    if (Array.isArray(root.childrenList)) {
        // eslint-disable-next-line no-param-reassign
        root.childrenList = root.childrenList.map(
            (children: ITopologyNode) => processTree(children, process),
        );
    }
    return process(root);
};

interface RelationHash {
    relationHash: { [id: string]: { parent: string; anchors: string[] } };
    childrenListHash: { [id: string]: string[] };
}

/** 将数据转化为树结构 */
export const convertToTree = (
    { nodes, lines }: ITopologyData,
    process?: (data: ITopologyNode) => ITopologyNode,
) => {
    const nodeHash = createHashFromObjectArray(nodes, 'id') as { [id: string]: ITopologyNode };
    const lineEndHash = createHashFromObjectArray(lines, 'end') as { [id: string]: ITopologyLine };
    const relationShipHash = lines.reduce((pre: RelationHash, cur) => {
        const { relationHash, childrenListHash } = pre;
        const [parent, anchor] = cur.start.split('-');
        if (!Array.isArray(childrenListHash[parent])) {
            childrenListHash[parent] = [];
        }
        if (!relationHash[cur.end]) {
            relationHash[cur.end] = { parent, anchors: [] };
        }
        const relation = {
            ...relationHash[cur.end],
            anchors: [...relationHash[cur.end].anchors, anchor],
        };
        const childrenList = _.uniq([...childrenListHash[parent], cur.end]);
        return {
            relationHash: { ...relationHash, [cur.end]: relation },
            childrenListHash: { ...childrenListHash, [parent]: childrenList },
        };
    }, { relationHash: {}, childrenListHash: {} }) as RelationHash;

    nodes.forEach((item) => {
        const { childrenListHash, relationHash } = relationShipHash;
        if (Array.isArray(childrenListHash[`${item.id}`])) {
            // eslint-disable-next-line no-param-reassign
            item.childrenList = childrenListHash[`${item.id}`].map((nodeId: string) => {
                nodeHash[nodeId].anchors = relationHash[nodeId].anchors;
                nodeHash[nodeId].parent = relationHash[nodeId].parent;
                return nodeHash[nodeId];
            });
        }
    });
    let root = nodes.find(item => !lineEndHash[`${item.id}`]);
    if (!root) {
        return null;
    }
    if (process) {
        root = processTree(root, process);
    }
    return root;
};
