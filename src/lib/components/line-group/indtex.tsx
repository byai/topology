import * as _ from 'lodash';
import React, { FC, useMemo } from 'react';
import { ITopologyContext, ITopologyData, ITopologyLine, ITopologyNode, LineEditType } from '../../declare';
import { computeAnchorPo, computeNodeInputPo, createHashFromObjectArray } from '../../utils';
import Line from '../line';
import LineText from '../line/lineText';
import { ITopologyProps, ITopologyState } from '../topology';
export type ILineGroupProps = {
    activeLine: ITopologyContext['activeLine'];
    selectedLines: ITopologyLine[];
    hoverCurrentNodeId: string;
    scaleNum: ITopologyState['scaleNum'];
    selectLine: (data: ITopologyData) => void;
} & Pick<ITopologyProps, 'data' | 'startPointAnchorId' | 'lineTextMap' | 'lineOffsetY' | 'readOnly' | 'lineTextColor' | 'lineLinkageHighlight' | 'lineTextDecorator' | 'showText'>
const LineGroup: FC<ILineGroupProps> = React.memo(({
    data,
    startPointAnchorId,
    lineTextMap,
    lineOffsetY,
    readOnly,
    lineTextColor,
    lineLinkageHighlight,
    lineTextDecorator,
    showText,
    activeLine,
    scaleNum,
    selectedLines,
    hoverCurrentNodeId,
    selectLine,
}) => {
    const { lines, nodes } = data;
    const nodeHash = useMemo(() => {
        return createHashFromObjectArray(nodes, "id") as {
            [id: string]: ITopologyNode;
        };
    }, [nodes]);
    const isEditing = (line: ITopologyLine) =>
        activeLine &&
        activeLine.origin &&
        _.isEqual(line, activeLine.origin);
    const isSelected = (line: ITopologyLine) =>
        isEditing(line) || _.some(selectedLines, line);

    // @ts-ignore
    const isHighLight = (line: ITopologyLine) => {
        if (!hoverCurrentNodeId || !lineLinkageHighlight) return false;
        if (line.start.split("-")[0] === hoverCurrentNodeId || line.end === hoverCurrentNodeId) return true;
    }

    const getLineStartPo = (line: ITopologyLine) => {
        if (
            isEditing(line) &&
            activeLine.type === LineEditType.EDIT_START
        ) {
            return activeLine.start;
        }

        // 这里特殊处理下，目的是保持所有锚点的起始点位置与 startPointAnchorId 锚点位置一致
        return computeAnchorPo(
            // `dom-map-${line.start}`,
            `dom-map-${startPointAnchorId === undefined ? line.start : `${line.start.split("-")[0]}-${startPointAnchorId}`}`,
            nodeHash[line.start.split("-")[0]]
        );
    };
    const getLineEndPo = (line: ITopologyLine) => {
        if (isEditing(line) && activeLine.type === LineEditType.EDIT_END) {
            return activeLine.end;
        }
        return computeNodeInputPo(nodeHash[line.end]);
    };
    return (
        <svg className="topology-svg">
            {lines.map((line, index) => {
                const start = getLineStartPo(line);
                const end = getLineEndPo(line);
                if (!start || !end) {
                    return null;
                }

                const key = `${line.start}-${line.end}`;
                const anchorId = line.start.split("-")[1];
                const getTextXY = () => {
                    const minX = Math.min(start.x, end.x);
                    const minY = Math.min(start.y, end.y);
                    const x = minX + Math.abs((start.x - end.x) / 2);
                    const y = minY + Math.abs((start.y - end.y) / 2)
                    return {
                        x,
                        y
                    }
                }

                const defaultTextEl = lineTextColor && (
                    <text x={getTextXY().x} y={getTextXY().y} key={index} style={{
                        fill: lineTextColor[anchorId]
                    }}>{anchorId === startPointAnchorId && !showText(line.start.split("-")[0]) ? null : lineTextMap[anchorId]}</text>);

                return (
                    <>
                        <Line
                            scaleNum={scaleNum}
                            key={key}
                            lineOffsetY={lineOffsetY}
                            data={line}
                            start={start}
                            end={end}
                            onSelect={selectLine}
                            selected={isSelected(line)}
                            highLight={isHighLight(line)}
                            readOnly={readOnly}
                        />
                        {
                            lineTextDecorator ? <LineText data={data} lineTextDecorator={lineTextDecorator} position={getTextXY()} line={line} /> : defaultTextEl
                        }
                    </>

                );
            })}
            {/* 拖动效果的线条 */}
            {activeLine && activeLine.type === LineEditType.ADD && (
                <Line {...activeLine} scaleNum={scaleNum} />
            )}
        </svg>
    );
})

export default LineGroup;
