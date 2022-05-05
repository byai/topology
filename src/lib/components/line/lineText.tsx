import { useMemo } from 'react';

export default function LineText({
    lineTextDecorator,
    position,
    line
}) {
    return useMemo(() => lineTextDecorator(position, line), []);
}
