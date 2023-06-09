import _ from 'lodash';
import React, { useState } from 'react';
import config from '../../config';
import {
    IPosition,
    ITopologyContext, ITopologyData, ITopologyLine,
    LineEditType
} from '../../declare';
import { computeLinePath, computeTrianglePath } from '../../utils';
import './index.less';


const Colors = { ACTIVE: '#1F8CEC', NORMAL: '#AAB7C4' };

interface ILineProps {
    isReduceRender?: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    start?: IPosition;
    end?: IPosition;
    color?: string;
    lineOffsetY?: number;
    data?: ITopologyLine;
    arrow?: boolean;
    readOnly?: boolean;
    context?: ITopologyContext;
    selected?: boolean;
    highLight?: boolean;
    onSelect?: (data: ITopologyData, merge?: boolean) => void;
    scaleNum?: number;
    selectedLines?: ITopologyLine[];
    curLinking?: boolean;
    transition?: string;
}
const Line: React.FC<ILineProps> = React.memo((props) => {
    const {
        startX,
        startY,
        endX,
        endY,
        start: propsStart,
        end: propsEnd,
        selected,
        highLight,
        data,
        readOnly,
        lineOffsetY,
        onSelect,
        selectedLines,
        curLinking,
        transition
    } = props;
    const start: IPosition = propsStart ?? {
        x: startX,
        y: startY,
    }
    const end: IPosition = propsEnd ?? {
        x: endX,
        y: endY,
    }
    const [hover, setHover] = useState(false);
    const handleMouseEnter = () => {
        setHover(true);
    };

    const handleMouseLeave = () => {
        setHover(false);
    };
    const handleClick = (e) => {
        const multi = e.metaKey || e.ctrlKey;
        if (!onSelect) {
            return;
        }

        if (!multi) {
            onSelect({
                lines: selected ? [] : [data],
                nodes: [],
            });
            return;
        }
        onSelect({
            lines: selected
                ? selectedLines.filter(item => !_.isEqual(item, data))
                : [...selectedLines, data],
        } as ITopologyData, true);
    };

    const dataJson = data ? JSON.stringify({ origin: data, po: { start, end } }) : '';
    const getTriangleStart = () => ({ ...end, y: end.y - config.line.triangleWidth });
    const lColor = highLight || selected || hover || curLinking ? Colors.ACTIVE : ((data && data.color) || Colors.NORMAL);
    return (
        <>
            <path
                onClick={handleClick}
                strokeWidth={config.line.triggerWidth}
                stroke="transparent"
                fill="none"
                style={{ pointerEvents: 'all', transition }}
                d={computeLinePath(start, getTriangleStart(), lineOffsetY)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            <path
                onClick={handleClick}
                strokeWidth={highLight || selected || hover ? config.line.strokeLargeWidth : config.line.strokeWidth}
                stroke={lColor}
                fill="none"
                style={{ pointerEvents: 'all', transition }}
                d={computeLinePath(start, getTriangleStart(), lineOffsetY)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            <path
                className={readOnly ? '' : 'byai-topology-line-end-triangle'}
                fill={lColor}
                stroke="none"
                data-type={LineEditType.EDIT_END}
                data-json={dataJson}
                style={{ pointerEvents: 'all', transition }}
                d={computeTrianglePath(getTriangleStart(), config.line.triangleWidth)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
        </>
    );
});
export default Line;
