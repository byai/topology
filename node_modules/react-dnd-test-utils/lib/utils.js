import * as React from 'react';
import TestBackendImpl from 'react-dnd-test-backend';
import { DragDropContext } from 'react-dnd';
import { act } from 'react-dom/test-utils';
/**
 * Wrap a DnD component or test case in a DragDropContext
 *
 * @param DecoratedComponent The component to decorate
 */
export function wrapInTestContext(DecoratedComponent) {
    const TestStub = (props) => React.createElement(DecoratedComponent, Object.assign({}, props));
    return DragDropContext(TestBackendImpl)(TestStub);
}
/**
 * Extracts a Backend instance from a TestContext component, such as
 * one emitted from `wrapinTestContext`
 *
 * @param instance The instance to extract the backend fram
 */
export function getBackendFromInstance(instance) {
    // Obtain a reference to the backend
    return instance.getManager().getBackend();
}
export function simulateDragDropSequence(source, target, backend) {
    act(() => {
        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();
        backend.simulateEndDrag();
    });
}
export function simulateHoverSequence(source, target, backend) {
    act(() => {
        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateEndDrag();
    });
}
