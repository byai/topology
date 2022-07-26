import React from 'react';
import _ from 'lodash';
import {
    IPosition,
    ITopologyContext,
    ITopologyLine,
    LineEditType,
    ITopologyData,
} from '../../declare';
import { Consumer } from '../context';
import { computeLinePath, computeTrianglePath } from '../../utils';
import config from '../../config';
import './index.less';


const Colors = { ACTIVE: '#1F8CEC', NORMAL: '#AAB7C4' };
interface ILineProps {
    start: IPosition;
    end: IPosition;
    data?: ITopologyLine;
    arrow?: boolean;
    readOnly?: boolean;
    context?: ITopologyContext;
    selected?: boolean;
    onSelect?: (data: ITopologyData) => void;
    scaleNum: number;
}

interface ILineState {
    hover: boolean;
}

class Line extends React.Component<ILineProps, ILineState> {
    state: ILineState = { hover: false };

    handleMouseEnter = () => {
        this.setState({ hover: true });
    }

    handleMouseLeave = () => {
        this.setState({ hover: false });
    }

    handleClick = (e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
        const {
            selected,
            context,
            data,
            onSelect,
        } = this.props;
        const { lines } = context.selectedData;
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
            ...context.selectedData,
            lines: selected
                ? lines.filter(item => !_.isEqual(item, data))
                : [...lines, data],
        });
    }

    computeScaleNum = (scaleNum: number, end: IPosition): IPosition => {
        const { width, height } = config.canvas;
        const deviationX = (width - width * scaleNum) / 2;
        const deviationY = (height - height * scaleNum) / 2;

        return {
            x: end.x - 140,
            y: end.y - 40,
        };

    }

    render() {
        const {
            start,
            end,
            selected,
            data,
            readOnly,
            context,
            scaleNum
        } = this.props;


        end.x = end.x
        end.y = end.y

        if(end.x !== 410){
            console.log('line:', end.x, end.y);
        }

        // 422 572 没对齐
        // 497 677 对齐 对齐

        const { hover } = this.state;
        const dataJson = data ? JSON.stringify({ origin: data, po: { start, end } }) : '';
        const getTriangleStart = () => ({ ...end, y: end.y - config.line.triangleWidth });
        const color = selected || hover ? Colors.ACTIVE : Colors.NORMAL;
        const transition = context.linking ? 'none' : config.transition;

        return (
            <React.Fragment>
                <path
                    onClick={this.handleClick}
                    strokeWidth={config.line.triggerWidth}
                    stroke="transparent"
                    fill="none"
                    style={{ pointerEvents: 'all', transition }}
                    d={computeLinePath(start, getTriangleStart())}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                />
                {/* 线 ～ */}
                <path
                    onClick={this.handleClick}
                    strokeWidth={config.line.strokeWidth}
                    stroke={color}
                    fill="none"
                    style={{ pointerEvents: 'all', transition }}
                    d={computeLinePath(start, getTriangleStart())}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                />
                {/* 结尾的三角点 ▶️ */}
                <path
                    className={readOnly ? '' : 'byai-topology-line-end-triangle'}
                    fill={color}
                    stroke="none"
                    data-type={LineEditType.EDIT_END}
                    data-json={dataJson}
                    style={{ pointerEvents: 'all', transition }}
                    d={computeTrianglePath(getTriangleStart(), config.line.triangleWidth)}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                />
            </React.Fragment>
        );
    }
}

export default (props: ILineProps) => (
    <Consumer>
        {context => <Line {...props} context={context} />}
    </Consumer>
);
