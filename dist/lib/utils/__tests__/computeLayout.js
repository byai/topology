/* eslint-disable no-undef */
import computeLayout from '../computeLayout';
import config from '../../config';
describe('computeContentCenter', function () {
    var originDocumentGetElementById = document.getElementById;
    beforeEach(function () {
        document.getElementById = function () { return ({
            getBoundingClientRect: function () { return ({
                width: 100,
                height: 100,
                left: 100,
                top: 100,
            }); },
        }); };
    });
    afterEach(function () {
        document.getElementById = originDocumentGetElementById;
    });
    test('没有节点', function () {
        var data = {
            nodes: [],
            lines: [],
        };
        expect(computeLayout(data, {})).toEqual([]);
    });
    test('单个节点', function () {
        var data = {
            nodes: [
                { id: '1' },
            ],
            lines: [],
        };
        var position = {
            x: (config.canvas.width - 100) / 2,
            y: (config.canvas.height - 100) / 2,
        };
        expect(computeLayout(data, {})).toEqual([{ id: '1', position: position }]);
    });
    test('有多个根节点', function () {
        var data = {
            nodes: [
                { id: '1' },
                { id: '2' },
            ],
            lines: [],
        };
        expect(computeLayout(data, {})).toEqual(data.nodes);
    });
    test('有多个父节点', function () {
        var data = {
            nodes: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
            lines: [
                { start: '1-0', end: '3' },
                { start: '2-0', end: '3' },
            ],
        };
        expect(computeLayout(data, {})).toEqual(data.nodes);
    });
    test('有环', function () {
        var data = {
            nodes: [
                { id: '0' },
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
            lines: [
                { start: '1-0', end: '2' },
                { start: '2-0', end: '3' },
                { start: '3-0', end: '2' },
            ],
        };
        expect(computeLayout(data, {})).toEqual(data.nodes);
    });
    test('多个节点', function () {
        var data = {
            nodes: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
            lines: [
                { start: '1-0', end: '2' },
                { start: '1-1', end: '3' },
            ],
        };
        var result = computeLayout(data, {});
        var parent = result.find(function (item) { return item.id === '1'; });
        var child2 = result.find(function (item) { return item.id === '2'; });
        var child3 = result.find(function (item) { return item.id === '3'; });
        expect(child2.position.y - parent.position.y).toBe(config.autoLayout.verticalSpacing + 100);
        // 根节点在子节点的中间
        expect(parent.position.x).toBe((config.autoLayout.horizontalSpacing + 200 - 100) / 2 + child2.position.x);
        expect(child3.position.x - child2.position.x).toBe(config.autoLayout.horizontalSpacing + 100);
    });
    test('节点排序', function () {
        var data = {
            nodes: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
            lines: [
                { start: '1-0', end: '2' },
                { start: '1-1', end: '3' },
            ],
        };
        // @ts-ignore
        var result = computeLayout(data, { sortChildren: function (parent, nodes) { return nodes.sort(function (x, y) { return -(x.id - y.id); }); } });
        var child2 = result.find(function (item) { return item.id === '2'; });
        var child3 = result.find(function (item) { return item.id === '3'; });
        expect(child2.position.x).toBeGreaterThan(child3.position.x);
    });
});
//# sourceMappingURL=computeLayout.js.map