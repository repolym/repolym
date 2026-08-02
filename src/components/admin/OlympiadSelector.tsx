import React from 'react';
import { Select } from '../common/Input';

interface OlympiadSelectorProps {
    value: string | null;
    onChange: (value: string | null) => void;
    olympiads: { id: string; label: string }[];
}

export const OlympiadSelector: React.FC<OlympiadSelectorProps> = ({
    value,
    onChange,
    olympiads,
}) => {
    return (
        <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            options={[
                { value: '', label: 'همه المپیادها' },
                ...olympiads.map(o => ({ value: o.id, label: o.label })),
            ]}
            className="w-48"
        />
    );
};