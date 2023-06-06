import { ITopologyData, ITopologyNode } from '../declare';
type SortChilren = (parent: ITopologyNode, childrenList: ITopologyNode[]) => ITopologyNode[];
interface LayoutOptions {
    sortChildren?: SortChilren;
}
declare function computeLayout(data: ITopologyData, options: LayoutOptions): ITopologyNode[];
export default computeLayout;
