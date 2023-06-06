import { TestBackend } from 'react-dnd-test-backend';
import { ContextComponent, DndComponent } from 'react-dnd';
import { Backend } from 'dnd-core';
/**
 * Wrap a DnD component or test case in a DragDropContext
 *
 * @param DecoratedComponent The component to decorate
 */
export declare function wrapInTestContext(DecoratedComponent: any): any;
/**
 * Extracts a Backend instance from a TestContext component, such as
 * one emitted from `wrapinTestContext`
 *
 * @param instance The instance to extract the backend fram
 */
export declare function getBackendFromInstance<T extends Backend>(instance: ContextComponent<any>): T;
export declare function simulateDragDropSequence(source: DndComponent<any>, target: DndComponent<any>, backend: TestBackend): void;
export declare function simulateHoverSequence(source: DndComponent<any>, target: DndComponent<any>, backend: TestBackend): void;
