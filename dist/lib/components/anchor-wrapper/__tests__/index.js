/* eslint-disable no-undef */
import React from 'react';
import { cleanup } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { wrapInTestContext } from 'react-dnd-test-utils';
import TestUtils from 'react-dom/test-utils';
import AnchorWrapper from '..';
afterEach(cleanup);
test('templateWrapper', function () {
    var BoxContext = wrapInTestContext(AnchorWrapper);
    var root = TestUtils.renderIntoDocument(React.createElement(BoxContext, null));
    // @ts-ignore
    var backend = root.getManager().getBackend();
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var box = TestUtils.findRenderedComponentWithType(root, AnchorWrapper);
    backend.simulateBeginDrag([box.getHandlerId()]);
    // expect ?
});
//# sourceMappingURL=index.js.map