import _ from 'lodash';
import { ITopologyData } from '../declare';

export default function deleteSelectedData(data: ITopologyData, selectedData: ITopologyData) {
    const deleteNodes = selectedData.nodes;

    const deleteNodesIdMap = deleteNodes
        .map(item => item.id)
        .reduce((pre, cur) => ({ ...pre, [cur]: cur }), {});
    const shouldDeleteLines = data.lines.filter((item) => {
        const [parent] = item.start.split('-');
        const child = item.end;
        if (deleteNodesIdMap[parent] || deleteNodesIdMap[child]) {
            return true;
        }
        return false;
    });
    const deleteLines = _.uniqWith([...shouldDeleteLines, ...selectedData.lines], _.isEqual);

    return {
        nodes: _.differenceBy(data.nodes, deleteNodes, 'id'),
        lines: _.differenceWith(data.lines, deleteLines, _.isEqual),
    };
}
