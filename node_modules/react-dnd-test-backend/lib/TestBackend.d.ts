import { DragDropManager, Backend, BeginDragOptions, HoverOptions, Identifier } from 'dnd-core';
declare function noop(): void;
export interface TestBackend extends Backend {
    didCallSetup: boolean;
    didCallTeardown: boolean;
    simulateBeginDrag(sourceIds: Identifier[], options?: any): void;
    simulatePublishDragSource(): void;
    simulateHover(targetIds: Identifier[], options?: any): void;
    simulateDrop(): void;
    simulateEndDrag(): void;
}
export default class TestBackendImpl implements Backend, TestBackend {
    didCallSetup: boolean;
    didCallTeardown: boolean;
    private actions;
    constructor(manager: DragDropManager<{}>);
    setup(): void;
    teardown(): void;
    connectDragSource(): typeof noop;
    connectDragPreview(): typeof noop;
    connectDropTarget(): typeof noop;
    simulateBeginDrag(sourceIds: Identifier[], options: BeginDragOptions): void;
    simulatePublishDragSource(): void;
    simulateHover(targetIds: Identifier[], options: HoverOptions): void;
    simulateDrop(): void;
    simulateEndDrag(): void;
}
export {};
