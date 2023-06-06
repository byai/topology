import { useMemo } from 'react';
export default function LineText(_a) {
    var lineTextDecorator = _a.lineTextDecorator, position = _a.position, line = _a.line, data = _a.data;
    return useMemo(function () { return lineTextDecorator(position, line); }, [data]);
}
//# sourceMappingURL=lineText.js.map