import { describe, it, expect } from 'vitest';
import { buildAgentTrace } from '@/lib/agentTrace';

describe('buildAgentTrace', () => {
    describe('parseAgentReasoning with structured data', () => {
        it('should preserve structured asientos and totales fields in detalle when resumen is a string', () => {
            // Arrange
            const reasoning = {
                contador: {
                    resumen: 'Clasificación completada exitosamente',
                    asientos: [
                        {
                            cuenta_puc: '4135',
                            nombre_cuenta: 'Ventas',
                            debito: 1000,
                            credito: 0,
                        },
                    ],
                    totales: {
                        total_debito: 1000,
                        total_credito: 1000,
                    },
                    aprobado: true,
                },
            };

            // Act
            const steps = buildAgentTrace(reasoning);

            // Assert
            expect(steps).toBeDefined();
            expect(steps).toHaveLength(1);

            const step = steps![0];
            expect(step.agente).toBe('Contador');
            expect(step.accion).toBe('Clasificación completada exitosamente');
            expect(step.resultado).toBe('success');

            // The detalle should be valid JSON containing the full object, including asientos and totales
            const detalleJson = JSON.parse(step.detalle);
            expect(detalleJson).toHaveProperty('resumen', 'Clasificación completada exitosamente');
            expect(detalleJson).toHaveProperty('asientos');
            expect(detalleJson.asientos).toHaveLength(1);
            expect(detalleJson.asientos[0]).toEqual({
                cuenta_puc: '4135',
                nombre_cuenta: 'Ventas',
                debito: 1000,
                credito: 0,
            });
            expect(detalleJson).toHaveProperty('totales');
            expect(detalleJson.totales).toEqual({
                total_debito: 1000,
                total_credito: 1000,
            });
        });

        it('should extract accion from descripcion_general when available', () => {
            // Arrange
            const reasoning = {
                auditor: {
                    descripcion_general: 'Auditoría completada',
                    resumen: 'Detalles del resumen',
                    asientos: [
                        {
                            cuenta_puc: '1110',
                            nombre_cuenta: 'Bancos',
                            debito: 5000,
                            credito: 0,
                        },
                    ],
                },
            };

            // Act
            const steps = buildAgentTrace(reasoning);

            // Assert
            expect(steps).toBeDefined();
            expect(steps).toHaveLength(1);

            const step = steps![0];
            expect(step.accion).toBe('Auditoría completada');

            // detalle should still contain the full object
            const detalleJson = JSON.parse(step.detalle);
            expect(detalleJson).toHaveProperty('asientos');
            expect(detalleJson.asientos).toHaveLength(1);
        });

        it('should handle aprobado flag for resultado', () => {
            // Arrange
            const reasoningSuccess = {
                tributario: {
                    resumen: 'Clasificación tributaria correcta',
                    aprobado: true,
                    asientos: [],
                },
            };

            // Act
            const stepsSuccess = buildAgentTrace(reasoningSuccess);

            // Assert
            expect(stepsSuccess).toBeDefined();
            expect(stepsSuccess![0].resultado).toBe('success');

            // Arrange error case
            const reasoningError = {
                tributario: {
                    resumen: 'Error en clasificación tributaria',
                    aprobado: false,
                    asientos: [],
                },
            };

            // Act
            const stepsError = buildAgentTrace(reasoningError);

            // Assert
            expect(stepsError).toBeDefined();
            expect(stepsError![0].resultado).toBe('error');
        });

        it('should handle legacy array format with resumen as string', () => {
            // Arrange
            const reasoning = [
                {
                    agente: 'contador',
                    accion: 'Procesamiento contable',
                    resultado: 'success',
                    detalle: 'Clasificación completada',
                    duracion_ms: 150,
                },
            ];

            // Act
            const steps = buildAgentTrace(reasoning);

            // Assert
            expect(steps).toBeDefined();
            expect(steps).toHaveLength(1);
            expect(steps![0].detalle).toBe('Clasificación completada');
        });
    });
});
