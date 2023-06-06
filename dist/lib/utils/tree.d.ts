import { ITopologyNode, ITopologyData } from '../declare';
/** 只含有单个root节点 */
export declare const onlyOneRoot: (data: ITopologyData) => boolean;
/** 单个父节点 */
export declare const onlyOneParent: (data: ITopologyData) => boolean;
/** 判断树是否有环 */
export declare const hasRing: (data: ITopologyNode) => boolean;
export declare const processTree: (root: ITopologyNode, process: (dataF: ITopologyNode) => ITopologyNode) => ITopologyNode;
/** 将数据转化为树结构 */
export declare const convertToTree: ({ nodes, lines }: ITopologyData, process?: (data: ITopologyNode) => ITopologyNode) => ITopologyNode;
