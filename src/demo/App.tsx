/* eslint-disable no-console */
import React from 'react';
import * as Lib from '../lib';
import { ITopologyNode, ITopologyData, IWrapperOptions } from '../lib/declare';
import './index.less';

const { Topology, topologyWrapper, TemplateWrapper } = Lib;
interface FlowState {
    data: ITopologyData;
    readonly: boolean;
    overlap?: boolean;
    showBar?: boolean;
    snapline?: boolean;
    canConnectMultiLines?: boolean;
}
class Flow extends React.Component<{}, FlowState> {
    state: FlowState = {
        data: {
            lines: [
                {
                    start: '1585466878859-0',
                    end: '1585466718867',
                    color: '#b71522',
                },
            ],
            nodes: [
                {
                    id: '1585466878859',
                    name: '窄节点',
                    content: '这是一个窄节点',
                    branches: ['锚点1'],
                    position: {
                        x: 19726.906692504883,
                        y: 19512.21832561493,
                    },
                    filterOverlap: true
                },
                {
                    id: '1585466718867',
                    name: '宽节点',
                    content: '这是一个宽节点',
                    branches: ['锚点1', '锚点2', '锚点3'],
                    position: {
                        x: 19629.79557800293,
                        y: 19696.197512626648,
                    },
                    // canDrag: false,
                },
            ],
        },
        readonly: false,
        overlap: false,
        showBar: true,
        canConnectMultiLines: false,
        snapline: true,
    };
    // eslint-disable-next-line
    topology: any = null;

    generatorNodeData = (isBig: boolean) => ({
        id: `${Date.now()}`,
        name: isBig ? '宽节点' : '窄节点',
        content: isBig ? '这是一个宽节点' : '这是一个窄节点',
        branches: isBig ? ['锚点1', '锚点2', '锚点3'] : ['锚点1'],
        dragChild: isBig
    });

    handleSelect = (data: ITopologyData) => {
        console.log(data);
    }

    renderTreeNode = (data: ITopologyNode, { anchorDecorator }: IWrapperOptions) => {
        const {
            name = '',
            content = '',
            branches = [],
        } = data;
        return (
            <div className="topology-node">
                <div className="node-header">{name}</div>
                <p className="node-content">{content}</p>
                {branches.length > 0 && (
                    <div className="flow-node-branches-wrapper">
                        {branches.map(
                            (item: string, index: number) => anchorDecorator({
                                anchorId: `${index}`,
                            })(<div className="flow-node-branch">{item}</div>),
                        )}
                    </div>
                )}
            </div>
        );
    };

    onChange = (data: ITopologyData) => {
        this.setState({ data });
    };

    renderBoxSelectionTool = () => {
        const wapperStyle: React.CSSProperties = {
            position: 'absolute',
            background: '#fff',
            top: '-8px',
            left: '50%',
            transform: 'translate(-50%,-100%)',
            display: 'flex',
            padding: '4px 6px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px 0 rgba(200,201,204,.3)',
            alignItems: 'center',
            pointerEvents: 'all',
        };
        const itemStyle: React.CSSProperties = {
            backgroundColor: 'rgb(246, 247, 250)',
            borderRadius: '2px',
            padding: '0px 6px',
            lineHeight: '28px',
            marginRight: '6px',
            whiteSpace: 'nowrap',
            color: 'rgba(10, 15, 44, 0.65)',
            cursor: 'pointer',
        };
        return (
            <div style={wapperStyle}>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        this.topology.autoLayoutForBoxSelection();
                    }}
                    style={itemStyle}
                >
                    纵向布局
                </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        this.topology.autoLayoutForBoxSelection({
                            rankDir: 'LR'
                        });
                    }}
                    style={itemStyle}
                >
                    横向布局
                </div>
            </div>
        );
    }

    render() {
        const {
            data, readonly, showBar, overlap,
            canConnectMultiLines, snapline
        } = this.state;
        const mockLineColor = {
            0: '#82BEFF',
            1: '#FFA39E',
            2: '#FFC89E',
        };
        return (
            <div className="topology">
                <div style={{ width: '100%', height: '100%' }}>
                    <Topology
                        isReduceRender
                        data={data}
                        autoLayout
                        lineColor={mockLineColor}
                        onChange={this.onChange}
                        onSelect={this.handleSelect}
                        renderTreeNode={this.renderTreeNode}
                        lineLinkageHighlight
                        readOnly={readonly}
                        scaleNum={1}
                        showBar={showBar}
                        snapline={snapline}
                        showDownload
                        downloadImg={() => {
                            this.topology.downloadImg('global', true, '测试图片名称');
                        }}
                        renderBoxSelectionTool={this.renderBoxSelectionTool}
                        customPostionHeight={20}
                        canConnectMultiLines={canConnectMultiLines}
                        overlap={overlap}
                        overlapOffset={{
                            offsetX: 30,
                            offsetY: 30
                        }}
                        getInstance={
                            // eslint-disable-next-line
                            (ins: any) => { this.topology = ins; }}
                    />
                </div>
                <div className="topology-templates" data-html2canvas-ignore="true">
                    <button
                        onClick={() => this.setState({ readonly: !readonly })}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        {readonly ? '只读' : '可编辑'}
                    </button>
                    <button
                        onClick={() => this.setState({ overlap: !overlap })}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        {overlap ? '不允许节点覆盖' : '允许节点覆盖'}
                    </button>
                    <button
                        onClick={() => {
                            this.topology.handleSelectAll();
                        }}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        全选
                    </button>
                    <button
                        onClick={() => this.setState({ showBar: !showBar })}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        {`${showBar ? '隐藏' : '显示'}工具栏`}
                    </button>
                    <button
                        onClick={() => this.setState({ canConnectMultiLines: !canConnectMultiLines })}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        {`锚点${canConnectMultiLines ? '不可' : '可'}连接多条线`}
                    </button>
                    <button
                        onClick={() => this.setState({ snapline: !snapline })}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        展示辅助对齐线
                    </button>
                    <TemplateWrapper generator={() => this.generatorNodeData(true)}>
                        <div className="topology-templates-item">宽节点</div>
                    </TemplateWrapper>
                    <TemplateWrapper generator={() => this.generatorNodeData(false)}>
                        <div className="topology-templates-item">窄节点</div>
                    </TemplateWrapper>
                </div>
            </div>
        );
    }
}

export default topologyWrapper(Flow);
