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
describe('topology', function () {
    var container;
    var BoxContext = wrapInTestContext(Topology);
    var renderTreeNode = function (data) { return (React.createElement("div", { style: { width: 100, height: 100 } }, data.id)); };
    beforeEach(function () {
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    afterEach(function () {
        document.body.removeChild(container);
        container = null;
    });
    test('basic render', function () {
        var mockRenderTreeNode = jest.fn(function (data) { return (React.createElement("div", null, data.id)); });
        var baseElement = render(React.createElement(BoxContext, { data: { nodes: [{ id: '1' }], lines: [] }, onChange: function () { return null; }, renderTreeNode: mockRenderTreeNode })).baseElement;
        expect(mockRenderTreeNode.mock.calls.length).toBeGreaterThan(0);
        expect(baseElement).toMatchSnapshot();
    });
    test('autoLayout', function () {
        var mockRenderTreeNode = jest.fn(function (data) { return (React.createElement("div", null, data.id)); });
        var mockChange = jest.fn(function () { return null; });
        var topologyInstance = null;
        TestRenderer.act(function () {
            ReactDOM.render(React.createElement(BoxContext, { getInstance: function (r) { topologyInstance = r; }, data: {
                    nodes: [{ id: '1' }, { id: '2' }],
                    lines: [{ start: '1-0', end: '2' }],
                }, onChange: mockChange, renderTreeNode: mockRenderTreeNode }), container);
        });
        expect(topologyInstance === null).toBeFalsy();
        topologyInstance.autoLayout();
        expect(mockChange.mock.calls.length).toBeGreaterThan(0);
    });
    test('scrollCanvasToCenter', function () {
        var topologyInstance = null;
        TestRenderer.act(function () {
            ReactDOM.render(React.createElement(BoxContext, { getInstance: function (r) { topologyInstance = r; }, data: { nodes: [{ id: '1', position: { x: 2000, y: 2000 } }], lines: [] }, onChange: function () { return null; }, renderTreeNode: renderTreeNode }), container);
        });
        topologyInstance.$wrapper.scrollLeft = 0;
        topologyInstance.$wrapper.scrollTop = 0;
        expect(topologyInstance === null).toBeFalsy();
        var scrollBtn = container.querySelector('#scroll-canvas-to-center');
        fireEvent(scrollBtn, new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        }));
        expect(topologyInstance.$wrapper.scrollLeft).toBeGreaterThan(0);
        expect(topologyInstance.$wrapper.scrollTop).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=index.js.map