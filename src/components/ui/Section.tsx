// src/components/ui/Section.tsx
'use client';
import React from 'react';

type Props = {
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

export default function Section({ title, right, children, className = '' }: Props) {
    return (
        <section className={className}>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-500">{title}</h2>
                {right}
            </div>
            {children}
        </section>
    );
}
