/* eslint-disable no-undef */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import ReactDOM from 'react-dom';
import 'jest-dom/extend-expect';
import { wrapInTestContext } from 'react-dnd-test-utils';
import TestRenderer from 'react-test-renderer';
// eslint-disable-next-line import/no-named-as-default, import/no-named-as-default-member
import Topology from '..';

afterEach(cleanup);

describe('topology', () => {
    let container;
    const BoxContext = wrapInTestContext(Topology);
    const renderTreeNode = data => (<div style={{ width: 100, height: 100 }}>{data.id}</div>);

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
    });

    test('basic render', () => {
        const mockRenderTreeNode = jest.fn(data => (<div>{data.id}</div>));
        const { baseElement } = render(
            <BoxContext
                data={{ nodes: [{ id: '1' }], lines: [] }}
                onChange={() => null}
                renderTreeNode={mockRenderTreeNode}
            />,
        );
        expect(mockRenderTreeNode.mock.calls.length).toBeGreaterThan(0);
        expect(baseElement).toMatchSnapshot();
    });

    test('autoLayout', () => {
        const mockRenderTreeNode = jest.fn(data => (<div>{data.id}</div>));
        const mockChange = jest.fn(() => null);
        let topologyInstance = null;
        TestRenderer.act(
            () => {
                ReactDOM.render(
                    <BoxContext
                        getInstance={(r) => { topologyInstance = r; }}
                        data={{
                            nodes: [{ id: '1' }, { id: '2' }],
                            lines: [{ start: '1-0', end: '2' }],
                        }}
                        onChange={mockChange}
                        renderTreeNode={mockRenderTreeNode}
                    />,
                    container,
                );
            },
        );
        expect(topologyInstance === null).toBeFalsy();
        topologyInstance.autoLayout();
        expect(mockChange.mock.calls.length).toBeGreaterThan(0);
    });

    test('scrollCanvasToCenter', () => {
        let topologyInstance = null;
        TestRenderer.act(
            () => {
                ReactDOM.render(
                    <BoxContext
                        getInstance={(r) => { topologyInstance = r; }}
                        data={{ nodes: [{ id: '1', position: { x: 2000, y: 2000 } }], lines: [] }}
                        onChange={() => null}
                        renderTreeNode={renderTreeNode}
                    />,
                    container,
                );
            },
        );
        topologyInstance.$wrapper.scrollLeft = 0;
        topologyInstance.$wrapper.scrollTop = 0;
        expect(topologyInstance === null).toBeFalsy();
        const scrollBtn = container.querySelector('#scroll-canvas-to-center');
        fireEvent(scrollBtn, new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        }));
        expect(topologyInstance.$wrapper.scrollLeft).toBeGreaterThan(0);
        expect(topologyInstance.$wrapper.scrollTop).toBeGreaterThan(0);
    });
});
