/* eslint-disable no-console */
import React from 'react';
import { Topology, topologyWrapper, TemplateWrapper } from '../lib';
import { ITopologyNode, ITopologyData, IWrapperOptions } from '../lib/declare';
import './index.less';

interface FlowState {
    data: ITopologyData;
    readonly: boolean;
    showBar?: boolean;
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
                    canDrag: false,
                },
            ],
        },
        readonly: false,
        showBar: true,
        canConnectMultiLines: false
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

    onChange = (data: ITopologyData, type: string) => {
        this.setState({ data });
        console.log('data => type', data, type);
    };

    render() {
        const {
            data, readonly, showBar,
            canConnectMultiLines
        } = this.state;
        const mockLineColor = {
            0: '#82BEFF',
            1: '#FFA39E',
            2: '#FFC89E',
        };
        return (
            <div className="topology">
                <div className="topology-templates">
                    <button
                        onClick={() => this.setState({ readonly: !readonly })}
                        style={{ marginBottom: 20 }}
                        type="button"
                    >
                        {readonly ? '只读' : '可编辑'}
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
                    <TemplateWrapper generator={() => this.generatorNodeData(true)}>
                        <div className="topology-templates-item">宽节点</div>
                    </TemplateWrapper>
                    <TemplateWrapper generator={() => this.generatorNodeData(false)}>
                        <div className="topology-templates-item">窄节点</div>
                    </TemplateWrapper>
                </div>
                <div style={{ width: '100%', height: 800 }}>
                    <Topology
                        data={data}
                        autoLayout
                        lineColor={mockLineColor}
                        onChange={this.onChange}
                        onSelect={this.handleSelect}
                        renderTreeNode={this.renderTreeNode}
                        readOnly={readonly}
                        showBar={showBar}
                        customPostionHeight={20}
                        canConnectMultiLines={canConnectMultiLines}
                        getInstance={
                            // eslint-disable-next-line
                            (ins: any) => { this.topology = ins; }}
                    />
                </div>
            </div>
        );
    }
}

export default topologyWrapper(Flow);
