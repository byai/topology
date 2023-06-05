/* eslint-disable react/require-default-props */
import _ from 'lodash';
import React, { useState } from 'react';
import config from '../../config';
import {
    IPosition,
    ITopologyContext, ITopologyData, ITopologyLine,
    LineEditType
} from '../../declare';
import { computeLinePath, computeTrianglePath } from '../../utils';
import { useContext } from '../context';
import './index.less';


const Colors = { ACTIVE: '#1F8CEC', NORMAL: '#AAB7C4' };

interface ILineProps {
    start: IPosition;
    end: IPosition;
    color?: string;
    lineOffsetY?: number;
    data?: ITopologyLine;
    arrow?: boolean;
    readOnly?: boolean;
    context?: ITopologyContext;
    selected?: boolean;
    highLight?: boolean;
    onSelect?: (data: ITopologyData) => void;
    scaleNum?: number;
}

const Line: React.FC<ILineProps> = (props) => {
    const {
        start,
        end,
        selected,
        highLight,
        data,
        readOnly,
        lineOffsetY,
        onSelect
    } = props;
    const ctx = useContext();
    const { selectedData, linking, activeLine } = ctx;
    const [hover, setHover] = useState(false);
    const handleMouseEnter = () => {
        setHover(true);
    };

    const handleMouseLeave = () => {
        setHover(false);
    };
    const handleClick = (e) => {
        const { lines } = selectedData;
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
            ...selectedData,
            lines: selected
                ? lines.filter(item => !_.isEqual(item, data))
                : [...lines, data],
        });
    };

    const dataJson = data ? JSON.stringify({ origin: data, po: { start, end } }) : '';
    const getTriangleStart = () => ({ ...end, y: end.y - config.line.triangleWidth });
    const curLinking = linking && !activeLine.origin && !data;
    const lColor = highLight || selected || hover || curLinking ? Colors.ACTIVE : ((data && data.color) || Colors.NORMAL);
    const transition = linking ? 'none' : config.transition;

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
};
export default Line;
