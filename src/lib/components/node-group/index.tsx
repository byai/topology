import React, { FC, useMemo } from 'react';
import { ITopologyLine, ITopologyNode, IWrapperOptions } from '../../declare';
import { SelectMode } from '../../utils/selectNodes';
import NodeWrapper from '../node-wrapper';
import { ITopologyProps, ITopologyState } from '../topology';

export type INodeGroupProps = {
    selectedIdList?: string;
    scaleNum: ITopologyState['scaleNum'];
    draggingId: ITopologyState['draggingId'];
    handleHoverCurrentNode: (node: any) => void;
    clearHoverCurrentNode: () => void;
    setDraggingId: (id: any) => void;
    closeBoxSelection: () => void;
    selectNode: (node: ITopologyNode, mode: SelectMode) => void;
} & Pick<ITopologyProps, 'data' | 'renderTreeNode' | 'readOnly' | 'isReduceRender' | 'prevNodeStyle'>

const NodeGroup: FC<INodeGroupProps> = React.memo(({
    data: { nodes, lines },
    renderTreeNode,
    readOnly,
    isReduceRender,
    prevNodeStyle,
    selectedIdList='',
    draggingId,
    scaleNum,
    handleHoverCurrentNode,
    clearHoverCurrentNode,
    setDraggingId,
    closeBoxSelection,
    selectNode,
}) => {
    const idList = useMemo(() => selectedIdList.split(','), [selectedIdList]);
    const lineHash = useMemo(() => {
        return lines.reduce((pre, cur) => {
            const { start, end } = cur;
            const [parent] = start.split("-");
            return { ...pre, [parent]: true, [end]: true };
        }, {}) as { [id: string]: ITopologyLine }
    }, [lines]);
    if (!renderTreeNode) {
        return null;
    }

    return (
        <>
            {
                nodes.map(item => (
                    <NodeWrapper
                        onMouseEnter={handleHoverCurrentNode}
                        onMouseLeave={clearHoverCurrentNode}
                        key={item.id}
                        id={`${item.id}`}
                        data={item}
                        scaleNum={scaleNum}
                        draggingId={draggingId}
                        isSelected={idList.some(id => id === item.id)}
                        selectedNodeIdList={idList}
                        combineId={item.combineId}
                        setDraggingId={setDraggingId}
                        isReduceRender={isReduceRender}
                        closeBoxSelection={closeBoxSelection}
                        readOnly={readOnly}
                        prevNodeStyle={prevNodeStyle}
                        isolated={!lineHash[item.id]}
                        onSelect={selectNode}
                    >
                        {(wrapperOptions: IWrapperOptions) =>
                            /* eslint-disable */
                            renderTreeNode(item, wrapperOptions)
                        }
                    </NodeWrapper>
                ))
            }
        </>
    )
});

export default NodeGroup;
