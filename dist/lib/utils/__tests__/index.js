var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { shouldAutoLayout, impactCheck, createHashFromObjectArray, getNodeSize, computeTrianglePath, computeMouseClientToCanvas, computeContentCenter, computeAnchorPo, 
// computeCanvasPo,
computeNodeInputPo, } from '..';
test('shouldAutoLayout', function () {
    var nodeArray = [{ id: '1' }, { id: '2' }];
    var nodeArray2 = [{ id: '2', position: { x: 1, y: 2 } }, { id: '1' }];
    var nodeArray3 = [{ id: '2', position: { x: 1, y: 2 } }, { id: '1', position: { x: 1, y: 3 } }];
    expect(shouldAutoLayout([])).toBe(false);
    expect(shouldAutoLayout(nodeArray)).toBe(true);
    expect(shouldAutoLayout(nodeArray2)).toBe(false);
    expect(shouldAutoLayout(nodeArray3)).toBe(false);
});
test('impactCheck', function () {
    expect(impactCheck({ x: 0, y: 0 }, { width: 100, height: 100 }, { x: 0, y: 0 })).toBe(true);
    expect(impactCheck({ x: 50, y: 50 }, { width: 100, height: 100 }, { x: 150, y: 150 })).toBe(false);
    expect(impactCheck({ x: 100, y: 100 }, { width: 50, height: 50 }, { x: 0, y: 0 })).toBe(false);
});
test('createHashFromObjectArray', function () {
    expect(createHashFromObjectArray([
        { name: 'yunnan', sex: 'male' },
        { name: 'fazheng', sex: 'male' },
    ], 'name')).toEqual({
        yunnan: { name: 'yunnan', sex: 'male' },
        fazheng: { name: 'fazheng', sex: 'male' },
    });
});
describe('getNodeSize', function () {
    var flag = 0;
    var originDocumentGetElementById = document.getElementById;
    beforeEach(function () {
        if (flag === 0) {
            document.getElementById = function (id) { return ({
                getBoundingClientRect: function () { return ({
                    width: 100,
                    height: 100,
                    left: 100,
                    top: 100,
                }); },
            }); };
            flag += 1;
        }
        else {
            document.getElementById = function (id) { return null; };
        }
    });
    afterEach(function () {
        document.getElementById = originDocumentGetElementById;
    });
    test('getNodeSize', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            expect(getNodeSize('1')).toEqual({
                width: 100,
                height: 100,
                left: 100,
                top: 100,
            });
            return [2 /*return*/];
        });
    }); });
    test('getNodeSize', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            expect(getNodeSize('1')).toEqual({
                width: 0,
                height: 0,
                left: 0,
                top: 0,
            });
            return [2 /*return*/];
        });
    }); });
});
test('computeTrianglePath', function () {
    expect(computeTrianglePath({ x: 50, y: 50 }, 20)).toBe("\n    M ".concat(50, " ").concat(50, "\n    l ").concat(10, " 0\n    l ").concat(-10, " ").concat(20, "\n    l ").concat(-10, " ").concat(-20, "\n    Z\n"));
});
test('computeMouseClientToCanvas', function () {
    var wrapper = {
        scrollLeft: 1000,
        scrollTop: 1000,
        getBoundingClientRect: function () { return ({
            left: 100,
            top: 100,
        }); },
    };
    expect(computeMouseClientToCanvas(150, 150, wrapper)).toEqual({
        x: 1050,
        y: 1050,
    });
});
describe('computeContentCenter', function () {
    var originDocumentGetElementById = document.getElementById;
    beforeEach(function () {
        document.getElementById = function (id) { return ({
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
    test('数据不为空时，返回中心点', function () {
        expect(computeContentCenter([
            { id: '1', position: { x: 0, y: 0 } },
            { id: '2', position: { x: 50, y: 40 } },
            { id: '3', position: { x: 100, y: 100 } },
            { id: '4', position: { x: 0, y: 500 } },
        ])).toEqual({
            x: 100,
            y: 300,
        });
    });
    test('数据为空时，返回null', function () {
        expect(computeContentCenter([])).toBeNull();
    });
});
describe('computeAnchorPo', function () {
    var originDocumentGetElementById = document.getElementById;
    beforeAll(function () {
        document.getElementById = function (id) {
            if (/anchor-1/.test(id)) {
                return null;
            }
            if (/anchor-2/.test(id)) {
                return {
                    getBoundingClientRect: function () { return ({
                        left: 100,
                        top: 100,
                        width: 30,
                        height: 20,
                    }); },
                };
            }
            if (/anchor-3/.test(id)) {
                return {
                    getBoundingClientRect: function () { return ({
                        left: 100,
                        top: 100,
                        width: Number.NaN,
                        height: 20,
                    }); },
                };
            }
            if (/parent/.test(id)) {
                return {
                    getBoundingClientRect: function () { return ({
                        left: 50,
                        top: 50,
                    }); },
                };
            }
            return null;
        };
    });
    afterAll(function () {
        document.getElementById = originDocumentGetElementById;
    });
    test('获取不到锚点时返回null', function () {
        expect(computeAnchorPo('anchor-1', { id: 'parent' })).toBeNull();
    });
    test('正常返回锚点相对父节点的位置', function () {
        expect(computeAnchorPo('anchor-2', { id: 'parent', position: { x: 1000, y: 1000 } })).toEqual({
            x: 1065,
            y: 1070,
        });
    });
    test('计算值有NaN时返回null', function () {
        expect(computeAnchorPo('anchor-3', { id: 'parent' })).toBeNull();
    });
});
describe('computeAnchorPo', function () {
    var orgPageXOffset = window.pageXOffset;
    var orgPageYOffset = window.pageYOffset;
    beforeAll(function () {
        // @ts-ignore
        window.pageXOffset = 0;
        // @ts-ignore
        window.pageYOffset = 0;
    });
    afterAll(function () {
        // @ts-ignore
        window.pageXOffset = orgPageXOffset;
        // @ts-ignore
        window.pageYOffset = orgPageYOffset;
    });
    // test('返回画布中的坐标', () => {
    //     expect(computeCanvasPo(
    //         { x: 200, y: 200 },
    //         {
    //             scrollLeft: 100,
    //             scrollTop: 100,
    //             getBoundingClientRect: () => ({
    //                 left: 50,
    //                 top: 50,
    //             }) as ClientRect,
    //         } as HTMLDivElement,
    //     )).toEqual({
    //         x: 250,
    //         y: 250,
    //     });
    // });
});
describe('computeNodeInputPo', function () {
    var originDocumentGetElementById = document.getElementById;
    beforeAll(function () {
        document.getElementById = function (id) {
            if (/node-1/.test(id)) {
                return null;
            }
            if (/node-2/.test(id)) {
                return {
                    getBoundingClientRect: function () { return ({
                        left: 100,
                        top: 100,
                        width: 100,
                        height: 50,
                    }); },
                };
            }
            if (/node-3/.test(id)) {
                return {
                    getBoundingClientRect: function () { return ({
                        left: 100,
                        top: 100,
                        width: Number.NaN,
                        height: 20,
                    }); },
                };
            }
            return null;
        };
    });
    afterAll(function () {
        document.getElementById = originDocumentGetElementById;
    });
    test('获取不到节点时返回null', function () {
        expect(computeNodeInputPo({ id: 'node-1' })).toBeNull();
    });
    test('正常返回连接点位置', function () {
        expect(computeNodeInputPo({ id: 'node-2' })).toEqual({
            x: 50,
            y: 0,
        });
    });
    test('计算值有NaN时返回null', function () {
        expect(computeNodeInputPo({ id: 'node-3' })).toBeNull();
    });
});
//# sourceMappingURL=index.js.map