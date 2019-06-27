/* eslint-disable no-undef */
import deleteSelectedData from '../deleteSelectedData';

const data = {
    lines: [
        { start: '1-0', end: '2' },
        { start: '1-1', end: '3' },
        { start: '3-0', end: '4' },
        { start: '3-1', end: '5' },
        { start: '3-2', end: '6' },
        { start: '4-0', end: '7' },
        { start: '5-0', end: '8' },
        { start: '5-1', end: '9' },
    ],
    nodes: [
        { id: '1' },
        { id: '2' },
        { id: '3' },
        { id: '4' },
        { id: '5' },
        { id: '6' },
        { id: '7' },
        { id: '8' },
        { id: '9' },
    ],
};

test('deleteSelectedData', () => {
    const deleteDataA = {
        lines: [],
        nodes: [
            { id: '2' },
            { id: '5' },
        ],
    };
    const resultA = {
        lines: [
            { start: '1-1', end: '3' },
            { start: '3-0', end: '4' },
            { start: '3-2', end: '6' },
            { start: '4-0', end: '7' },
        ],
        nodes: [
            { id: '1' },
            { id: '3' },
            { id: '4' },
            { id: '6' },
            { id: '7' },
            { id: '8' },
            { id: '9' },
        ],
    };
    const deleteDataB = {
        lines: [
            { start: '1-0', end: '2' },
            { start: '1-1', end: '3' },
        ],
        nodes: [
            { id: '4' },
            { id: '5' },
            { id: '6' },
        ],
    };
    const resultB = {
        lines: [],
        nodes: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '7' },
            { id: '8' },
            { id: '9' },
        ],
    };
    expect(deleteSelectedData(data, deleteDataA)).toEqual(resultA);
    expect(deleteSelectedData(data, deleteDataB)).toEqual(resultB);
});
