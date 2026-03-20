import type { RelationType } from '../types';
import { RELATION_TYPE_CONFIG } from '../types';

interface RelationIconProps {
    type: RelationType;
    size?: number;
    className?: string;
}

export default function RelationIcon({ type, size = 16, className = '' }: RelationIconProps) {
    const config = RELATION_TYPE_CONFIG[type];
    if (!config) return null;
    return (
        <span
            className={`inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.9 }}
        >
            {config.emoji}
        </span>
    );
}
