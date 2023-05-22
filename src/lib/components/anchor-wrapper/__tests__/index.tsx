/* eslint-disable no-undef */
import React from 'react';
import { cleanup } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { wrapInTestContext } from 'react-dnd-test-utils';
import TestUtils from 'react-dom/test-utils';
import AnchorWrapper from '..';

afterEach(cleanup);

test('templateWrapper', () => {
    const BoxContext = wrapInTestContext(AnchorWrapper);
    const root = TestUtils.renderIntoDocument(<BoxContext />);
    // @ts-ignore
    const backend = root.getManager().getBackend();

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box: any = TestUtils.findRenderedComponentWithType(root, AnchorWrapper);
    backend.simulateBeginDrag([box.getHandlerId()]);
    // expect ?
});
