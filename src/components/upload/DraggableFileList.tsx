'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { palette, fonts, hexAlpha, motion } from '@/styles/brutalist';
import { formatFileSize } from '@/lib/formatters';

interface DraggableFileListProps {
    files: File[];
    onReorder: (files: File[]) => void;
}

interface DraggableFileRowProps {
    id: string;
    file: File;
}

function DraggableFileRow({ id, file }: DraggableFileRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                border: `1px solid ${hexAlpha(palette.paper, 0.08)}`,
                borderRadius: 0.5,
                bgcolor: isDragging
                    ? hexAlpha(palette.accent, 0.08)
                    : hexAlpha(palette.paper, 0.02),
                transition: `all ${motion.duration.sm} ${motion.snap}`,
                cursor: isDragging ? 'grabbing' : 'grab',
                '&:hover': {
                    borderColor: hexAlpha(palette.accent, 0.3),
                    bgcolor: hexAlpha(palette.accent, 0.04),
                },
            }}
        >
            {/* Drag handle */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    color: hexAlpha(palette.paper, 0.5),
                    transition: `color ${motion.duration.sm}`,
                    flexShrink: 0,
                    '&:active': {
                        cursor: 'grabbing',
                    },
                    '&:hover': {
                        color: palette.accent,
                    },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: 18 }} />
            </Box>

            {/* File name */}
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    color: palette.paper,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                }}
            >
                {file.name}
            </Typography>

            {/* File size */}
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.65rem',
                    color: palette.paperGhost,
                    letterSpacing: '0.1em',
                    flexShrink: 0,
                }}
            >
                {formatFileSize(file.size).toUpperCase()}
            </Typography>
        </Box>
    );
}

export function DraggableFileList({ files, onReorder }: DraggableFileListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = files.findIndex((_, i) => String(i) === String(active.id));
            const newIndex = files.findIndex((_, i) => String(i) === String(over.id));

            if (oldIndex !== -1 && newIndex !== -1) {
                const newFiles = arrayMove(files, oldIndex, newIndex);
                onReorder(newFiles);
            }
        }
    };

    const fileIds = files.map((_, i) => String(i));

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    p: 1.25,
                    border: `1px solid ${hexAlpha(palette.accent, 0.15)}`,
                    borderRadius: 1,
                    bgcolor: hexAlpha(palette.accent, 0.03),
                }}
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: palette.accent,
                        letterSpacing: '0.18em',
                        mb: 0.5,
                        textTransform: 'uppercase',
                    }}
                >
                    Reordenar archivos
                </Typography>
                <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {files.map((file, i) => (
                            <DraggableFileRow key={i} id={String(i)} file={file} />
                        ))}
                    </Box>
                </SortableContext>
            </Box>
        </DndContext>
    );
}
