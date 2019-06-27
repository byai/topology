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
    const backend = root.getManager().getBackend();

    const box = TestUtils.findRenderedComponentWithType(root, AnchorWrapper);
    backend.simulateBeginDrag([box.getHandlerId()]);
    // expect ?
});
