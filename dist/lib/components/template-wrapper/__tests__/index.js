/* eslint-disable no-undef */
import React from 'react';
import { cleanup } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { wrapInTestContext } from 'react-dnd-test-utils';
import TestUtils from 'react-dom/test-utils';
import TemplateWrapper from '..';
afterEach(cleanup);
test('templateWrapper', function () {
    var BoxContext = wrapInTestContext(TemplateWrapper);
    var mockGenerator = jest.fn(function () { return ({ id: '1' }); });
    var root = TestUtils.renderIntoDocument(React.createElement(BoxContext, { generator: mockGenerator }));
    // @ts-ignore
    var backend = root.getManager().getBackend();
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var box = TestUtils.findRenderedComponentWithType(root, TemplateWrapper);
    backend.simulateBeginDrag([box.getHandlerId()]);
    // @ts-ignore
    expect(mockGenerator.mock.calls.length).toBe(1);
});
//# sourceMappingURL=index.js.map