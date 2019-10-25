/* eslint-disable no-console */
import React from 'react';
import { Topology, topologyWrapper, TemplateWrapper } from '../lib';
import { ITopologyNode, ITopologyData, IWrapperOptions } from '../lib/declare';
import './index.less';

interface FlowState {
    data: ITopologyData;
}
class Flow extends React.Component<{}, FlowState> {
    state: FlowState = {
        data: { lines: [], nodes: [] },
    };

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
        console.log(type, 'type11');
    };

    render() {
        const { data } = this.state;
        return (
            <div className="topology">
                <div className="topology-templates">
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
                    />
                </div>
            </div>
        );
    }
}

export default topologyWrapper(Flow);
