import TestBackend from './TestBackend';
export default function createBackend(manager) {
    return new TestBackend(manager);
}
