/* eslint-disable no-console */
import React from 'react';
import { Topology, topologyWrapper, TemplateWrapper } from '../lib';
import { ITopologyNode, ITopologyData, IWrapperOptions } from '../lib/declare';
import './index.less';

interface FlowState {
    data: ITopologyData;
    readonly: boolean;
}
class Flow extends React.Component<{}, FlowState> {
    state: FlowState = {
        data: {
            lines: [
                { start: '1585466878859-0', end: '1585466718867' },
                { start: '1585466718867-0', end: '1612342548216' },
                { start: '1585466718867-1', end: '1612342556552' },
                { start: '1585466718867-2', end: '1612342545260' },
                { start: '1612342545260-0', end: '1612342562306' },
                { start: '1612342545260-1', end: '1612342567412' },
                { start: '1612342545260-2', end: '1612342573331' },
                { start: '1612342573331-0', end: '1612342578548' },
                { start: '1612342578548-0', end: '1612342583948' },
                { start: '1612342578548-1', end: '1612342583948' },
                { start: '1612342578548-2', end: '1612342587871' },
            ],
            nodes: [
                {
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1585466878859',
                    name: '窄节点',
                    position: { x: 19890, y: 19944 },
                },
                {
                    anchors: ['0'],
                    branches: ['锚点1', '锚点2', '锚点3'],
                    content: '这是一个宽节点',
                    id: '1585466718867',
                    name: '宽节点',
                    parent: '1585466878859',
                    position: { x: 20940, y: 19944 },
                },
                {
                    anchors: ['0'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342548216',
                    name: '窄节点',
                    parent: '1585466718867',
                    position: { x: 21240, y: 19464 },
                },
                {
                    anchors: ['1'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342556552',
                    name: '窄节点',
                    parent: '1585466718867',
                    position: { x: 21240, y: 19656 },
                },
                {
                    anchors: ['2'],
                    branches: ['锚点1', '锚点2', '锚点3'],
                    content: '这是一个宽节点',
                    id: '1612342545260',
                    name: '宽节点',
                    parent: '1585466718867',
                    position: { x: 21690, y: 20136 },
                },
                {
                    anchors: ['0'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342562306',
                    name: '窄节点',
                    parent: '1612342545260',
                    position: { x: 21990, y: 19752 },
                },
                {
                    anchors: ['1'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342567412',
                    name: '窄节点',
                    parent: '1612342545260',
                    position: { x: 21990, y: 19944 },
                },
                {
                    anchors: ['2'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342573331',
                    name: '窄节点',
                    parent: '1612342545260',
                    position: { x: 22140, y: 20328 },
                },
                {
                    anchors: ['0'],
                    branches: ['锚点1', '锚点2', '锚点3'],
                    content: '这是一个宽节点',
                    id: '1612342578548',
                    name: '宽节点',
                    parent: '1612342573331',
                    position: { x: 22590, y: 20328 },
                },
                {
                    anchors: ['0', '1'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342583948',
                    name: '窄节点',
                    parent: '1612342578548',
                    position: {
                        x: 22890,
                        y: 20232,
                    },
                },
                {
                    anchors: ['2'],
                    branches: ['锚点1'],
                    content: '这是一个窄节点',
                    id: '1612342587871',
                    name: '窄节点',
                    parent: '1612342578548',
                    position: { x: 22890, y: 20424 },
                },
            ],
        },
        readonly: false,
    };

    topology: any = null;

    generatorNodeData = (isBig: boolean) => ({
        id: `${Date.now()}`,
        name: isBig ? '宽节点' : '窄节点',
        content: isBig ? '这是一个宽节点' : '这是一个窄节点',
        branches: isBig ? ['锚点1', '锚点2', '锚点3'] : ['锚点1'],
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
        console.log(type, 'type111');
        console.log(data, 'data');
    };

    render() {
        const { data, readonly } = this.state;
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
                        onChange={this.onChange}
                        onSelect={this.handleSelect}
                        renderTreeNode={this.renderTreeNode}
                        readOnly={readonly}
                        getInstance={(ins: any) => {
                            this.topology = ins;
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default topologyWrapper(Flow);
