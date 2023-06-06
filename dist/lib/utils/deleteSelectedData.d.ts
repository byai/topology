import { ITopologyData } from '../declare';
export default function deleteSelectedData(data: ITopologyData, selectedData: ITopologyData): {
    nodes: import("../declare").ITopologyNode[];
    lines: any[];
};
