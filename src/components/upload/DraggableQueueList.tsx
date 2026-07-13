'use client';

import React from 'react';
import { Box } from '@mui/material';
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
import { DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { FileUploadState, ParserMode } from '@/types';
import { palette, fonts, hexAlpha, motion } from '@/styles/brutalist';
import { UploadProgressItem } from '@/components/upload/UploadProgress';

interface DraggableQueueListProps {
    items: FileUploadState[];
    onReorderQueue: (newItems: FileUploadState[]) => void;
    onRemove: (id: string) => void;
    onCancel?: (id: string) => void;
    onSetParserMode?: (id: string, mode: ParserMode) => void;
    onSetMode?: (id: string, mode: 'pages' | 'documents') => void;
    expandedId?: string | null;
    onToggleExpand?: (id: string) => void;
    renderExpanded?: (fileState: FileUploadState) => React.ReactNode;
}

interface SortableQueueItemProps {
    fileState: FileUploadState;
    onRemove: (id: string) => void;
    onCancel?: (id: string) => void;
    onSetParserMode?: (id: string, mode: ParserMode) => void;
    onSetMode?: (id: string, mode: 'pages' | 'documents') => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    expandedContent?: React.ReactNode;
}

function SortableQueueItem({
    fileState,
    onRemove,
    onCancel,
    onSetParserMode,
    onSetMode,
    isExpanded,
    onToggleExpand,
    expandedContent,
}: SortableQueueItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: fileState.id,
        disabled: fileState.status !== 'idle',
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box ref={setNodeRef} style={style}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    position: 'relative',
                }}
            >
                {/* Drag handle — only for idle items */}
                {fileState.status === 'idle' && (
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
                            pt: 0.5,
                            '&:active': {
                                cursor: 'grabbing',
                            },
                            '&:hover': {
                                color: palette.accent,
                            },
                        }}
                        aria-label="Arrastrar para reordenar"
                    >
                        <DragIndicatorIcon sx={{ fontSize: 18 }} />
                    </Box>
                )}

                {/* Item content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <UploadProgressItem
                        fileState={fileState}
                        onRemove={onRemove}
                        onCancel={onCancel}
                        onSetParserMode={onSetParserMode}
                        onSetMode={onSetMode}
                        isExpanded={isExpanded}
                        onToggleExpand={onToggleExpand}
                        expandedContent={expandedContent}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export function DraggableQueueList({
    items,
    onReorderQueue,
    onRemove,
    onCancel,
    onSetParserMode,
    onSetMode,
    expandedId,
    onToggleExpand,
    renderExpanded,
}: DraggableQueueListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(items, oldIndex, newIndex);
                onReorderQueue(newItems);
            }
        }
    };

    const itemIds = items.map((item) => item.id);

    if (items.length === 0) {
        return null;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {items.map((fileState) => (
                            <SortableQueueItem
                                key={fileState.id}
                                fileState={fileState}
                                onRemove={onRemove}
                                onCancel={onCancel}
                                onSetParserMode={onSetParserMode}
                                onSetMode={onSetMode}
                                isExpanded={expandedId === fileState.id}
                                onToggleExpand={
                                    onToggleExpand && renderExpanded?.(fileState)
                                        ? () => onToggleExpand(fileState.id)
                                        : undefined
                                }
                                expandedContent={renderExpanded?.(fileState)}
                            />
                        ))}
                    </Box>
                </SortableContext>
            </Box>
        </DndContext>
    );
}
