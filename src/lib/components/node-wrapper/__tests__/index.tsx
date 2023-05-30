/* eslint-disable arrow-body-style */
/* eslint-disable no-undef */
import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { wrapInTestContext } from 'react-dnd-test-utils';
// import TestUtils from 'react-dom/test-utils';
import 'jest-dom/extend-expect';
import { IWrapperOptions } from '../../../declare';
import NodeWrapper from '..';
import { SelectMode } from '../../../utils/selectNodes';

afterEach(cleanup);

describe('nodeWrapper', () => {
    test('basic render', () => {
        const mockIdentity = jest.fn(el => el);
        const BoxContext = wrapInTestContext(NodeWrapper);
        const { baseElement } = render(
            <BoxContext
                id="1"
                connectDragSource={mockIdentity}
                connectDragPreview={mockIdentity}
            >
                {(wrapperOptions: IWrapperOptions) => (
                    <div>
                        这是一个节点
                        {wrapperOptions.anchorDecorator({ anchorId: '1-0' })(
                            <span>锚点</span>,
                        )}
                    </div>
                )}
            </BoxContext>,
        );
        expect(baseElement).toMatchSnapshot();
    });

    test('basic render with position', () => {
        const mockIdentity = jest.fn(el => el);
        const BoxContext = wrapInTestContext(NodeWrapper);
        const { baseElement } = render(
            <BoxContext
                id="1"
                data={{ id: '1', position: { x: 500, y: 500 } }}
                connectDragSource={mockIdentity}
                connectDragPreview={mockIdentity}
            >
                {(wrapperOptions: IWrapperOptions) => (
                    <div>
                        这是一个节点
                        {wrapperOptions.anchorDecorator({ anchorId: '1-0' })(
                            <span>锚点</span>,
                        )}
                    </div>
                )}
            </BoxContext>,
        );
        expect(baseElement).toMatchSnapshot();
    });

    test('click', () => {
        const identity = el => el;
        // eslint-disable-next-line
        const mockOnSelect = jest.fn((data, selectMode) => null);
        const div = document.createElement('div');
        const BoxContext = wrapInTestContext(NodeWrapper);
        const { container } = render(
            <BoxContext
                id="1"
                data={{ id: '1' }}
                connectDragSource={identity}
                connectDragPreview={identity}
                onSelect={mockOnSelect}
            >
                {(wrapperOptions: IWrapperOptions) => (
                    <div>
                        这是一个节点
                        {wrapperOptions.anchorDecorator({ anchorId: '1-0' })(
                            <span>锚点</span>,
                        )}
                    </div>
                )}
            </BoxContext>,
            { container: document.body.appendChild(div) },
        );
        const element = container.querySelector('.byai-topology-node-wrapper');
        fireEvent.click(element);
        fireEvent(
            element,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                metaKey: true,
            }),
        );
        fireEvent(
            element,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                metaKey: true,
                shiftKey: true,
            }),
        );
        const returnData = { id: '1', position: { x: 0, y: 0 } };
        // expect(mockOnSelect.mock.calls.length).toBe(3);
        expect(mockOnSelect.mock.calls[0][1]).toBe(SelectMode.NORMAL);
        expect(mockOnSelect.mock.calls[0][0]).toEqual(returnData);
        expect(mockOnSelect.mock.calls[1][1]).toBe(SelectMode.MUL_NORMAL);
        expect(mockOnSelect.mock.calls[1][0]).toEqual(returnData);
        expect(mockOnSelect.mock.calls[2][1]).toBe(SelectMode.MULTI);
        expect(mockOnSelect.mock.calls[2][0]).toEqual(returnData);
    });
});
