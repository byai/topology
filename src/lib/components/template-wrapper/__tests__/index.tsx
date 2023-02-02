/* eslint-disable no-undef */
import React from 'react';
import { cleanup } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { wrapInTestContext } from 'react-dnd-test-utils';
import TestUtils from 'react-dom/test-utils';
import TemplateWrapper from '..';

afterEach(cleanup);

test('templateWrapper', () => {
    const BoxContext = wrapInTestContext(TemplateWrapper);
    const mockGenerator = jest.fn(() => ({ id: '1' }));
    const root = TestUtils.renderIntoDocument(<BoxContext generator={mockGenerator} />);
    // @ts-ignore
    const backend = root.getManager().getBackend();

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box: any = TestUtils.findRenderedComponentWithType(root, TemplateWrapper);
    backend.simulateBeginDrag([box.getHandlerId()]);

    // @ts-ignore
    expect(mockGenerator.mock.calls.length).toBe(1);
});
