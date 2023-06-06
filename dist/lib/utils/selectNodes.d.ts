import { ITopologyData, ITopologyNode, ITopologyLine } from '../declare';
interface PremiseParams {
    data: ITopologyData;
    selectedData: ITopologyData;
}
export declare enum SelectMode {
    /** 只会选中单个节点 */
    SINGLE = 0,
    /** 会选中当前节点以及同组件其他节点 */
    NORMAL = 1,
    MUL_NORMAL = 2,
    MULTI = 3,
    RIGHT_NORMAL = 4,
    /** 框选 */
    BOX_SELECTION = 5
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
export declare const getLinesFromNode: (allLines: ITopologyLine[], nodes: ITopologyNode[]) => ITopologyLine[];
/**
 * 选中规则：
 * 1. CTRL/COMMAND: 选中当前节点，并同时选中在已选节点中与当前节点呈父子关系的连线
 * 2. CTRL/COMMAND + SHIFT: 选中当前节点，并同时选中子节点及同子节点的连线
 */
declare const selectNodes: SelectNodesFunc;
export default selectNodes;
