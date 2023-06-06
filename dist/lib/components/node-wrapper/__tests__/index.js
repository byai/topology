/* eslint-disable arrow-body-style */
/* eslint-disable no-undef */
import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { wrapInTestContext } from 'react-dnd-test-utils';
// import TestUtils from 'react-dom/test-utils';
import 'jest-dom/extend-expect';
import NodeWrapper from '..';
import { SelectMode } from '../../../utils/selectNodes';
afterEach(cleanup);
describe('nodeWrapper', function () {
    test('basic render', function () {
        var mockIdentity = jest.fn(function (el) { return el; });
        var BoxContext = wrapInTestContext(NodeWrapper);
        var baseElement = render(React.createElement(BoxContext, { id: "1", connectDragSource: mockIdentity, connectDragPreview: mockIdentity }, function (wrapperOptions) { return (React.createElement("div", null,
            "\u8FD9\u662F\u4E00\u4E2A\u8282\u70B9",
            wrapperOptions.anchorDecorator({ anchorId: '1-0' })(React.createElement("span", null, "\u951A\u70B9")))); })).baseElement;
        expect(baseElement).toMatchSnapshot();
    });
    test('basic render with position', function () {
        var mockIdentity = jest.fn(function (el) { return el; });
        var BoxContext = wrapInTestContext(NodeWrapper);
        var baseElement = render(React.createElement(BoxContext, { id: "1", data: { id: '1', position: { x: 500, y: 500 } }, connectDragSource: mockIdentity, connectDragPreview: mockIdentity }, function (wrapperOptions) { return (React.createElement("div", null,
            "\u8FD9\u662F\u4E00\u4E2A\u8282\u70B9",
            wrapperOptions.anchorDecorator({ anchorId: '1-0' })(React.createElement("span", null, "\u951A\u70B9")))); })).baseElement;
        expect(baseElement).toMatchSnapshot();
    });
    test('click', function () {
        var identity = function (el) { return el; };
        // eslint-disable-next-line
        var mockOnSelect = jest.fn(function (data, selectMode) { return null; });
        var div = document.createElement('div');
        var BoxContext = wrapInTestContext(NodeWrapper);
        var container = render(React.createElement(BoxContext, { id: "1", data: { id: '1' }, connectDragSource: identity, connectDragPreview: identity, onSelect: mockOnSelect }, function (wrapperOptions) { return (React.createElement("div", null,
            "\u8FD9\u662F\u4E00\u4E2A\u8282\u70B9",
            wrapperOptions.anchorDecorator({ anchorId: '1-0' })(React.createElement("span", null, "\u951A\u70B9")))); }), { container: document.body.appendChild(div) }).container;
        var element = container.querySelector('.byai-topology-node-wrapper');
        fireEvent.click(element);
        fireEvent(element, new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            metaKey: true,
        }));
        fireEvent(element, new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            metaKey: true,
            shiftKey: true,
        }));
        var returnData = { id: '1', position: { x: 0, y: 0 } };
        // expect(mockOnSelect.mock.calls.length).toBe(3);
        expect(mockOnSelect.mock.calls[0][1]).toBe(SelectMode.NORMAL);
        expect(mockOnSelect.mock.calls[0][0]).toEqual(returnData);
        expect(mockOnSelect.mock.calls[1][1]).toBe(SelectMode.MUL_NORMAL);
        expect(mockOnSelect.mock.calls[1][0]).toEqual(returnData);
        expect(mockOnSelect.mock.calls[2][1]).toBe(SelectMode.MULTI);
        expect(mockOnSelect.mock.calls[2][0]).toEqual(returnData);
    });
});
//# sourceMappingURL=index.js.map